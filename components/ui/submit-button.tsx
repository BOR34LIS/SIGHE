"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      {pending ? "Cargando..." : children}
    </button>
  );
}
