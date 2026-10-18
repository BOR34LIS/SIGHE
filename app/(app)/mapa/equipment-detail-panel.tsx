"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Equipment } from "./types";

export function EquipmentDetailPanel({
  equipment,
  isEditMode,
  onClose,
  onUpdated,
  onDeleted,
}: {
  equipment: Equipment;
  isEditMode: boolean;
  onClose: () => void;
  onUpdated: (equipment: Equipment) => void;
  onDeleted: (id: string) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleToggleDisabled() {
    setIsSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("equipment")
      .update({ is_disabled: !equipment.is_disabled })
      .eq("id", equipment.id)
      .select("id, floor_id, type, label, x_position, y_position, is_disabled")
      .single();
    setIsSaving(false);

    if (!error && data) {
      onUpdated(data);
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${equipment.label}" del mapa?`)) return;

    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("equipment").delete().eq("id", equipment.id);
    setIsSaving(false);

    if (!error) {
      onDeleted(equipment.id);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
      <div>
        <p className="font-medium text-text">{equipment.label}</p>
        <p className="text-sm text-text-muted">
          {equipment.type} ·{" "}
          <span className={equipment.is_disabled ? "text-danger" : "text-success"}>
            {equipment.is_disabled ? "Inhabilitado" : "Operativo"}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleToggleDisabled}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:opacity-60"
        >
          {equipment.is_disabled ? "Habilitar" : "Inhabilitar"}
        </button>
        {isEditMode && (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleDelete}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-surface-muted disabled:opacity-60"
          >
            Eliminar
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
