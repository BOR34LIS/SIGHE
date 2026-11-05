"use server";

import { randomInt } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateUserState = {
  error?: string;
  success?: { email: string; tempPassword: string };
};

// Evita caracteres ambiguos (0/O, 1/l/I) para que sea fácil de transcribir.
const PASSWORD_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";

function generateTempPassword(length = 12): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARSET[randomInt(PASSWORD_CHARSET.length)];
  }
  return password;
}

// Devuelve el id de la empresa del admin logueado, o null si no es admin o no tiene empresa.
async function getAuthorizedAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" || !profile.company_id) return null;

  return { companyId: profile.company_id };
}

// Crea un usuario con el rol de técnico y lo vincula a la empresa del admin logueado.
export async function createCompanyUser(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const admin = await getAuthorizedAdmin();
  if (!admin) {
    return { error: "No tienes permisos para realizar esta acción." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Ingresa un correo." };
  }

  const tempPassword = generateTempPassword();
  const adminClient = createAdminClient();

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError || !created.user) {
    if (createError?.message.toLowerCase().includes("already been registered")) {
      return { error: "Ese correo ya tiene una cuenta." };
    }
    return { error: "No se pudo crear la cuenta. Intenta nuevamente." };
  }

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      company_id: admin.companyId,
      role: "tecnico",
      must_change_password: true,
    })
    .eq("id", created.user.id);

  if (updateError) {
    // La cuenta de auth ya se creó pero no se pudo vincular a la empresa/rol: la removemos
    // para no dejar un usuario huérfano y que el admin pueda reintentar limpio.
    await adminClient.auth.admin.deleteUser(created.user.id);
    return { error: "No se pudo asignar la empresa/rol. Intenta nuevamente." };
  }

  return { success: { email, tempPassword } };
}

export type RegenerateJoinCodeState = { error?: string; joinCode?: string };

// Invalida el código actual (ej. si se filtró) y entrega uno nuevo — ver
// migración company_join_code: regenerate_company_join_code ya valida que
// quien llama sea admin de su propia empresa.
export async function regenerateJoinCode(): Promise<RegenerateJoinCodeState> {
  const admin = await getAuthorizedAdmin();
  if (!admin) {
    return { error: "No tienes permisos para realizar esta acción." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("regenerate_company_join_code");

  if (error) {
    return { error: "No se pudo regenerar el código. Intenta nuevamente." };
  }

  return { joinCode: data as string };
}
