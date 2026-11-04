"use client";

import { useState, useTransition } from "react";
import { resolveTicket, type UsedPart } from "./actions";
import type { SparePartOption } from "./types";

type PartRow = { sparePartId: string; quantity: string };

const EMPTY_ROW: PartRow = { sparePartId: "", quantity: "1" };

const primaryButton =
  "h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";
const secondaryButton =
  "h-10 rounded-lg border border-border px-4 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:opacity-60";
const inputClass =
  "h-10 rounded-lg border border-border bg-surface-muted px-3 text-sm text-text outline-none focus:border-primary";

export function ResolveTicketDialog({
  ticketId,
  spareParts,
}: {
  ticketId: string;
  spareParts: SparePartOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"question" | "parts">("question");
  const [rows, setRows] = useState<PartRow[]>([EMPTY_ROW]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeDialog() {
    setIsOpen(false);
    setStep("question");
    setRows([EMPTY_ROW]);
    setError(null);
  }

  function updateRow(index: number, changes: Partial<PartRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  function submit(parts: UsedPart[]) {
    setError(null);
    startTransition(async () => {
      const result = await resolveTicket(ticketId, parts);
      if (result.error) {
        setError(result.error);
      } else {
        closeDialog();
      }
    });
  }

  // Valida en el navegador para avisar antes de enviar (la base de datos vuelve a validar todo).
  function submitWithParts() {
    const totals = new Map<string, number>();

    for (const row of rows) {
      const quantity = Number(row.quantity);
      if (!row.sparePartId) {
        setError("Selecciona un repuesto en cada fila o elimina las filas vacías.");
        return;
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        setError("Las cantidades deben ser números enteros mayores a 0.");
        return;
      }
      // Si eligió el mismo repuesto en dos filas, se suman las cantidades.
      totals.set(row.sparePartId, (totals.get(row.sparePartId) ?? 0) + quantity);
    }

    for (const [id, quantity] of totals) {
      const part = spareParts.find((p) => p.id === id);
      if (part && quantity > part.stock) {
        setError(`Stock insuficiente de "${part.name}": quedan ${part.stock}.`);
        return;
      }
    }

    submit(Array.from(totals, ([sparePartId, quantity]) => ({ sparePartId, quantity })));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-1 h-9 self-start rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Marcar como resuelto
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`resolve-title-${ticketId}`}
        >
          <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-surface p-6">
            <h2 id={`resolve-title-${ticketId}`} className="font-semibold text-text">
              Marcar como resuelto
            </h2>

            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            {step === "question" && (
              <>
                <p className="text-sm text-text-muted">
                  ¿Se utilizaron repuestos en esta reparación?
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={closeDialog} disabled={isPending} className={secondaryButton}>
                    Cancelar
                  </button>
                  <button type="button" onClick={() => submit([])} disabled={isPending} className={secondaryButton}>
                    {isPending ? "Resolviendo..." : "No, resolver"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("parts");
                      setError(null);
                    }}
                    disabled={isPending}
                    className={primaryButton}
                  >
                    Sí, registrar repuestos
                  </button>
                </div>
              </>
            )}

            {step === "parts" && spareParts.length === 0 && (
              <>
                <p className="text-sm text-text-muted">
                  No hay repuestos registrados en el inventario. Pide a un administrador que los agregue.
                </p>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setStep("question")} className={secondaryButton}>
                    Volver
                  </button>
                </div>
              </>
            )}

            {step === "parts" && spareParts.length > 0 && (
              <>
                <p className="text-sm text-text-muted">
                  Selecciona los repuestos y la cantidad utilizada.
                </p>

                <div className="flex flex-col gap-2">
                  {rows.map((row, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        aria-label="Repuesto"
                        value={row.sparePartId}
                        onChange={(e) => updateRow(index, { sparePartId: e.target.value })}
                        className={`${inputClass} min-w-0 flex-1`}
                      >
                        <option value="">Selecciona un repuesto</option>
                        {spareParts.map((part) => (
                          <option key={part.id} value={part.id} disabled={part.stock === 0}>
                            {part.name} ({part.stock} disponibles)
                          </option>
                        ))}
                      </select>
                      <input
                        aria-label="Cantidad"
                        type="number"
                        min={1}
                        step={1}
                        value={row.quantity}
                        onChange={(e) => updateRow(index, { quantity: e.target.value })}
                        className={`${inputClass} w-20`}
                      />
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          aria-label="Quitar repuesto"
                          className="h-10 w-10 shrink-0 rounded-lg border border-border text-text-muted transition-colors hover:bg-surface-muted"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setRows((current) => [...current, EMPTY_ROW])}
                  className="self-start text-sm font-medium text-text hover:underline"
                >
                  + Agregar otro repuesto
                </button>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("question");
                      setError(null);
                    }}
                    disabled={isPending}
                    className={secondaryButton}
                  >
                    Volver
                  </button>
                  <button type="button" onClick={submitWithParts} disabled={isPending} className={primaryButton}>
                    {isPending ? "Resolviendo..." : "Confirmar y resolver"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}