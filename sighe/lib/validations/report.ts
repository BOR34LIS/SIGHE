import { z } from "zod";

export const faultTypeValues = ["hardware", "software"] as const;

export const reportSchema = z.object({
  title: z.string().trim().min(1, "Contanos brevemente qué pasa."),
  description: z.string().trim().optional(),
  fault_type: z.enum(faultTypeValues).optional(),
});
