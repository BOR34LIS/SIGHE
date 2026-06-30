import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { EquipmentForm } from "@/components/equipment/equipment-form";
import { createEquipment } from "@/app/(dashboard)/equipos/actions";

export default async function NuevoEquipoPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: equipmentTypes }, { data: profiles }] = await Promise.all([
    supabase.from("equipment_types").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Nuevo equipo</h1>
      <EquipmentForm
        action={createEquipment}
        equipmentTypes={equipmentTypes ?? []}
        profiles={profiles ?? []}
        submitLabel="Crear equipo"
      />
    </div>
  );
}
