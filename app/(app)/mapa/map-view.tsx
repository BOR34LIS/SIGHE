"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Floor } from "./types";
import { FloorCanvas } from "./floor-canvas";

export function MapView({ initialFloors }: { initialFloors: Floor[] }) {
  const [floors, setFloors] = useState<Floor[]>(initialFloors);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(
    initialFloors[0]?.id ?? null
  );
  const [isAddingFloor, setIsAddingFloor] = useState(false);
  const [newFloorName, setNewFloorName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateFloor() {
    const name = newFloorName.trim();
    if (!name) return;

    setIsSaving(true);
    setError(null);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("floors")
      .insert({ name, sort_order: floors.length })
      .select("id, name, sort_order, canvas_width, canvas_height")
      .single();
    setIsSaving(false);

    if (insertError || !data) {
      setError(
        insertError?.message.includes("duplicate")
          ? "Ya existe un piso con ese nombre."
          : "No se pudo crear el piso."
      );
      return;
    }

    setFloors((prev) => [...prev, data]);
    setSelectedFloorId(data.id);
    setNewFloorName("");
    setIsAddingFloor(false);
  }

  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId) ?? null;

  function handleCanvasResized(floorId: string, width: number, height: number) {
    setFloors((prev) =>
      prev.map((floor) =>
        floor.id === floorId ? { ...floor, canvas_width: width, canvas_height: height } : floor
      )
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-2.5">
        {floors.map((floor) => (
          <button
            key={floor.id}
            type="button"
            onClick={() => setSelectedFloorId(floor.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedFloorId === floor.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-text-muted hover:bg-surface-muted"
            }`}
          >
            {floor.name}
          </button>
        ))}

        {isAddingFloor ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <input
              autoFocus
              value={newFloorName}
              onChange={(e) => setNewFloorName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFloor();
                if (e.key === "Escape") setIsAddingFloor(false);
              }}
              placeholder="Nombre del piso"
              className="h-8 w-32 rounded-full border border-border bg-surface-muted px-3 text-sm text-text outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCreateFloor}
              className="h-8 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Crear
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingFloor(true)}
            className="shrink-0 rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted"
          >
            + Piso
          </button>
        )}
      </div>

      {error && (
        <p className="px-4 pt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {selectedFloor ? (
        <FloorCanvas
          key={selectedFloor.id}
          floor={selectedFloor}
          onCanvasResized={(width, height) =>
            handleCanvasResized(selectedFloor.id, width, height)
          }
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-muted">
          Crea tu primer piso para empezar a ubicar equipos.
        </div>
      )}
    </div>
  );
}
