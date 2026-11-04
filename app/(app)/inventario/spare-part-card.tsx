import { adjustStock } from "./actions";
import type { SparePart } from "./types";

export function SparePartCard({ part, isAdmin }: { part: SparePart; isAdmin: boolean }) {
  const isLowStock = part.stock <= part.min_stock;
  const decreaseStock = adjustStock.bind(null, part.id, -1);
  const increaseStock = adjustStock.bind(null, part.id, 1);

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-text">{part.name}</p>
          {/* Texto además del color: el estado no debe depender solo del color (WCAG) */}
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
        {isAdmin && (
          <form action={decreaseStock}>
            <button
              type="submit"
              disabled={part.stock <= 0}
              aria-label={`Restar 1 a ${part.name}`}
              className="h-9 w-9 rounded-lg border border-border text-text transition-colors hover:bg-surface-muted disabled:opacity-40"
            >
              
            </button>
          </form>
        )}

        <div className="flex min-w-12 flex-col items-center">
          <span className={`text-lg font-semibold ${isLowStock ? "text-warning" : "text-text"}`}>
            {part.stock}
          </span>
          <span className="text-xs text-text-subtle">unidades</span>
        </div>

        {isAdmin && (
          <form action={increaseStock}>
            <button
              type="submit"
              aria-label={`Sumar 1 a ${part.name}`}
              className="h-9 w-9 rounded-lg border border-border text-text transition-colors hover:bg-surface-muted"
            >
              
            </button>
          </form>
        )}
      </div>
    </div>
  );
}