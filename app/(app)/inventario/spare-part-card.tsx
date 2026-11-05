import type { SparePart } from "./types";

export function SparePartCard({
  part,
  // Valor a mostrar: el real (part.stock) fuera de modo edición, o el valor
  // todavía no guardado (staged) mientras InventoryManager está en modo edición.
  stock,
  isEditing,
  onIncrement,
  onDecrement,
  onChange,
}: {
  part: SparePart;
  stock: number;
  isEditing: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onChange: (value: number) => void;
}) {
  const isLowStock = stock <= part.min_stock;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-text">{part.name}</p>
          {isLowStock && (
            <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
              Stock bajo
            </span>
          )}
        </div>
        {part.description && <p className="text-sm text-text-muted">{part.description}</p>}
        <p className="mt-1 text-xs text-text-subtle">
          Stock mínimo: {part.min_stock}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isEditing && (
          <button
            type="button"
            onClick={onDecrement}
            disabled={stock <= 0}
            aria-label={`Restar 1 a ${part.name}`}
            className="h-9 w-9 rounded-lg border border-border text-text transition-colors hover:bg-surface-muted disabled:opacity-40"
          >
            −
          </button>
        )}

        <div className="flex min-w-12 flex-col items-center">
          {isEditing ? (
            // Alternativa a los botones +/− para quien prefiera escribir el
            // número directo en vez de hacer click varias veces.
            <input
              type="number"
              min={0}
              step={1}
              value={stock}
              onChange={(e) => {
                const value = Math.trunc(Number(e.target.value));
                onChange(Number.isFinite(value) ? Math.max(0, value) : 0);
              }}
              aria-label={`Stock de ${part.name}`}
              className="h-8 w-16 rounded-lg border border-border bg-surface-muted text-center text-lg font-semibold text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ) : (
            <span className={`text-lg font-semibold ${isLowStock ? "text-warning" : "text-text"}`}>
              {stock}
            </span>
          )}
          <span className="text-xs text-text-subtle">unidades</span>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={onIncrement}
            aria-label={`Sumar 1 a ${part.name}`}
            className="h-9 w-9 rounded-lg border border-border text-text transition-colors hover:bg-surface-muted"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
