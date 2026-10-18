"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CANVAS_MAX_SIZE, CANVAS_MIN_SIZE, type Equipment, type Floor } from "./types";
import { EquipmentNode } from "./equipment-node";
import { AddEquipmentButton } from "./add-equipment-form";
import { EquipmentDetailPanel } from "./equipment-detail-panel";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

export function FloorCanvas({
  floor,
  onCanvasResized,
}: {
  floor: Floor;
  onCanvasResized: (width: number, height: number) => void;
}) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [canvasSize, setCanvasSize] = useState({
    width: floor.canvas_width,
    height: floor.canvas_height,
  });
  const [zoom, setZoom] = useState(1);
  const draggingId = useRef<string | null>(null);
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const supabase = createClient();
    supabase
      .from("equipment")
      .select("id, floor_id, type, label, x_position, y_position, is_disabled")
      .eq("floor_id", floor.id)
      .then(({ data }) => {
        if (!cancelled) {
          setEquipment(data ?? []);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [floor.id]);

  function positionFromPointer(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isEditMode || !draggingId.current) return;
    const { x, y } = positionFromPointer(e.clientX, e.clientY);
    setEquipment((prev) =>
      prev.map((item) =>
        item.id === draggingId.current ? { ...item, x_position: x, y_position: y } : item
      )
    );
  }

  async function handlePointerUp() {
    const id = draggingId.current;
    draggingId.current = null;
    if (!id) return;

    const item = equipment.find((e) => e.id === id);
    if (!item) return;

    const supabase = createClient();
    await supabase
      .from("equipment")
      .update({ x_position: item.x_position, y_position: item.y_position })
      .eq("id", id);
  }

  function handleResizePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: canvasSize.width,
      height: canvasSize.height,
    };
  }

  function handleResizePointerMove(e: React.PointerEvent) {
    if (!resizeStart.current) return;
    e.stopPropagation();
    // Las coordenadas del puntero son pixeles de pantalla; como el lienzo esta
    // escalado por "zoom", hay que convertir el desplazamiento a unidades del lienzo.
    const dx = (e.clientX - resizeStart.current.x) / zoom;
    const dy = (e.clientY - resizeStart.current.y) / zoom;
    setCanvasSize({
      width: clamp(resizeStart.current.width + dx, CANVAS_MIN_SIZE, CANVAS_MAX_SIZE),
      height: clamp(resizeStart.current.height + dy, CANVAS_MIN_SIZE, CANVAS_MAX_SIZE),
    });
  }

  async function handleResizePointerUp(e: React.PointerEvent) {
    if (!resizeStart.current) return;
    e.stopPropagation();
    resizeStart.current = null;

    const supabase = createClient();
    await supabase
      .from("floors")
      .update({ canvas_width: canvasSize.width, canvas_height: canvasSize.height })
      .eq("id", floor.id);
    onCanvasResized(canvasSize.width, canvasSize.height);
  }

  function handleEquipmentAdded(newItem: Equipment) {
    setEquipment((prev) => [...prev, newItem]);
  }

  function handleEquipmentUpdated(updated: Equipment) {
    setEquipment((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  function handleEquipmentDeleted(id: string) {
    setEquipment((prev) => prev.filter((item) => item.id !== id));
    setSelectedId(null);
  }

  const selectedEquipment = equipment.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-text-muted">
          {isEditMode
            ? "Arrastra un equipo para ubicarlo, o la esquina inferior derecha para cambiar el tamaño del piso."
            : "Toca un equipo para ver sus detalles."}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {isEditMode && <AddEquipmentButton floorId={floor.id} onAdded={handleEquipmentAdded} />}
          <div className="flex items-center gap-0.5 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.round(clamp(z - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX) * 100) / 100)}
              disabled={zoom <= ZOOM_MIN}
              className="flex h-8 w-8 items-center justify-center text-text transition-colors hover:bg-surface-muted disabled:opacity-40"
              aria-label="Alejar"
            >
              −
            </button>
            <span className="w-11 text-center text-xs font-medium text-text-muted">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.round(clamp(z + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX) * 100) / 100)}
              disabled={zoom >= ZOOM_MAX}
              className="flex h-8 w-8 items-center justify-center text-text transition-colors hover:bg-surface-muted disabled:opacity-40"
              aria-label="Acercar"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsEditMode((prev) => !prev)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              isEditMode
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-text transition-colors hover:bg-surface-muted"
            }`}
          >
            {isEditMode ? "Listo" : "Editar mapa"}
          </button>
        </div>
      </div>

      <div className="h-[65vh] min-h-80 w-full overflow-auto rounded-2xl border border-dashed border-border bg-background">
        {/* "Sizer": define el area real de scroll (ya escalada). El canvas interno
            conserva sus dimensiones sin escalar para que el % de los equipos no cambie. */}
        <div style={{ width: canvasSize.width * zoom, height: canvasSize.height * zoom }}>
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
            className="relative bg-surface-muted"
          >
            {isLoading && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-text-subtle">
                Cargando equipos...
              </p>
            )}

            {!isLoading && equipment.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-text-subtle">
                {isEditMode
                  ? 'No hay equipos en este piso todavía. Usa "+ Equipo" para agregar el primero.'
                  : "No hay equipos en este piso todavía."}
              </p>
            )}

            {equipment.map((item) => (
              <EquipmentNode
                key={item.id}
                equipment={item}
                isEditMode={isEditMode}
                onPointerDown={() => {
                  if (isEditMode) draggingId.current = item.id;
                }}
                onClick={() => setSelectedId(item.id)}
              />
            ))}

            {isEditMode && (
              <div
                onPointerDown={handleResizePointerDown}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                title="Arrastra para cambiar el tamaño del piso"
                className="absolute bottom-0 right-0 flex h-6 w-6 touch-none cursor-nwse-resize items-center justify-center rounded-tl-lg border-l border-t border-border bg-primary text-primary-foreground"
              >
                <svg viewBox="0 0 10 10" className="h-3 w-3 fill-current">
                  <circle cx="8" cy="8" r="1" />
                  <circle cx="8" cy="4.5" r="1" />
                  <circle cx="4.5" cy="8" r="1" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditMode && (
        <p className="text-xs text-text-subtle">
          Tamaño del piso: {Math.round(canvasSize.width)} × {Math.round(canvasSize.height)} px
        </p>
      )}

      {selectedEquipment && (
        <EquipmentDetailPanel
          equipment={selectedEquipment}
          isEditMode={isEditMode}
          onClose={() => setSelectedId(null)}
          onUpdated={handleEquipmentUpdated}
          onDeleted={handleEquipmentDeleted}
        />
      )}
    </div>
  );
}
