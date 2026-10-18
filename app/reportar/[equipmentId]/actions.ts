"use server";

import { createClient } from "@/lib/supabase/server";

export type ReportFormState = {
  error?: string;
  success?: boolean;
};

export async function createReport(
  _prevState: ReportFormState,
  formData: FormData
): Promise<ReportFormState> {
  const equipmentId = String(formData.get("equipmentId") ?? "");
  const problemType = String(formData.get("problemType") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!equipmentId || !problemType) {
    return { error: "Faltan datos del reporte." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión para reportar." };
  }

  const { error } = await supabase.from("repair_tickets").insert({
    equipment_id: equipmentId,
    problem_type: problemType,
    description: description || null,
  });

  if (error) {
    return { error: "No se pudo enviar el reporte. Intenta nuevamente." };
  }

  return { success: true };
}
