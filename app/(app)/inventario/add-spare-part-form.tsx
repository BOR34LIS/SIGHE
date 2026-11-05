"use client";

import { useActionState, useEffect, useState } from "react";
import { createSparePart, type SparePartFormState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: SparePartFormState = {};

// Botón que abre el modal para agregar un repuesto nuevo al inventario.
export function AddSparePartButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="self-start rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        + Repuesto
      </button>

      {/* Se desmonta por completo al cerrar, para
          que AddSparePartModal vuelva a montarse limpio la próxima vez que se
          abra (sin el error o los valores que quedaron de un intento anterior). */}
      {isOpen && <AddSparePartModal onClose={() => setIsOpen(false)} />}
    </>
  );
}

function AddSparePartModal({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useActionState(createSparePart, initialState);

  // Si se guardó con éxito, el modal se cierra solo
  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="font-semibold text-text">Agregar repuesto</h2>

        <FormField
          id="name"
          name="name"
          label="Nombre"
          placeholder="Ej: Fuente de poder 500W"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-text">
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-base text-text placeholder:text-text-subtle outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="stock"
            name="stock"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            label="Stock inicial"
            required
          />
          <FormField
            id="minStock"
            name="minStock"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            label="Stock mínimo"
            required
          />
        </div>

        {state.error && (
          <p className="text-sm text-danger" role="alert">
            {state.error}
          </p>
        )}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-border font-medium text-text transition-colors hover:bg-surface-muted"
          >
            Cancelar
          </button>
          <div className="flex-1">
            <SubmitButton>Guardar repuesto</SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
