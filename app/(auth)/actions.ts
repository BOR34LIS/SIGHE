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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error: "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
      };
    }
    return { error: "Correo o contraseña incorrectos." };
  }

  // Si el signup quedó pendiente porque no había sesión todavía (correo sin
  // confirmar), termina de registrar la empresa ahora que ya hay una sesión
  // real — register_company_admin usa auth.uid(), nunca un id que venga del
  // cliente, así que solo puede completar el registro de ESTA cuenta.
  const pendingCompanyName = data.user.user_metadata?.pending_company_name;
  if (pendingCompanyName) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "usuario" && !profile.company_id) {
      await supabase.rpc("register_company_admin", { p_company_name: pendingCompanyName });
    }
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
      // pending_company_name queda en los metadatos del usuario de auth
      // (no en una tabla) para el caso en que todavía no haya sesión (correo
      // sin confirmar), login() lo lee ahí para terminar el registro apenas
      // haya una sesión real.
      data: { full_name: fullName, pending_company_name: companyName },
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

  if (!data.session) {
    return {
      success: "Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.",
    };
  }

  // Ya hay sesión (confirmación de correo desactivada o autoconfirmada)
  // register_company_admin ya no recibe ningún id, usa auth.uid()
  // solo puede registrar la empresa de la cuenta que está autenticada ahora mismo.
  const { error: companyError } = await supabase.rpc("register_company_admin", {
    p_company_name: companyName,
  });

  if (companyError) {
    // El usuario de auth ya se creó, lo removemos para que pueda reintentar limpio
    // (ej. con otro nombre de empresa) sin quedar con una cuenta huérfana.
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(data.user.id);

    if (companyError.message.includes("Ya existe una empresa")) {
      return { error: "Ya existe una empresa registrada con ese nombre." };
    }
    return { error: "No se pudo crear la empresa. Intenta nuevamente." };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
