import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TicketCard } from "./ticket-card";
import { STATUS_LABELS, type SparePartOption, type TicketRow } from "./types";

export const metadata: Metadata = {
  title: "Reportes · SIGHE",
};

type SearchParams = {
  sort?: string;
  floor?: string;
  type?: string;
  status?: string;
};
// Los filtros de piso y tipo de equipo se muestran en selects, y sus opciones se cargan desde la DB
// (floors y equipment.type) para que el usuario solo pueda filtrar por valores válidos.
// El filtro de estado usa los valores fijos de TicketStatus (pendiente, en_revision, resuelto, cancelado)
// y el filtro de ordenamiento usa valores fijos (recent, floor, type).
export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { sort = "recent", floor = "", type = "", status = "" } = await searchParams;
  const supabase = await createClient();

  const [{ data: floors }, { data: equipmentRows }, { data: sparePartRows }] = await Promise.all([
    supabase.from("floors").select("id, name").order("name"),
    supabase.from("equipment").select("type").order("type"),
    supabase.from("spare_parts").select("id, name, unit, stock").order("name"),
  ]);

  const spareParts = (sparePartRows ?? []) as SparePartOption[];

  const equipmentTypes = Array.from(new Set((equipmentRows ?? []).map((e) => e.type)));

  // Consulta de tickets con filtros y ordenamiento. Se hace en el servidor (server component) para no exponer
  // la tabla completa de tickets al cliente, y para poder usar revalidatePath() en takeTicket/resolveTicket.
  let query = supabase.from("repair_tickets").select(
    `id, problem_type, description, status, created_at, resolved_at,
     equipment!inner(id, label, type, floor_id, floors(name)),
     reporter:profiles!repair_tickets_reported_by_fkey(full_name, email),
     assignee:profiles!repair_tickets_assigned_to_fkey(full_name, email)`
  );

  if (floor) query = query.eq("equipment.floor_id", floor);
  if (type) query = query.eq("equipment.type", type);
  if (status) query = query.eq("status", status);

  if (sort === "floor") {
    query = query.order("equipment(floor_id)", { ascending: true });
  } else if (sort === "type") {
    query = query.order("equipment(type)", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data } = await query;
  const tickets = (data ?? []) as unknown as TicketRow[];

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold text-text">Reportes</h1>

      <form method="GET" className="mb-6 flex flex-wrap gap-2">
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-lg border border-border bg-surface-muted px-3 text-sm text-text outline-none focus:border-primary"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          name="floor"
          defaultValue={floor}
          className="h-10 rounded-lg border border-border bg-surface-muted px-3 text-sm text-text outline-none focus:border-primary"
        >
          <option value="">Todos los pisos</option>
          {(floors ?? []).map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <select
          name="type"
          defaultValue={type}
          className="h-10 rounded-lg border border-border bg-surface-muted px-3 text-sm text-text outline-none focus:border-primary"
        >
          <option value="">Todos los tipos</option>
          {equipmentTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          name="sort"
          defaultValue={sort}
          className="h-10 rounded-lg border border-border bg-surface-muted px-3 text-sm text-text outline-none focus:border-primary"
        >
          <option value="recent">Más reciente primero</option>
          <option value="floor">Ordenar por piso</option>
          <option value="type">Ordenar por tipo de equipo</option>
        </select>

        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Filtrar
        </button>
      </form>

      {tickets.length === 0 ? (
        <p className="text-sm text-text-muted">No hay reportes que coincidan con este filtro.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} spareParts={spareParts} />
          ))}
        </div>
      )}
    </div>
  );
}
