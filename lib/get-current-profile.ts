import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "super_admin" | "admin" | "tecnico" | "usuario";
  company_id: string | null;
};

/**
 * Memoizado por request (React cache()): varios layouts/paginas pueden llamarlo
 * en el mismo render sin repetir la consulta a Supabase.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { id: user.id, ...profile };
});
