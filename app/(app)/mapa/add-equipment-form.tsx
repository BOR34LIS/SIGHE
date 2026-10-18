"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EQUIPMENT_TYPE_PRESETS, type Equipment } from "./types";

export function AddEquipmentButton({
  floorId,
  onAdded,
}: {
  floorId: string;
  onAdded: (equipment: Equipment) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<string>(EQUIPMENT_TYPE_PRESETS[0]);
  const [customType, setCustomType] = useState("");
  const [label, setLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setType(EQUIPMENT_TYPE_PRESETS[0]);
    setCustomType("");
    setLabel("");
    setError(null);
  }

  async function handleSubmit() {
    const finalType = type === "Otro" ? customType.trim() : type;
    const finalLabel = label.trim();

    if (!finalType || !finalLabel) {
      setError("Completa el tipo y el nombre del equipo.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("equipment")
      .insert({
        floor_id: floorId,
        type: finalType,
        label: finalLabel,
        x_position: 50,
        y_position: 50,
      })
      .select("id, floor_id, type, label, x_position, y_position, is_disabled")
      .single();

    setIsSaving(false);

    if (insertError || !data) {
      setError("No se pudo agregar el equipo.");
      return;
    }

    onAdded(data);
    reset();
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        + Equipo
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-lg">
            <h2 className="mb-4 font-semibold text-text">Agregar equipo</h2>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {EQUIPMENT_TYPE_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </div>

              {type === "Otro" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text">Especifica el tipo</label>
                  <input
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Ej: Escáner"
                    className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">Nombre / identificador</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ej: PC Recepción"
                  className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error && (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    reset();
                  }}
                  className="h-11 flex-1 rounded-lg border border-border font-medium text-text transition-colors hover:bg-surface-muted"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSubmit}
                  className="h-11 flex-1 rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                  {isSaving ? "Guardando..." : "Agregar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
