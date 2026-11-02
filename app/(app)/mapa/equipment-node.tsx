//Este es el componente que representa un nodo de equipo en el mapa, mostrando su tipo abreviado
// y permitiendo interacciones como arrastrar y hacer clic para ver detalles.
"use client";

import type { Equipment } from "./types";

// Texto corto que se muestra dentro del circulo (ej. "Computador" -> "COM").
// No es un codigo guardado en la DB, se calcula al vuelo cada vez que se pinta.
function abbreviate(type: string) {
  return type.slice(0, 3).toUpperCase();
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
      title={equipment.label}
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
      className={`absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-surface text-[10px] font-semibold text-white shadow-md ${
        // touch-none solo en modo edicion: bloquea el scroll tactil del
        // navegador en este boton para que arrastrar no se confunda con
        // hacer scroll de la pantalla. Fuera de modo edicion no hace falta,
        // asi que se deja scrollear normalmente.
        isEditMode ? "touch-none cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${
        // Mismo orden de prioridad que en EquipmentDetailPanel: rojo
        // (inhabilitado) > amarillo (reporte pendiente) > verde (operativo).
        equipment.is_disabled
          ? "bg-danger"
          : equipment.has_open_report
            ? "bg-warning"
            : "bg-success"
      }`}
    >
      {abbreviate(equipment.type)}
    </button>
  );
}
