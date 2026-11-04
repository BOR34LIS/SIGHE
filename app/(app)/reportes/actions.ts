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

export type UsedPart = { sparePartId: string; quantity: number };
export type ResolveTicketResult = { error?: string };

// "Resolver": registra los repuestos usados (si hay), descuenta el stock y deja el
// ticket en "resuelto", todo dentro de la función resolve_ticket de la base de datos.
// Si algo falla (ej. stock insuficiente) no se guarda nada. Sin repuestos = parts vacío.
export async function resolveTicket(
  ticketId: string,
  parts: UsedPart[]
): Promise<ResolveTicketResult> {
  const ctx = await getStaffContext();
  if (!ctx) {
    return { error: "No tienes permisos para resolver tickets." };
  }

  for (const part of parts) {
    if (!part.sparePartId || !Number.isInteger(part.quantity) || part.quantity <= 0) {
      return { error: "Revisa los repuestos y cantidades ingresadas." };
    }
  }

  const { error } = await ctx.supabase.rpc("resolve_ticket", {
    p_ticket_id: ticketId,
    p_parts: parts.map((part) => ({
      spare_part_id: part.sparePartId,
      quantity: part.quantity,
    })),
  });

  if (error) {
    // Estos mensajes los escribimos nosotros en la función SQL, se pueden mostrar tal cual.
    if (
      error.message.startsWith("Stock insuficiente") ||
      error.message.startsWith("Solo se pueden resolver")
    ) {
      return { error: error.message };
    }
    return { error: "No se pudo resolver el ticket. Intenta nuevamente." };
  }

  revalidatePath("/reportes");
  revalidatePath("/inventario");
  return {};
}
