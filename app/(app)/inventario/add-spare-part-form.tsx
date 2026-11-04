"use client";

import { useActionState } from "react";
import { createSparePart, type SparePartFormState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: SparePartFormState = {};

export function AddSparePartForm() {
  const [state, formAction] = useActionState(createSparePart, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
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
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <SubmitButton>Guardar repuesto</SubmitButton>
    </form>
  );
}