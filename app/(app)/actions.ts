"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type JoinCompanyState = { error?: string };

// A diferencia de signup()/login(), aquí quien llama ya tiene una sesión
// segura (si no, ni siquiera llegaría a esta página — ver proxy.ts), así
// que se llama al RPC directo, sin pasar por los metadatos pendientes.
// Sirve tanto para quien nunca puso un código, como para reintentar si el
// que quedó pendiente desde el signup ya no era válido.
export async function joinCompany(
  _prevState: JoinCompanyState,
  formData: FormData
): Promise<JoinCompanyState> {
  const joinCode = String(formData.get("joinCode") ?? "").trim();

  if (!joinCode) {
    return { error: "Ingresa el código de la empresa." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_company_with_code", { p_join_code: joinCode });

  if (error) {
    return { error: "Código de empresa inválido." };
  }

  revalidatePath("/");
  return {};
}
