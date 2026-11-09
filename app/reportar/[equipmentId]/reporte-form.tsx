"use client";

import { useActionState } from "react";
import { createReport, type ReportFormState } from "./actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { logout } from "@/app/(auth)/actions";

export type EquipmentWithFloor = {
  id: string;
  type: string;
  label: string;
  is_disabled: boolean;
  floors: { name: string } | null;
};

const PROBLEM_TYPES = [
  "No enciende / no funciona",
  "Funciona de forma intermitente",
  "Le falta un accesorio o repuesto",
  "Problema de software",
  "Otro",
];

const initialState: ReportFormState = {};

export function ReporteForm({ equipment }: { equipment: EquipmentWithFloor }) {
  const [state, formAction] = useActionState(createReport, initialState);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <span className="font-semibold text-text">SIGHE</span>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">
          <h1 className="mb-4 text-lg font-semibold text-text">Reportar incidencia</h1>

          <div className="mb-6 rounded-2xl border border-border bg-surface p-4">
            <p className="mb-2 text-sm text-text-muted">Estás reportando:</p>
            <p className="text-sm text-text">
              Equipo: <span className="font-medium">{equipment.label}</span>
            </p>
            <p className="text-sm text-text">
              Tipo: <span className="font-medium">{equipment.type}</span>
            </p>
            <p className="text-sm text-text">
              Piso: <span className="font-medium">{equipment.floors?.name ?? "—"}</span>
            </p>
          </div>

          {equipment.is_disabled && (
            <p className="mb-4 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-text-muted">
              Este equipo ya está marcado como inhabilitado por un técnico.
            </p>
          )}

          {state.success ? (
            <div className="rounded-2xl border border-border bg-surface p-4 text-center">
              <p className="text-sm text-text">
                ¡Reporte enviado con éxito! Un técnico lo revisará pronto.
              </p>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="equipmentId" value={equipment.id} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="problemType" className="text-sm font-medium text-text">
                  Tipo de problema
                </label>
                <select
                  id="problemType"
                  name="problemType"
                  defaultValue={PROBLEM_TYPES[0]}
                  className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {PROBLEM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-sm font-medium text-text">
                  Descripción adicional (opcional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Ej: la pantalla no enciende, falta el mouse..."
                  className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {state.error && (
                <p className="text-sm text-danger" role="alert">
                  {state.error}
                </p>
              )}

              <SubmitButton>Enviar reporte</SubmitButton>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
