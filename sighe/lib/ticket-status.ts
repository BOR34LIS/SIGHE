import type { TicketStatus } from "@/lib/supabase/database.types";

export const ticketStatusLabels: Record<TicketStatus, string> = {
  abierto: "Abierto",
  en_diagnostico: "En diagnóstico",
  en_reparacion: "En reparación",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

export const ticketStatusVariant: Record<
  TicketStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  abierto: "default",
  en_diagnostico: "secondary",
  en_reparacion: "secondary",
  cerrado: "outline",
  cancelado: "destructive",
};

export const faultTypeLabels: Record<string, string> = {
  hardware: "Hardware",
  software: "Software",
};
