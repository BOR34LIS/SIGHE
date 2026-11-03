"use client";

import { useState } from "react";
// importacion del cliente de supabase e importacion de tipos y presets de equipos.
import { createClient } from "@/lib/supabase/client";
import { EQUIPMENT_TYPE_PRESETS, type Equipment } from "./types";
import { ICON_CATALOG, PRESET_ICON_KEYS, type IconKey } from "./icon-catalog";

// Este componente es un boton que abre un modal para agregar un nuevo equipo al piso actual.
export function AddEquipmentButton({
  floorId,
  onAdded,
}: {
  // A que piso se va a asociar el equipo nuevo.
  floorId: string;
  // Callback hacia el padre (FloorCanvas): este boton no guarda la lista de
  // equipos, solo avisa que se creo uno nuevo y le pasa el objeto completo (con id generado por la DB).
  onAdded: (equipment: Equipment) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<string>(EQUIPMENT_TYPE_PRESETS[0]);
  // Texto libre que solo se usa si el tipo elegido es "Otro".
  const [customType, setCustomType] = useState("");
  // Icono elegido a mano, solo relevante cuando type === "Otro" (para los
  // presets el icono se resuelve solo, via PRESET_ICON_KEYS mas abajo).
  const [customIcon, setCustomIcon] = useState<IconKey>("generic");
  // Nombre/identificador que el usuario le pone al equipo (ej. "PC Recepcion").
  const [label, setLabel] = useState("");
  // Deshabilita el boton y muestra "Guardando..."
  const [isSaving, setIsSaving] = useState(false);
  // Mensaje de error (validacion o fallo de Supabase); null = sin error.
  const [error, setError] = useState<string | null>(null);


  // Vuelve el formulario a su estado inicial. Se usa al cancelar y despues
  // de guardar con exito, para que la proxima vez que abran el modal este limpio.
  function reset() {
    setType(EQUIPMENT_TYPE_PRESETS[0]);
    setCustomType("");
    setCustomIcon("generic");
    setLabel("");
    setError(null);
  }

  async function handleSubmit() {
    // Si eligieron "Otro" se usa el texto libre; si no, el preset tal cual.
    const finalType = type === "Otro" ? customType.trim() : type;
    const finalLabel = label.trim();
    // Para un preset el icono ya viene decidido (PRESET_ICON_KEYS); para
    // "Otro" se usa el que la persona eligio en la grilla de abajo.
    const finalIcon =
      type === "Otro"
        ? customIcon
        : (PRESET_ICON_KEYS[type as keyof typeof PRESET_ICON_KEYS] ?? "generic");

    // Validacion en el cliente (para no hacer la llamada a Supabase si ya sabemos que va a fallar).
    if (!finalType || !finalLabel) {
      setError("Completa el tipo y el nombre del equipo.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const supabase = createClient();
    // Insertar un nuevo equipo en la tabla "equipment" de Supabase.
    // Se fija x_position e y_position en 50,50 por defecto; FloorCanvas permite moverlo despues.
    const { data, error: insertError } = await supabase
      .from("equipment")
      .insert({
        floor_id: floorId,
        type: finalType,
        label: finalLabel,
        icon: finalIcon,
        x_position: 50,
        y_position: 50,
      })
      .select("id, floor_id, type, label, icon, x_position, y_position, is_disabled")
      .single();

    setIsSaving(false);

    if (insertError || !data) {
      setError("No se pudo agregar el equipo.");
      return;
    }

    // has_open_report no es una columna de la tabla es un dato calculado
    // (si el equipo tiene un reporte sin resolver) que FloorCanvas arma en
    // memoria al cargar la lista. Un equipo recien creado nunca puede tener
    // un reporte todavia, asi que lo fijamos en false sin volver a consultar.
    onAdded({ ...data, has_open_report: false });
    reset();
    setIsOpen(false);
  }

  return (
    // Fragmento React: el boton siempre visible y el modal que solo se renderiza si isOpen es true.
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        + Equipo
      </button>

      {/* Renderizado condicional: el modal entero no existe en el DOM a
          menos que isOpen sea true (en vez de ocultarlo con CSS). */}
      {isOpen && (
        // pone un overlay de fondo oscuro semi-transparente que cubre toda la pantalla.
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-lg">
            <h2 className="mb-4 font-semibold text-text">Agregar equipo</h2>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">Tipo</label>
                {/* Recorre EQUIPMENT_TYPE_PRESETS para generar las opciones. */}
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

              {/* Solo aparece si eligieron "Otro" en el select de arriba: para
                  los presets el icono ya esta decidido (PRESET_ICON_KEYS en
                  icon-catalog.ts), asi que no hace falta preguntar nada mas. */}
              {type === "Otro" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text">Especifica el tipo</label>
                    <input
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      placeholder="Ej: Impresora 3D"
                      className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text">Icono</label>
                    <div className="grid grid-cols-5 gap-2">
                      {ICON_CATALOG.map(({ key, label: iconLabel, Icon }) => (
                        <button
                          key={key}
                          type="button"
                          title={iconLabel}
                          onClick={() => setCustomIcon(key)}
                          className={`flex h-11 items-center justify-center rounded-lg border transition-colors ${
                            customIcon === key
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-text hover:bg-surface-muted"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
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

              {/* Mensaje de error, solo si existe. */}
              {error && (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-2 flex gap-2">
                {/* Cancelar: cierra y resetea sin guardar nada. */}
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
                {/* Agregar: dispara handleSubmit; se deshabilita y cambia de
                    texto mientras isSaving es true. */}
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
