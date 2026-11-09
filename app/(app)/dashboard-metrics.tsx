import type { DashboardMetrics, EquipmentAvailability } from "@/lib/get-dashboard-metrics";

function StatCard({
  label,
  value,
  detail,
  colorClassName = "text-text",
}: {
  label: string;
  value: string | number;
  detail?: string;
  colorClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-left">
      <p className="text-sm text-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${colorClassName}`}>{value}</p>
      {detail && <p className="mt-1 text-xs text-text-subtle">{detail}</p>}
    </div>
  );
}

function formatResolutionTime(hours: number | null) {
  if (hours === null) return "Sin datos aún";
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} días`;
}

// Las 3 tarjetas de equipos, agrupadas aparte, asi pueden ir apiladas al
// lado de "Carga por tecnico" sin que esta ultima (que crece con la
// cantidad de tecnicos) desalinee una grilla compartida.
function EquipmentStats({
  availability,
  className = "",
}: {
  availability: EquipmentAvailability;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <StatCard
        label="Equipos operativos"
        value={availability.operational}
        detail={`de ${availability.total} en total`}
        colorClassName="text-success"
      />
      <StatCard
        label="Con reporte abierto"
        value={availability.withOpenReport}
        colorClassName="text-warning"
      />
      <StatCard
        label="Equipos deshabilitados"
        value={availability.disabled}
        colorClassName="text-danger"
      />
    </div>
  );
}

export function DashboardMetricsView({ metrics }: { metrics: DashboardMetrics }) {
  const { equipmentAvailability: availability } = metrics;

  if (metrics.role !== "admin") {
    return (
      <div className="flex w-full max-w-3xl flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard label="Reportes sin tomar" value={metrics.unassignedTicketCount} />
          <StatCard label="Mis tickets asignados" value={metrics.myOpenTicketCount} />
        </div>
        <EquipmentStats availability={availability} className="sm:flex-row" />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard label="Reportes sin tomar" value={metrics.unassignedTicketCount} />
        <StatCard
          label="Tiempo promedio de resolución (últimos 30 días)"
          value={formatResolutionTime(metrics.avgResolutionHours)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
        <div className="rounded-2xl border border-border bg-surface p-4 text-left">
          <p className="text-sm text-text-muted">Carga por técnico</p>
          {metrics.technicianLoad.length === 0 ? (
            <p className="mt-2 text-sm text-text-subtle">Aún no hay técnicos en tu empresa.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {metrics.technicianLoad.map((tech) => (
                <li key={tech.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-text">{tech.name}</span>
                  <span className="shrink-0 font-medium text-text-muted">
                    {tech.openCount} {tech.openCount === 1 ? "ticket" : "tickets"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <EquipmentStats availability={availability} />
      </div>
    </div>
  );
}
