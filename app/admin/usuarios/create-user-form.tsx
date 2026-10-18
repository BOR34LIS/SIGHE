"use client";

import { useActionState, useState } from "react";
import { createCompanyUser, type CreateUserState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: CreateUserState = {};

const ROLE_OPTIONS = [
  { value: "usuario", label: "Usuario" },
  { value: "tecnico", label: "Técnico" },
] as const;

export function CreateUserForm() {
  const [state, formAction] = useActionState(createCompanyUser, initialState);
  const [copied, setCopied] = useState(false);

  if (state.success) {
    const credentials = `Correo: ${state.success.email}\nContraseña temporal: ${state.success.tempPassword}`;

    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
        <div>
          <h2 className="font-semibold text-text">Cuenta creada</h2>
          <p className="text-sm text-text-muted">
            Copia esta contraseña temporal y pásasela a la persona por un canal seguro — no
            volverá a mostrarse. Deberá cambiarla al iniciar sesión por primera vez.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted p-4 font-mono text-sm text-text">
          <p>Correo: {state.success.email}</p>
          <p>Contraseña: {state.success.tempPassword}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(credentials);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="h-11 rounded-lg border border-border font-medium text-text transition-colors hover:bg-surface-muted"
        >
          {copied ? "Copiado ✓" : "Copiar credenciales"}
        </button>
        <a
          href="/admin/usuarios"
          className="text-center text-sm font-medium text-text hover:underline"
        >
          Crear otra cuenta
        </a>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
    >
      <FormField
        id="email"
        name="email"
        type="email"
        label="Correo de la persona"
        placeholder="nombre@empresa.com"
        required
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className="text-sm font-medium text-text">
          Rol
        </label>
        <select
          id="role"
          name="role"
          defaultValue="usuario"
          className="h-11 rounded-lg border border-border bg-surface-muted px-3 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton>Crear cuenta</SubmitButton>
    </form>
  );
}
