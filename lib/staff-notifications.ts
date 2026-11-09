// Tipo y logica de mapeo compartidos entre get-staff-notifications.ts (carga
// inicial, en el servidor) y notification-bell.tsx (refetch en el cliente tras un evento de Realtime)

export type StaffNotifications = {
  pendingTickets: { id: string; equipmentLabel: string; createdAt: string }[];
  lowStockParts: { id: string; name: string; stock: number; minStock: number }[];
};

type TicketRow = { id: string; created_at: string; equipment: { label: string } | null };
type PartRow = { id: string; name: string; stock: number; min_stock: number };

export function mapStaffNotifications(
  tickets: TicketRow[] | null,
  parts: PartRow[] | null
): StaffNotifications {
  return {
    // Reportes "pendiente" = todavia nadie los tomo. Una vez que alguien le
    // da "Tomar" pasan a "en_revision" y dejan de aparecer aqui.
    pendingTickets: (tickets ?? []).map((ticket) => ({
      id: ticket.id,
      equipmentLabel: ticket.equipment?.label ?? "Equipo eliminado",
      createdAt: ticket.created_at,
    })),
    lowStockParts: (parts ?? [])
      .filter((part) => part.stock <= part.min_stock)
      .map((part) => ({
        id: part.id,
        name: part.name,
        stock: part.stock,
        minStock: part.min_stock,
      })),
  };
}
