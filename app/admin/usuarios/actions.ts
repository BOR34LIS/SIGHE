"use server";

import { randomInt } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateUserState = {
  error?: string;
  success?: { email: string; tempPassword: string };
};

const ALLOWED_ROLES = ["usuario", "tecnico"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

// Evita caracteres ambiguos (0/O, 1/l/I) para que sea fácil de transcribir.
const PASSWORD_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";

function generateTempPassword(length = 12): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARSET[randomInt(PASSWORD_CHARSET.length)];
  }
  return password;
}

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

export async function createCompanyUser(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const admin = await getAuthorizedAdmin();
  if (!admin) {
    return { error: "No tienes permisos para realizar esta acción." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");

  if (!email) {
    return { error: "Ingresa un correo." };
  }

  if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
    return { error: "Rol inválido." };
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
      role,
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
