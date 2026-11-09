import { getCurrentProfile } from "@/lib/get-current-profile";
import { getDashboardMetrics } from "@/lib/get-dashboard-metrics";
import { JoinCompanyForm } from "./join-company-form";
import { DashboardMetricsView } from "./dashboard-metrics";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super administrador",
  admin: "Administrador",
  tecnico: "Técnico",
  usuario: "Usuario",
};

export default async function HomePage() {
  const profile = await getCurrentProfile();

  // Solo admin/tecnico con empresa ven las metricas del dashboard.
  const isStaff = profile?.role === "admin" || profile?.role === "tecnico";
  const metrics =
    isStaff && profile?.company_id
      ? await getDashboardMetrics(profile.role as "admin" | "tecnico", profile.id)
      : null;

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
      {!profile?.company_id && <JoinCompanyForm />}
      {metrics && <DashboardMetricsView metrics={metrics} />}
    </div>
  );
}
