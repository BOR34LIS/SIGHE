"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Equipment } from "./types";
import { EquipmentQrModal } from "./equipment-qr-modal";

// Panel de detalles para mostrar información de un equipo.
export function EquipmentDetailPanel({
  equipment,
  isEditMode,
  onClose,
  onUpdated,
  onDeleted,
}: {
  // El equipo a mostrar.
  equipment: Equipment;
  isEditMode: boolean;

  // Cierra el panel (lo decide el padre, este componente no sabe "cerrarse solo").
  onClose: () => void;

  // Avisa al padre que cambió algo del equipo (ej. is_disabled), para que
  // actualice su lista en memoria sin tener que volver a pedirla a Supabase.
  onUpdated: (equipment: Equipment) => void;
  // Avisa al padre que el equipo se borró, pasando solo el id (ya no hay
  // objeto completo que devolver).
  onDeleted: (id: string) => void;
}) {
  // Deshabilita los botones mientras se hace la llamada a Supabase.
  const [isSaving, setIsSaving] = useState(false);
  // Muestra el modal con el QR del equipo.
  const [showQr, setShowQr] = useState(false);

  // Invierte is_disabled (verde - rojo). update(...).select(...).single()
  // pide de vuelta la fila ya actualizada, para no tener que adivinar cómo
  // quedó — así nos aseguramos de reflejar exactamente lo que guardó la DB.
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
      // La columna is_disabled no incluye has_open_report (es un campo
      // calculado, no existe en la tabla — ver nota en add-equipment-form.tsx).
      // Si no lo copiáramos del equipo actual, se perdería el amarillo al
      // togglear el estado y volvería a quedar en false por accidente.
      onUpdated({ ...data, has_open_report: equipment.has_open_report });
    }
  }

  // Borra el equipo del mapa.
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

  // Texto y color del estado a mostrar. Se recalculan en cada render (no son
  // estado, son derivados de las props) con prioridad: rojo (inhabilitado a
  // mano por un técnico) gana sobre amarillo (tiene un reporte sin resolver),
  // que gana sobre verde (todo normal).
  const statusLabel = equipment.is_disabled
    ? "Inhabilitado"
    : equipment.has_open_report
      ? "Con reporte pendiente"
      : "Operativo";
  const statusColor = equipment.is_disabled
    ? "text-danger"
    : equipment.has_open_report
      ? "text-warning"
      : "text-success";

  return (
    // sm:flex-row: en mobile queda en columna (info arriba, botones abajo);
    // desde el breakpoint "sm" de Tailwind se acomoda en una fila horizontal.
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-text">{equipment.label}</p>
        <p className="text-sm text-text-muted">
          {equipment.type} · <span className={statusColor}>{statusLabel}</span>
        </p>
      </div>
      <div className="flex flex-wrap shrink-0 gap-2">
        {/* Abre el modal de QR (equipment-qr-modal.tsx). Siempre visible*/}
        <button
          type="button"
          onClick={() => setShowQr(true)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
        >
          Ver QR
        </button>
        {/* Texto del botón cambia según el estado actual, para que siempre
            diga la acción que va a ejecutar (no el estado actual). */}
        <button
          type="button"
          disabled={isSaving}
          onClick={handleToggleDisabled}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:opacity-60"
        >
          {equipment.is_disabled ? "Habilitar" : "Inhabilitar"}
        </button>
        {/* Única acción de este panel que sí respeta el modo edición. */}
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

      {/* Mismo patrón de renderizado condicional que el modal de
          add-equipment-form.tsx: el componente del modal ni se monta
          mientras showQr es false. */}
      {showQr && (
        <EquipmentQrModal
          equipmentId={equipment.id}
          label={equipment.label}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
}
