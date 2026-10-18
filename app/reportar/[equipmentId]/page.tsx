import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReporteForm, type EquipmentWithFloor } from "./reporte-form";

export const metadata: Metadata = {
  title: "Reportar incidencia · SIGHE",
};

export default async function ReportarPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;
  const supabase = await createClient();

  // El cliente de Supabase infiere "floors" como arreglo al no tener tipos generados,
  // pero la relacion es muchos-a-uno: en runtime PostgREST devuelve un objeto unico.
  const { data: equipment } = (await supabase
    .from("equipment")
    .select("id, type, label, is_disabled, floors(name)")
    .eq("id", equipmentId)
    .maybeSingle()) as unknown as { data: EquipmentWithFloor | null };

  if (!equipment) {
    notFound();
  }

  return <ReporteForm equipment={equipment} />;
}
