import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la service role key: omite RLS por completo.
 * Usar SOLO dentro de Server Actions/route handlers ya protegidos por un
 * chequeo de rol explícito (ver app/admin/layout.tsx). Nunca exponer al cliente.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
