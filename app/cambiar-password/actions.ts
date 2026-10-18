"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ChangePasswordState = {
  error?: string;
};

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "No se pudo actualizar la contraseña. Intenta nuevamente." };
  }

  await supabase.rpc("clear_must_change_password");

  redirect("/");
}
