import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { EquipmentForm } from "@/components/equipment/equipment-form";
import { updateEquipment, type EquipmentFormState } from "@/app/(dashboard)/equipos/actions";

export default async function EditarEquipoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: equipment }, { data: equipmentTypes }, { data: profiles }] =
    await Promise.all([
      supabase.from("equipment").select("*").eq("id", id).single(),
      supabase.from("equipment_types").select("id, name").order("name"),
      supabase.from("profiles").select("id, full_name").order("full_name"),
    ]);

  if (!equipment) {
    notFound();
  }

  async function updateEquipmentWithId(
    prevState: EquipmentFormState,
    formData: FormData,
  ): Promise<EquipmentFormState> {
    "use server";
    return updateEquipment(id, prevState, formData);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Editar equipo</h1>
      <EquipmentForm
        action={updateEquipmentWithId}
        equipmentTypes={equipmentTypes ?? []}
        profiles={profiles ?? []}
        defaultValues={equipment}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
