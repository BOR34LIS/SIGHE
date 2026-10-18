"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormField
        id="password"
        name="password"
        type="password"
        label="Nueva contraseña"
        placeholder="Mínimo 8 caracteres"
        autoComplete="new-password"
        required
      />
      <FormField
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Confirmar nueva contraseña"
        placeholder="••••••••"
        autoComplete="new-password"
        required
      />
      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton>Guardar y continuar</SubmitButton>
    </form>
  );
}
