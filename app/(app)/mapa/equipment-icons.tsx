import { createElement } from "react";
import { getIconComponent } from "./icon-catalog";

// Este componente es un wrapper que recibe la key de un icono y devuelve el
// componente de icono correspondiente (de lucide-react). Se usa en el nodo del
// mapa (equipment-node.tsx) y en el selector de icono (add-equipment-form.tsx).
export function EquipmentTypeIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  return createElement(getIconComponent(iconKey), { className });
}
