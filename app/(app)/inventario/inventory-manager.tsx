"use client";

import { useState, useTransition } from "react";
import { applyStockChanges } from "./actions";
import { SparePartCard } from "./spare-part-card";
import type { SparePart } from "./types";

const primaryButton =
  "h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";
const secondaryButton =
  "h-9 rounded-lg border border-border px-3 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:opacity-60";

// Los cambios se acumulan en memoria (staged) mientras isEditing es true, y recién se
// mandan todos juntos al presionar "Aceptar cambios".
export function InventoryManager({ parts, isAdmin }: { parts: SparePart[]; isAdmin: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  // Valores todavía no guardados, uno por repuesto (id -> stock en pantalla).
  const [staged, setStaged] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEditing() {
    const initial: Record<string, number> = {};
    for (const part of parts) initial[part.id] = part.stock;
    setStaged(initial);
    setError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setStaged({});
    setError(null);
  }

  function changeStock(id: string, delta: number) {
    setStaged((current) => ({
      ...current,
      [id]: Math.max(0, (current[id] ?? 0) + delta),
    }));
  }

  // Escribir el número directo reemplaza el valor en vez de sumarlo (a
  // diferencia de los botones +/−, que sí son relativos al valor actual).
  function setStock(id: string, value: number) {
    setStaged((current) => ({ ...current, [id]: value }));
  }

  function acceptChanges() {
    // Se compara contra part.stock (el valor original de la BDD), no entre
    // sí: adjust_spare_part_stock suma/resta, no reemplaza, así que hay que
    // mandar el delta total. Los repuestos sin cambios ni se mencionan.
    const changes = parts
      .map((part) => ({ id: part.id, delta: (staged[part.id] ?? part.stock) - part.stock }))
      .filter((change) => change.delta !== 0);

    if (changes.length === 0) {
      setIsEditing(false);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await applyStockChanges(changes);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
      setStaged({});
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {isAdmin && (
        <div className="flex items-center justify-end gap-2">
          {isEditing ? (
            <>
              <button type="button" onClick={cancelEditing} disabled={isPending} className={secondaryButton}>
                Cancelar
              </button>
              <button type="button" onClick={acceptChanges} disabled={isPending} className={primaryButton}>
                {isPending ? "Guardando..." : "Aceptar cambios"}
              </button>
            </>
          ) : (
            <button type="button" onClick={startEditing} className={secondaryButton}>
              Editar inventario
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {parts.length === 0 ? (
        <p className="text-sm text-text-muted">Aún no hay repuestos registrados.</p>
      ) : (
        parts.map((part) => (
          <SparePartCard
            key={part.id}
            part={part}
            stock={isEditing ? staged[part.id] ?? part.stock : part.stock}
            isEditing={isEditing}
            onIncrement={() => changeStock(part.id, 1)}
            onDecrement={() => changeStock(part.id, -1)}
            onChange={(value) => setStock(part.id, value)}
          />
        ))
      )}
    </div>
  );
}
