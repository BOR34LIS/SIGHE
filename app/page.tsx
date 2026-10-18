import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./(auth)/actions";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super administrador",
  admin: "Administrador",
  tecnico: "Técnico",
  usuario: "Usuario",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, company_id")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            SH
          </div>
          <span className="font-semibold text-text">SIGHE</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-2xl font-semibold text-text">
          {(profile?.full_name ?? profile?.email ?? "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-text">
            Hola, {profile?.full_name ?? profile?.email ?? user.email}
          </h1>
          <p className="text-sm text-text-muted">{profile?.email ?? user.email}</p>
        </div>
        <span className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-text-muted">
          Rol: {ROLE_LABELS[profile?.role ?? "usuario"]}
        </span>
        {!profile?.company_id && (
          <p className="max-w-xs text-sm text-text-subtle">
            Aún no perteneces a ninguna empresa. Un administrador debe asignarte una.
          </p>
        )}
      </main>
    </div>
  );
}
