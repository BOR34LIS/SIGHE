// Representa una fila de la tabla spare_parts (REPUESTO en el modelo de datos).
export type SparePart = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  stock: number;
  min_stock: number;
};

// Unidades de medida que se ofrecen al crear un repuesto.
export const UNIT_OPTIONS = ["unidad", "metro", "gramo", "litro", "caja"] as const;