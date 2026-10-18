import type { Metadata } from "next";
import { CreateUserForm } from "./create-user-form";

export const metadata: Metadata = {
  title: "Usuarios · SIGHE",
};

export default function AdminUsuariosPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-text">Crear usuario</h1>
          <p className="text-sm text-text-muted">
            Se crea la cuenta con una contraseña temporal que deberá cambiarse en el primer
            inicio de sesión.
          </p>
        </div>
        <CreateUserForm />
      </div>
    </div>
  );
}
