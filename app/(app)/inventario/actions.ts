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

export type StockChange = { id: string; delta: number };


export async function applyStockChanges(
  changes: StockChange[]
): Promise<{ error?: string }> {
  if (!(await isCompanyAdmin())) {
    return { error: "No tienes permisos para realizar esta acción." };
  }

  const supabase = await createClient();

  // adjust_spare_part_stock suma/resta (no reemplaza), por eso se manda el
  // delta y no el valor final; el CHECK de la tabla sigue impidiendo stock negativo.
  const results = await Promise.all(
    changes.map((change) =>
      supabase.rpc("adjust_spare_part_stock", { p_id: change.id, p_amount: change.delta })
    )
  );

  if (results.some((result) => result.error)) {
    return { error: "No se pudieron guardar algunos cambios. Intenta nuevamente." };
  }

  revalidatePath("/inventario");
  return {};
}