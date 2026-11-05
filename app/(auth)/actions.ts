"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthFormState = {
  error?: string;
  success?: string;
};

type PendingLinkResult = { error?: string };

// Esta función hace el último paso del registro: asignarle una empresa a
// la cuenta (ya sea creando una nueva, o uniéndose con un código).
// pending_company_name y pending_join_code se guardan en los metadatos del
// usuario de auth (no en una tabla) para poder leerlos después, en ese
// segundo caso.
async function linkPendingCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; user_metadata: Record<string, unknown> | null }
): Promise<PendingLinkResult> {
  const pendingCompanyName = user.user_metadata?.pending_company_name as string | undefined;
  const pendingJoinCode = user.user_metadata?.pending_join_code as string | undefined;

  if (!pendingCompanyName && !pendingJoinCode) return {};

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  // Si el perfil ya tiene empresa, o ya no es "usuario", es porque ya se
  // vinculó antes (o nunca correspondía), no se hace nada mas.
  if (profile?.role !== "usuario" || profile.company_id) return {};

  if (pendingCompanyName) {
    const { error } = await supabase.rpc("register_company_admin", {
      p_company_name: pendingCompanyName,
    });
    if (error) {
      return error.message.includes("Ya existe una empresa")
        ? { error: "Ya existe una empresa registrada con ese nombre." }
        : { error: "No se pudo crear la empresa. Intenta nuevamente." };
    }
    return {};
  }

  const { error } = await supabase.rpc("join_company_with_code", {
    p_join_code: pendingJoinCode,
  });
  return error ? { error: "Código de empresa inválido." } : {};
}

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

  // Si quedó pendiente vincular una empresa (porque faltaba confirmar el
  // correo), aquí ya hay una sesión real y se intenta terminar ese paso.
  //
  // No importa si falla (ej. el código ya no es válido) — no queremos
  // bloquear el login por eso. En el peor caso, la persona entra igual pero
  // sin empresa, y puede reintentar con un código nuevo desde el formulario
  // del home (ver app/(app)/join-company-form.tsx).
  await linkPendingCompany(supabase, data.user);

  redirect(next.startsWith("/") ? next : "/");
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const mode = String(formData.get("mode") ?? "create");
  const isJoinMode = mode === "join";
  const fullName = String(formData.get("fullName") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const joinCode = String(formData.get("joinCode") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName || !email || !password || (isJoinMode ? !joinCode : !companyName)) {
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
      // Se guarda aquí (en los metadatos del usuario, no en una tabla) por
      // si todavía no hay sesión (correo sin confirmar). login() los va a
      // leer después para terminar el registro.
      data: isJoinMode
        ? { full_name: fullName, pending_join_code: joinCode }
        : { full_name: fullName, pending_company_name: companyName },
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

  // Si llegamos aquí, ya hay sesión (la confirmación de correo está
  // desactivada, o se autoconfirma). Se reutiliza la misma función que usa
  // login() para el caso en que faltaba la sesión.
  const { error: linkError } = await linkPendingCompany(supabase, data.user);

  if (linkError) {
    // La cuenta de auth ya quedó creada, pero sin empresa asignada. La
    // borramos para que la persona pueda reintentar de cero (ej. con otro
    // nombre de empresa o código), en vez de quedar con una cuenta huérfana.
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(data.user.id);
    return { error: linkError };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
