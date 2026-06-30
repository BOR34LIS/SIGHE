import { z } from "zod";

export const equipmentStatusValues = [
  "activo",
  "en_reparacion",
  "dado_de_baja",
  "mejorado",
  "irrecuperable",
] as const;

export const equipmentSchema = z.object({
  equipment_type_id: z.string().min(1, "Seleccioná un tipo de equipo."),
  code: z.string().trim().min(1, "El código es obligatorio."),
  brand: z.string().trim().min(1, "La marca es obligatoria."),
  model: z.string().trim().min(1, "El modelo es obligatorio."),
  serial_number: z.string().trim().optional(),
  status: z.enum(equipmentStatusValues),
  assigned_user_id: z.string().optional(),
  notes: z.string().trim().optional(),
});

export type EquipmentFormValues = z.infer<typeof equipmentSchema>;
