"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CANVAS_MAX_SIZE, CANVAS_MIN_SIZE, type Equipment, type Floor } from "./types";
import { EquipmentNode } from "./equipment-node";
import { AddEquipmentButton } from "./add-equipment-form";
import { EquipmentDetailPanel } from "./equipment-detail-panel";

// Fuerza un numero a quedar dentro de un rango [min, max]. Se usa tanto para
// el tamaño del lienzo como para el zoom, asi evitamos repetir Math.min/Math.max.
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

export function FloorCanvas({
  // El piso a mostrar (viene de MapView, que ya trae la lista completa de
  // pisos de la empresa). Incluye el tamaño guardado del lienzo.
  floor,
  // Avisa a MapView cuando el usuario termina de arrastrar la esquina de
  // resize, para que MapView actualice su copia de "floor" en memoria y el
  // tamaño se mantenga si el usuario cambia de piso y vuelve.
  onCanvasResized,
}: {
  floor: Floor;
  onCanvasResized: (width: number, height: number) => void;
}) {
  // Lista de equipos del piso actual (se carga en el useEffect de abajo).
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
  // Referencia al div del lienzo: se usa para medir su tamaño real en
  // pantalla (getBoundingClientRect) y convertir coordenadas del puntero a
  // porcentaje de posicion dentro de el.
  const containerRef = useRef<HTMLDivElement>(null);
  const equipmentRef = useRef<Equipment[]>([]);
  useEffect(() => {
    equipmentRef.current = equipment;
  }, [equipment]);

  // Carga inicial de los equipos del piso y si tienen tickets abiertos.
  // Se hace en paralelo para no esperar a que termine la primera consulta antes de empezar la segunda.
  // Se guarda el resultado en el estado "equipment" y se marca isLoading=false cuando termina.
  useEffect(() => {
    let cancelled = false;

    const supabase = createClient();
    (async () => {
      const { data: equipmentData } = await supabase
        .from("equipment")
        .select("id, floor_id, type, label, icon, x_position, y_position, is_disabled")
        .eq("floor_id", floor.id);

      const ids = (equipmentData ?? []).map((item) => item.id);
      let openReportIds = new Set<string>();

      if (ids.length > 0) {
        const { data: tickets } = await supabase
          .from("repair_tickets")
          .select("equipment_id")
          .in("equipment_id", ids)
          .in("status", ["pendiente", "en_revision"]);
        openReportIds = new Set((tickets ?? []).map((t) => t.equipment_id));
      }

      if (!cancelled) {
        setEquipment(
          (equipmentData ?? []).map((item) => ({
            ...item,
            has_open_report: openReportIds.has(item.id),
          }))
        );
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [floor.id]);

  // Suscripcion a Realtime, cada vez que cambia un ticket de reparacion, se
  // revisa si el equipo afectado esta en este piso y, si es asi, se vuelve a
  // consultar la DB para ver si tiene al menos un ticket abierto.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      // El socket de Realtime necesita el JWT de la sesion para que RLS lo
      // deje ver los tickets de su empresa. Si nos suscribimos ANTES de que
      // esto termine, el servidor puede tratarnos como anonimos y no
      // mandarnos nunca ningun evento
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`repair-tickets-floor-${floor.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "repair_tickets" },
          async (payload) => {
            const row = (payload.new ?? payload.old) as { equipment_id?: string } | null;
            const equipmentId = row?.equipment_id;
            if (!equipmentId) return;
            if (!equipmentRef.current.some((item) => item.id === equipmentId)) return;

            // Se vuelve a preguntar en vez de confiar en el status de ESTE
            // ticket, puede haber mas de un ticket por equipo, y lo que
            // importa es si queda al menos uno abierto.
            const { count } = await supabase
              .from("repair_tickets")
              .select("id", { count: "exact", head: true })
              .eq("equipment_id", equipmentId)
              .in("status", ["pendiente", "en_revision"]);

            setEquipment((prev) =>
              prev.map((item) =>
                item.id === equipmentId ? { ...item, has_open_report: (count ?? 0) > 0 } : item
              )
            );
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error("Realtime (repair_tickets) no se pudo suscribir:", status);
          }
        });
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [floor.id]);

  // Convierte una posicion de pantalla (clientX/clientY, en pixeles) a un
  // porcentaje relativo al lienzo (0-100).
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

  // Se dispara en CADA movimiento del puntero sobre el lienzo, no solo
  // cuando se esta arrastrando un equipo.
  function handlePointerMove(e: React.PointerEvent) {
    if (!isEditMode || !draggingId.current) return;
    const { x, y } = positionFromPointer(e.clientX, e.clientY);
    setEquipment((prev) =>
      prev.map((item) =>
        item.id === draggingId.current ? { ...item, x_position: x, y_position: y } : item
      )
    );
  }

  // Al soltar el puntero: si se estaba arrastrando algo, recien aqui se
  // guarda la posicion final en Supabase (una sola escritura por arrastre,
  // no una por cada pixel que se movio durante handlePointerMove).
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
    // Guarda el punto de partida: desde aqui se calculan los deltas en
    // handleResizePointerMove, no se vuelve a leer canvasSize ahi adentro.
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

  // Al soltar: recien aqui se guarda el tamaño final en la DB (no en cada
  // pixel arrastrado) y se avisa a MapView via onCanvasResized para que
  // actualice su copia de "floor" en memoria.
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

  // Los siguientes tres son los callbacks que se le pasan a AddEquipmentButton
  // y EquipmentDetailPanel: esos componentes ya hicieron la escritura en
  // Supabase, aqui solo se actualiza la copia en memoria (equipment) para que
  // la pantalla refleje el cambio sin tener que volver a consultar todo.

  function handleEquipmentAdded(newItem: Equipment) {
    setEquipment((prev) => [...prev, newItem]);
  }

  function handleEquipmentUpdated(updated: Equipment) {
    setEquipment((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  function handleEquipmentDeleted(id: string) {
    setEquipment((prev) => prev.filter((item) => item.id !== id));
    // Si el equipo borrado era el que estaba seleccionado, cerramos el panel
    // de detalle (si no, quedaria mostrando datos de un equipo que ya no existe).
    setSelectedId(null);
  }

  // El objeto completo del equipo seleccionado (no solo el id), para pasarle
  // a EquipmentDetailPanel. Se recalcula en cada render a partir de
  // selectedId + equipment, en vez de guardarse como su propio estado —
  // asi nunca puede quedar "desactualizado" si equipment cambia.
  const selectedEquipment = equipment.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      {/* Fila superior de controles: texto de ayuda (cambia segun el modo) +
          boton de agregar, zoom y toggle de modo edicion. */}
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

            {/* Un EquipmentNode por cada equipo del piso. onPointerDown solo
                marca draggingId si isEditMode es true: fuera de edicion los
                nodos no se mueven (ver tambien el chequeo en handlePointerMove). */}
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
