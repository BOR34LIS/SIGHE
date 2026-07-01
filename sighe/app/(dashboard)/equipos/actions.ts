"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { equipmentSchema } from "@/lib/validations/equipment";
import { reportSchema } from "@/lib/validations/report";

export type EquipmentFormState = { error: string | null };

async function requireProfile() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!profile || !profile.company_id) redirect("/login");

  return { supabase, companyId: profile.company_id, userId: user.id };
}

function parseEquipmentForm(formData: FormData) {
  const assignedRaw = String(formData.get("assigned_user_id") ?? "");
  return equipmentSchema.safeParse({
    equipment_type_id: formData.get("equipment_type_id"),
    code: formData.get("code"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    serial_number: formData.get("serial_number"),
    status: formData.get("status"),
    assigned_user_id: assignedRaw === "none" ? "" : assignedRaw,
    notes: formData.get("notes"),
  });
}

export async function createEquipment(
  _prevState: EquipmentFormState,
  formData: FormData,
): Promise<EquipmentFormState> {
  const parsed = parseEquipmentForm(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisá los campos del formulario.",
    };
  }

  const { supabase, companyId } = await requireProfile();
  const data = parsed.data;

  const { error } = await supabase.from("equipment").insert({
    company_id: companyId,
    equipment_type_id: data.equipment_type_id,
    code: data.code,
    brand: data.brand,
    model: data.model,
    serial_number: data.serial_number || null,
    status: data.status,
    assigned_user_id: data.assigned_user_id || null,
    notes: data.notes || null,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe un equipo con ese código."
          : "No se pudo crear el equipo.",
    };
  }

  revalidatePath("/equipos");
  redirect("/equipos");
}

export async function updateEquipment(
  id: string,
  _prevState: EquipmentFormState,
  formData: FormData,
): Promise<EquipmentFormState> {
  const parsed = parseEquipmentForm(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisá los campos del formulario.",
    };
  }

  const { supabase } = await requireProfile();
  const data = parsed.data;

  const { error } = await supabase
    .from("equipment")
    .update({
      equipment_type_id: data.equipment_type_id,
      code: data.code,
      brand: data.brand,
      model: data.model,
      serial_number: data.serial_number || null,
      status: data.status,
      assigned_user_id: data.assigned_user_id || null,
      notes: data.notes || null,
    })
    .eq("id", id);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe un equipo con ese código."
          : "No se pudo actualizar el equipo.",
    };
  }

  revalidatePath("/equipos");
  revalidatePath(`/equipos/${id}`);
  redirect(`/equipos/${id}`);
}

export async function deleteEquipment(id: string): Promise<{ error: string | null }> {
  const { supabase } = await requireProfile();
  const { error } = await supabase.from("equipment").delete().eq("id", id);
  if (error) {
    return { error: "No se pudo eliminar el equipo." };
  }
  revalidatePath("/equipos");
  return { error: null };
}

export type ReportTicketState = { error: string | null; success: boolean };

export async function createTicketForEquipment(
  equipmentId: string,
  _prevState: ReportTicketState,
  formData: FormData,
): Promise<ReportTicketState> {
  const faultRaw = String(formData.get("fault_type") ?? "");
  const parsed = reportSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    fault_type: faultRaw === "none" ? undefined : faultRaw,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisá los datos del reporte.",
      success: false,
    };
  }

  const { supabase, companyId, userId } = await requireProfile();

  const { error } = await supabase.from("repair_tickets").insert({
    company_id: companyId,
    equipment_id: equipmentId,
    reported_by: userId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    fault_type: parsed.data.fault_type ?? null,
  });

  if (error) {
    return { error: "No se pudo enviar el reporte.", success: false };
  }

  revalidatePath(`/equipos/${equipmentId}`);
  return { error: null, success: true };
}
