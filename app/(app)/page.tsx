import Link from "next/link";
import { getCurrentProfile } from "@/lib/get-current-profile";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super administrador",
  admin: "Administrador",
  tecnico: "Técnico",
  usuario: "Usuario",
};

export default async function HomePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-2xl font-semibold text-text">
        {(profile?.full_name ?? profile?.email ?? "?").charAt(0).toUpperCase()}
      </div>
      <div>
        <h1 className="text-lg font-semibold text-text">
          Hola, {profile?.full_name ?? profile?.email}
        </h1>
        <p className="text-sm text-text-muted">{profile?.email}</p>
      </div>
      <span className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-text-muted">
        Rol: {ROLE_LABELS[profile?.role ?? "usuario"]}
      </span>
      {!profile?.company_id && (
        <p className="max-w-xs text-sm text-text-subtle">
          Aún no perteneces a ninguna empresa. Un administrador debe asignarte una.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(profile?.role === "admin" || profile?.role === "tecnico") && (
          <Link
            href="/mapa"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Mapa de equipos
          </Link>
        )}
        {profile?.role === "admin" && (
          <Link
            href="/admin/usuarios"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
          >
            Panel de administración
          </Link>
        )}
      </div>
    </div>
  );
}
