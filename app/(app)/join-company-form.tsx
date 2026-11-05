"use client";

import { useActionState } from "react";
import { joinCompany, type JoinCompanyState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: JoinCompanyState = {};

export function JoinCompanyForm() {
  const [state, formAction] = useActionState(joinCompany, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-3">
      <p className="text-sm text-text-subtle">
        Aún no perteneces a ninguna empresa. Si tienes un código, únete para poder reportar equipos.
      </p>
      <FormField
        id="joinCode"
        name="joinCode"
        label="Código de la empresa"
        placeholder="Ej: YFFGNPB6"
        autoCapitalize="characters"
        required
      />
      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton>Unirme</SubmitButton>
    </form>
  );
}
