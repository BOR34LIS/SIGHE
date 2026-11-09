import { createClient } from "@/lib/supabase/server";

export type EquipmentAvailability = {
  total: number;
  operational: number;
  withOpenReport: number;
  disabled: number;
};

export type TechnicianLoad = { id: string; name: string; openCount: number };

export type AdminDashboardMetrics = {
  role: "admin";
  unassignedTicketCount: number;
  // null = todavia no hay ningun ticket resuelto para promediar.
  avgResolutionHours: number | null;
  equipmentAvailability: EquipmentAvailability;
  technicianLoad: TechnicianLoad[];
};

export type TechnicianDashboardMetrics = {
  role: "tecnico";
  unassignedTicketCount: number;
  equipmentAvailability: EquipmentAvailability;
  myOpenTicketCount: number;
};

export type DashboardMetrics = AdminDashboardMetrics | TechnicianDashboardMetrics;

// Misma logica que ya usa el mapa (floor-canvas.tsx) para pintar
async function getEquipmentAvailability(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<EquipmentAvailability> {
  const [{ data: equipmentRows }, { data: openTickets }] = await Promise.all([
    supabase.from("equipment").select("id, is_disabled"),
    supabase
      .from("repair_tickets")
      .select("equipment_id")
      .in("status", ["pendiente", "en_revision"]),
  ]);

  const equipment = equipmentRows ?? [];
  const equipmentWithOpenReport = new Set((openTickets ?? []).map((t) => t.equipment_id));

  let operational = 0;
  let withOpenReport = 0;
  let disabled = 0;

  for (const item of equipment) {
    if (item.is_disabled) {
      disabled++;
    } else if (equipmentWithOpenReport.has(item.id)) {
      withOpenReport++;
    } else {
      operational++;
    }
  }

  return { total: equipment.length, operational, withOpenReport, disabled };
}

// Promedio en horas entre created_at y resolved_at de los tickets resueltos
// en los ultimos 30 dias (el filtro por fecha ya viene hecho en la consulta
// que llama a esta funcion).
function computeAvgResolutionHours(
  tickets: { created_at: string; resolved_at: string | null }[]
): number | null {
  const durationsMs = tickets
    .filter((t): t is { created_at: string; resolved_at: string } => t.resolved_at !== null)
    .map((t) => new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime());

  if (durationsMs.length === 0) return null;

  const avgMs = durationsMs.reduce((sum, ms) => sum + ms, 0) / durationsMs.length;
  return avgMs / (1000 * 60 * 60);
}

export async function getDashboardMetrics(
  role: "admin" | "tecnico",
  userId: string
): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const [{ count: unassignedTicketCount }, equipmentAvailability] = await Promise.all([
    supabase.from("repair_tickets").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
    getEquipmentAvailability(supabase),
  ]);

  if (role === "tecnico") {
    const { count: myOpenTicketCount } = await supabase
      .from("repair_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "en_revision")
      .eq("assigned_to", userId);

    return {
      role: "tecnico",
      unassignedTicketCount: unassignedTicketCount ?? 0,
      equipmentAvailability,
      myOpenTicketCount: myOpenTicketCount ?? 0,
    };
  }

  // Ultimos 30 dias (ventana movil, no "este mes calendario"): asi no se ve
  // vacio o con poca data justo al empezar un mes nuevo.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: resolvedTickets }, { data: technicians }, { data: openTicketsByTech }] =
    await Promise.all([
      supabase
        .from("repair_tickets")
        .select("created_at, resolved_at")
        .eq("status", "resuelto")
        .gte("resolved_at", thirtyDaysAgo),
      supabase.from("profiles").select("id, full_name, email").eq("role", "tecnico"),
      supabase
        .from("repair_tickets")
        .select("assigned_to")
        .eq("status", "en_revision")
        .not("assigned_to", "is", null),
    ]);

  const openCountByTechId = new Map<string, number>();
  for (const ticket of openTicketsByTech ?? []) {
    if (!ticket.assigned_to) continue;
    openCountByTechId.set(ticket.assigned_to, (openCountByTechId.get(ticket.assigned_to) ?? 0) + 1);
  }

  const technicianLoad: TechnicianLoad[] = (technicians ?? []).map((tech) => ({
    id: tech.id,
    name: tech.full_name ?? tech.email,
    openCount: openCountByTechId.get(tech.id) ?? 0,
  }));

  return {
    role: "admin",
    unassignedTicketCount: unassignedTicketCount ?? 0,
    avgResolutionHours: computeAvgResolutionHours(resolvedTickets ?? []),
    equipmentAvailability,
    technicianLoad,
  };
}
