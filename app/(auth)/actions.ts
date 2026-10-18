"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthFormState = {
  error?: string;
  success?: string;
};

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error: "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
      };
    }
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect(next.startsWith("/") ? next : "/");
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName || !companyName || !email || !password) {
    return { error: "Completa todos los campos." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Ese correo ya está registrado." };
    }
    return { error: "No se pudo crear la cuenta. Intenta nuevamente." };
  }

  if (!data.user) {
    return { error: "No se pudo crear la cuenta. Intenta nuevamente." };
  }

  const { error: companyError } = await supabase.rpc("register_company_admin", {
    p_user_id: data.user.id,
    p_company_name: companyName,
  });

  if (companyError) {
    // El usuario de auth ya se creó: lo removemos para que pueda reintentar limpio
    // (ej. con otro nombre de empresa) sin quedar con una cuenta huérfana.
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(data.user.id);

    if (companyError.message.includes("Ya existe una empresa")) {
      return { error: "Ya existe una empresa registrada con ese nombre." };
    }
    return { error: "No se pudo crear la empresa. Intenta nuevamente." };
  }

  if (!data.session) {
    return {
      success: "Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.",
    };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
