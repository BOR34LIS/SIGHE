import type { EquipmentStatus } from "@/lib/supabase/database.types";

export const statusLabels: Record<EquipmentStatus, string> = {
  activo: "Activo",
  en_reparacion: "En reparación",
  dado_de_baja: "Dado de baja",
  mejorado: "Mejorado",
  irrecuperable: "Irrecuperable",
};

export const statusVariant: Record<
  EquipmentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  activo: "default",
  en_reparacion: "secondary",
  dado_de_baja: "outline",
  mejorado: "secondary",
  irrecuperable: "destructive",
};
