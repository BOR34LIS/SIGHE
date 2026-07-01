import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ReportForm } from "@/components/report/report-form";

export default async function PublicQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: equipment, error } = await supabase
    .from("equipment")
    .select("id, brand, model, code, equipment_types(name), companies(name)")
    .eq("id", id)
    .neq("status", "dado_de_baja")
    .single();

  if (error || !equipment) {
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Equipo no encontrado</CardTitle>
            <CardDescription>
              El código QR no corresponde a ningún equipo registrado.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {equipment.brand} {equipment.model}
            </CardTitle>
            <CardDescription>
              {equipment.companies?.name} · {equipment.equipment_types?.name} ·
              Código {equipment.code}
            </CardDescription>
          </CardHeader>
        </Card>
        <ReportForm equipmentId={equipment.id} />
      </div>
    </main>
  );
}
