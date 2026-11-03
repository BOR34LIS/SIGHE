"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";

export type SparePartFormState = {
  error?: string;
  success?: string;
};

// Solo el admin gestiona el catálogo (caso de uso "Gestión de repuestos").
// La base de datos (RLS) también lo impide, esto es una segunda barrera.
async function isCompanyAdmin() {
  const profile = await getCurrentProfile();
  return profile?.role === "admin" && !!profile.company_id;
}

export async function createSparePart(
  _prevState: SparePartFormState,
  formData: FormData
): Promise<SparePartFormState> {
  if (!(await isCompanyAdmin())) {
    return { error: "No tienes permisos para realizar esta acción." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || "unidad";
  const stock = Number(formData.get("stock") ?? 0);
  const minStock = Number(formData.get("minStock") ?? 0);

  if (!name) {
    return { error: "Ingresa el nombre del repuesto." };
  }

  if (!Number.isInteger(stock) || stock < 0 || !Number.isInteger(minStock) || minStock < 0) {
    return { error: "El stock y el stock mínimo deben ser números enteros desde 0." };
  }

  const supabase = await createClient();
  // company_id no se envía: lo asigna el trigger trg_spare_parts_set_fields.
  const { error } = await supabase.from("spare_parts").insert({
    name,
    description: description || null,
    unit,
    stock,
    min_stock: minStock,
  });

  if (error) {
    // 23505 = valor duplicado (índice único de nombre por empresa)
    if (error.code === "23505") {
      return { error: "Ya existe un repuesto con ese nombre." };
    }
    return { error: "No se pudo guardar el repuesto. Intenta nuevamente." };
  }

  revalidatePath("/inventario");
  return { success: `Repuesto "${name}" agregado.` };
}

// Botones + / − de la página de inventario. Usa la función adjust_spare_part_stock
// para que la suma/resta se haga en la base de datos (el CHECK impide stock negativo).
export async function adjustStock(sparePartId: string, amount: number) {
  if (!(await isCompanyAdmin())) return;

  const supabase = await createClient();
  await supabase.rpc("adjust_spare_part_stock", {
    p_id: sparePartId,
    p_amount: amount,
  });

  revalidatePath("/inventario");
}