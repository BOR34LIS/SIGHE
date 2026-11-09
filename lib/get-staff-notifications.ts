import { createClient } from "@/lib/supabase/server";
import { mapStaffNotifications, type StaffNotifications } from "./staff-notifications";

// Carga inicial para la campanita del navbar
export async function getStaffNotifications(): Promise<StaffNotifications> {
  const supabase = await createClient();

  const [{ data: tickets }, { data: parts }] = await Promise.all([
    supabase
      .from("repair_tickets")
      .select("id, created_at, equipment(label)")
      .eq("status", "pendiente")
      .order("created_at", { ascending: false }),
    supabase.from("spare_parts").select("id, name, stock, min_stock").order("name"),
  ]);

  // El cliente de Supabase infiere "equipment" como arreglo al no tener
  // tipos generados, pero la relacion es muchos-a-uno: en runtime PostgREST
  // devuelve un objeto unico.
  return mapStaffNotifications(
    tickets as unknown as
      | { id: string; created_at: string; equipment: { label: string } | null }[]
      | null,
    parts
  );
}
