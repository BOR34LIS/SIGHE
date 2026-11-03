import {
  Computer,
  Laptop,
  Monitor,
  Printer,
  Scan,
  Phone,
  Smartphone,
  Tv,
  Router,
  Projector,
  Server,
  Camera,
  Speaker,
  Keyboard,
  Mouse,
  HardDrive,
  Wifi,
  Headphones,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { EQUIPMENT_TYPE_PRESETS } from "./types";

export type IconKey =
  | "computer"
  | "laptop"
  | "monitor"
  | "printer"
  | "scan"
  | "phone"
  | "smartphone"
  | "tv"
  | "router"
  | "projector"
  | "server"
  | "camera"
  | "speaker"
  | "keyboard"
  | "mouse"
  | "hard-drive"
  | "wifi"
  | "headphones"
  | "generic";

// Tanto el selector de icono (add-equipment-form.tsx) como el
// nodo del mapa (equipment-icons.tsx) leen de este mismo catalogo, asi nunca
// se desincronizan.
export const ICON_CATALOG: { key: IconKey; label: string; Icon: LucideIcon }[] = [
  { key: "computer", label: "Computador", Icon: Computer },
  { key: "laptop", label: "Laptop", Icon: Laptop },
  { key: "monitor", label: "Monitor", Icon: Monitor },
  { key: "printer", label: "Impresora", Icon: Printer },
  { key: "scan", label: "Escáner", Icon: Scan },
  { key: "phone", label: "Teléfono", Icon: Phone },
  { key: "smartphone", label: "Celular", Icon: Smartphone },
  { key: "tv", label: "Televisor", Icon: Tv },
  { key: "router", label: "Router", Icon: Router },
  { key: "projector", label: "Proyector", Icon: Projector },
  { key: "server", label: "Servidor", Icon: Server },
  { key: "camera", label: "Cámara", Icon: Camera },
  { key: "speaker", label: "Parlante", Icon: Speaker },
  { key: "keyboard", label: "Teclado", Icon: Keyboard },
  { key: "mouse", label: "Mouse", Icon: Mouse },
  { key: "hard-drive", label: "Disco / NAS", Icon: HardDrive },
  { key: "wifi", label: "Access point", Icon: Wifi },
  { key: "headphones", label: "Audífonos", Icon: Headphones },
  { key: "generic", label: "Genérico", Icon: HelpCircle },
];

// .find() recorre ICON_CATALOG uno por uno hasta encontrar el que tiene esa
// key (o hasta el final, si ninguno calza).
export function getIconComponent(key: string): LucideIcon {
  return ICON_CATALOG.find((item) => item.key === key)?.Icon ?? HelpCircle;
}

// Icono automatico para cada preset del selector de "Tipo" (todos menos
// "Otro", que es el unico caso donde la persona elige el icono a mano).
export const PRESET_ICON_KEYS: Partial<Record<(typeof EQUIPMENT_TYPE_PRESETS)[number], IconKey>> = {
  Computador: "computer",
  Monitor: "monitor",
  Impresora: "printer",
  "Escáner": "scan",
  "Teléfono": "phone",
  Fax: "printer",
  Televisor: "tv",
  Router: "router",
  Proyector: "projector",
};
