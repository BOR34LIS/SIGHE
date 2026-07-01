import type { TicketStatus } from "@/lib/supabase/database.types";

export const ticketStatusLabels: Record<TicketStatus, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  resuelto: "Resuelto",
  cancelado: "Cancelado",
};

export const ticketStatusVariant: Record<
  TicketStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pendiente: "default",
  en_revision: "secondary",
  resuelto: "outline",
  cancelado: "destructive",
};

export const faultTypeLabels: Record<string, string> = {
  hardware: "Hardware",
  software: "Software",
};
