"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthFormState } from "../actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction] = useActionState(signup, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-text">{state.success}</p>
        <Link href="/login" className="text-sm font-medium text-text hover:underline">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm text-text-muted">
        Este registro crea una <strong className="font-medium text-text">cuenta de administrador</strong>{" "}
        para una empresa nueva. Si tu empresa ya usa SIGHE, pide a tu administrador que te cree una
        cuenta en vez de registrarte aquí.
      </div>
      <FormField
        id="companyName"
        name="companyName"
        type="text"
        label="Nombre de la empresa"
        placeholder="Mi Empresa SpA"
        autoComplete="organization"
        required
      />
      <FormField
        id="fullName"
        name="fullName"
        type="text"
        label="Nombre completo"
        placeholder="Juan Pérez"
        autoComplete="name"
        required
      />
      <FormField
        id="email"
        name="email"
        type="email"
        label="Correo electrónico"
        placeholder="tu@empresa.com"
        autoComplete="email"
        required
      />
      <FormField
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        placeholder="Mínimo 8 caracteres"
        autoComplete="new-password"
        required
      />
      <FormField
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Confirmar contraseña"
        placeholder="••••••••"
        autoComplete="new-password"
        required
      />
      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton>Crear cuenta</SubmitButton>
      <p className="text-center text-sm text-text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-text hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
