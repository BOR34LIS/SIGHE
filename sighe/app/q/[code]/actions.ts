"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { reportSchema } from "@/lib/validations/report";

export type ReportFormState = { error: string | null; success: boolean };

export async function createPublicReport(
  qrCode: string,
  _prevState: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
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

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.rpc("public_create_repair_ticket", {
    p_qr_code: qrCode,
    p_title: parsed.data.title,
    p_description: parsed.data.description || null,
    p_fault_type: parsed.data.fault_type ?? null,
  });

  if (error) {
    return { error: "No se pudo enviar el reporte. Probá de nuevo.", success: false };
  }

  return { error: null, success: true };
}
