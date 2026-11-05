import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { CreateUserForm } from "./create-user-form";
import { JoinCodeCard } from "./join-code-card";

export const metadata: Metadata = {
  title: "Usuarios · SIGHE",
};

export default async function AdminUsuariosPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("join_code")
    .eq("id", profile!.company_id!)
    .single();

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm">
        <JoinCodeCard initialJoinCode={company?.join_code ?? ""} />

        <div className="mb-6">
          <h1 className="text-lg font-semibold text-text">Crear usuario con el rol de técnico</h1>
          <p className="text-sm text-text-muted">
            Se crea la cuenta con una contraseña temporal que deberá cambiarse en el primer
            inicio de sesión.
          </p>
        </div>
        <CreateUserForm />
      </div>
    </div>
  );
}
