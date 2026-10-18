"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "../actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthFormState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
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
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />
      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton>Iniciar sesión</SubmitButton>
      <p className="text-center text-sm text-text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="font-medium text-text hover:underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
