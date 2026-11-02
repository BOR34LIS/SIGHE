"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";


async function getStaffContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
// Solo admins y tecnicos pueden tomar o resolver tickets, no otros roles ni usuarios anonimos.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id || (profile.role !== "admin" && profile.role !== "tecnico")) {
    return null;
  }

  return { supabase, userId: user.id };
}

// "Tomar": el técnico se autoasigna el ticket y pasa a en_revision.
export async function takeTicket(ticketId: string) {
  const ctx = await getStaffContext();
  if (!ctx) return;

  await ctx.supabase
    .from("repair_tickets")
    .update({ status: "en_revision", assigned_to: ctx.userId })
    .eq("id", ticketId);

  revalidatePath("/reportes");
}

// "Resolver": por ahora sin registrar repuestos (eso se agrega cuando exista
// el inventario). Cualquier admin/tecnico de la empresa puede resolver,
// no solo quien lo tomó.
export async function resolveTicket(ticketId: string) {
  const ctx = await getStaffContext();
  if (!ctx) return;

  await ctx.supabase
    .from("repair_tickets")
    .update({ status: "resuelto", resolved_at: new Date().toISOString() })
    .eq("id", ticketId);

  revalidatePath("/reportes");
}
