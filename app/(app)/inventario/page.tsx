import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { AddSparePartForm } from "./add-spare-part-form";
import { SparePartCard } from "./spare-part-card";
import type { SparePart } from "./types";

export const metadata: Metadata = {
  title: "Inventario · SIGHE",
};

// Admin y técnico ven el stock ("Consultar stock"); solo el admin ve el formulario
// y los botones + / − ("Gestión de repuestos"). El acceso a la ruta lo controla layout.tsx.
export default async function InventarioPage() {
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  const supabase = await createClient();
  const { data } = await supabase
    .from("spare_parts")
    .select("id, name, description, unit, stock, min_stock")
    .order("name", { ascending: true });

  const parts = (data ?? []) as SparePart[];

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold text-text">Inventario de repuestos</h1>
        <p className="text-sm text-text-muted">
          {isAdmin
            ? "Administra el catálogo y el stock de repuestos de tu empresa."
            : "Consulta los repuestos disponibles en bodega."}
        </p>
      </div>

      {isAdmin && (
        <div className="w-full max-w-xl">
          <AddSparePartForm />
        </div>
      )}

      {parts.length === 0 ? (
        <p className="text-sm text-text-muted">Aún no hay repuestos registrados.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {parts.map((part) => (
            <SparePartCard key={part.id} part={part} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}