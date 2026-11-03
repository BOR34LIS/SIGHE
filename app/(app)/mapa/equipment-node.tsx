//Este es el componente que representa un nodo de equipo en el mapa, mostrando su icono
// y permitiendo interacciones como arrastrar y hacer clic para ver detalles.
"use client";

import { X, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Equipment } from "./types";
import { EquipmentTypeIcon } from "./equipment-icons";

// Texto corto para el tooltip/lector de pantalla: incluye el estado en
// palabras (no solo color), para que tambien quede accesible sin depender
// de distinguir verde/amarillo/rojo.
function titleFor(equipment: Equipment) {
  if (equipment.is_disabled) return `${equipment.label} — Inhabilitado`;
  if (equipment.has_open_report) return `${equipment.label} — Con reporte pendiente`;
  return equipment.label;
}

// Los iconos de lucide-react son solo trazo (sin relleno), asi que no hay
// "borde" que agregarle a una sola copia. El truco: dibujar el mismo icono
// DOS veces, superpuesto — una copia de atras mas gruesa y oscura (hace de
// delineado) y una de adelante mas fina con el color real encima. Ademas el
// color va fijo (no el token --color-warning/--color-danger, que cambia
// entre tema claro/oscuro): la insignia siempre tiene fondo blanco, y el
// amarillo del tema oscuro (#facc15, bien clarito) casi no se distingue
// sobre blanco.
function OutlinedBadgeIcon({
  Icon,
  colorClassName,
  // Ajuste optico fino: un triangulo (mas "pesado" visualmente abajo, por la
  // base ancha) puede verse corrido aunque su caja contenedora este centrada
  // matematicamente. Permite compensar con un pequeño desplazamiento, sin
  // afectar iconos que si se ven centrados por defecto (como la X).
  nudgeClassName = "",
}: {
  Icon: LucideIcon;
  colorClassName: string;
  nudgeClassName?: string;
}) {
  return (
    <span className={`relative flex h-4 w-4 items-center justify-center ${nudgeClassName}`}>
      <Icon className="absolute h-4 w-4 text-zinc-900" strokeWidth={5} />
      <Icon className={`relative h-4 w-4 ${colorClassName}`} strokeWidth={2.5} />
    </span>
  );
}

export function EquipmentNode({
  equipment,
  // Si esta en false, el nodo no es arrastrable (ver onPointerDown mas abajo)
  // y se muestra como un simple circulo clickeable.
  isEditMode,
  // FloorCanvas (el padre) es quien sabe CUAL equipo se esta arrastrando: este
  // componente solo avisa "me tocaron a mi", no mueve nada por su cuenta.
  onPointerDown,
  // Abre el panel de detalle (EquipmentDetailPanel) en el padre.
  onClick,
}: {
  equipment: Equipment;
  isEditMode: boolean;
  onPointerDown: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={titleFor(equipment)}
      onPointerDown={(e) => {
        // Fuera de modo edicion no se arrastra nada.
        if (!isEditMode) return;
        // setPointerCapture hace que los eventos de pointermove/pointerup
        // sigan llegando a ESTE boton aunque el dedo/mouse se mueva fuera de
        // sus limites durante el arrastre (sin esto, al mover el puntero
        // rapido se "pierde" el elemento y el arrastre se corta a mitad de camino).
        e.currentTarget.setPointerCapture(e.pointerId);
        onPointerDown();
      }}
      onClick={onClick}
      // Posicion absoluta en porcentaje del contenedor (FloorCanvas), no en
      // pixeles fijos: asi el equipo queda en el mismo lugar relativo aunque
      // se haga zoom o se cambie el tamaño del piso.
      style={{
        left: `${equipment.x_position}%`,
        top: `${equipment.y_position}%`,
      }}
      // -translate-x-1/2 y -translate-y-6 centran el nodo respecto a su punto de anclaje
      // (ya que la etiqueta y el circulo del icono no tienen el mismo tamaño que el punto de referencia).
      className={`absolute flex -translate-x-1/2 -translate-y-6 flex-col items-center gap-1 ${
        // touch-none solo en modo edicion para bloquear el scroll 
        isEditMode ? "touch-none cursor-grab active:cursor-grabbing" : "cursor-pointer"
      }`}
    >
      {/* El circulo de color (relative: es el ancla para la insignia de
          estado, definida mas abajo DENTRO de este mismo span — se posiciona
          con absolute respecto al circulo, no respecto a todo el boton). */}
      <span
        className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-surface shadow-md ${
          equipment.is_disabled
            ? "bg-danger"
            : equipment.has_open_report
              ? "bg-warning"
              : "bg-success"
        }`}
      >
        {/* Gris oscuro fijo, se eligio asi para que el icono se siga leyendo igual de bien
            sobre cualquiera de los 3 colores de fondo (verde/amarillo/rojo). */}
        <EquipmentTypeIcon iconKey={equipment.icon} className="h-5 w-5 text-zinc-800" />

        {/* Insignia de estado: no depende solo del color del circulo. Rojo y
            amarillo llevan ademas una forma + icono distintos (X vs triangulo
            de alerta), para que tambien se distingan sin percibir el color
            (ej. daltonismo). Operativo no muestra insignia. */}
        {equipment.is_disabled && (
          <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-surface bg-white">
            <OutlinedBadgeIcon Icon={X} colorClassName="text-red-600" />
          </span>
        )}
        {!equipment.is_disabled && equipment.has_open_report && (
          <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-surface bg-white">
            <OutlinedBadgeIcon
              Icon={TriangleAlert}
              colorClassName="text-amber-500"
              nudgeClassName="-translate-y-0.4"
            />
          </span>
        )}
      </span>

      {/* Esta es la etiqueta, la pone quien agrega el equipo (ver add-equipment-form.tsx,
          campo "Nombre / identificador")*/}
      <span className="max-w-20 truncate rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text shadow-sm">
        {equipment.label}
      </span>
    </button>
  );
}
