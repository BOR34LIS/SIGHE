export type Floor = {
  id: string;
  name: string;
  sort_order: number;
  canvas_width: number;
  canvas_height: number;
};

export const CANVAS_MIN_SIZE = 300;
export const CANVAS_MAX_SIZE = 6000;

export type Equipment = {
  id: string;
  floor_id: string;
  type: string;
  label: string;
  icon: string;
  x_position: number;
  y_position: number;
  is_disabled: boolean;
  has_open_report: boolean;
};

export const EQUIPMENT_TYPE_PRESETS = [
  "Computador",
  "Monitor",
  "Impresora",
  "Escáner",
  "Teléfono",
  "Fax",
  "Televisor",
  "Router",
  "Proyector",
  "Otro",
] as const;
