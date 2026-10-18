import type { Metadata } from "next";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "Cambiar contraseña · SIGHE",
};

export default function CambiarPasswordPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            SH
          </div>
          <h1 className="text-xl font-semibold text-text">Crea tu contraseña</h1>
          <p className="text-sm text-text-muted">
            Por seguridad, debes definir una contraseña nueva antes de continuar.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
