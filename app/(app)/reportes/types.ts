export type TicketStatus = "pendiente" | "en_revision" | "resuelto" | "cancelado";

// El tipo TicketRow representa una fila de ticket de reparacion, con sus campos principales y
//  relaciones a equipo, quien reportó y a quien está asignado el ticket.
export type TicketRow = {
  id: string;
  problem_type: string;
  description: string | null;
  status: TicketStatus;
  created_at: string;
  equipment: {
    id: string;
    label: string;
    type: string;
    floors: { name: string } | null;
  } | null;
  reporter: { full_name: string | null; email: string } | null;
  assignee: { full_name: string | null; email: string } | null;
};

// status labels y clases de badge para cada estado de ticket, para usarse en la UI.
// Se usan en ticket-card.tsx y en reportes/page.tsx.
export const STATUS_LABELS: Record<TicketStatus, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  resuelto: "Resuelto",
  cancelado: "Cancelado",
};
// Clases de badge (Tailwind) para cada estado de ticket, para usarse en la UI.
export const STATUS_BADGE_CLASSES: Record<TicketStatus, string> = {
  pendiente: "bg-warning/15 text-warning",
  en_revision: "bg-primary/15 text-primary",
  resuelto: "bg-success/15 text-success",
  cancelado: "bg-text-subtle/15 text-text-subtle",
};
