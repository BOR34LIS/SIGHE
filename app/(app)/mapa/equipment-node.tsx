"use client";

import type { Equipment } from "./types";

function abbreviate(type: string) {
  return type.slice(0, 3).toUpperCase();
}

export function EquipmentNode({
  equipment,
  isEditMode,
  onPointerDown,
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
        if (!isEditMode) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        onPointerDown();
      }}
      onClick={onClick}
      style={{
        left: `${equipment.x_position}%`,
        top: `${equipment.y_position}%`,
      }}
      className={`absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-surface text-[10px] font-semibold text-white shadow-md ${
        isEditMode ? "touch-none cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${
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
