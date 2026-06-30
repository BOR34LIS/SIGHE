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
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.rpc("public_get_equipment_by_qr", {
    p_qr_code: code,
  });

  const equipment = data?.[0];

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
              {equipment.company_name} · {equipment.equipment_type} · Código{" "}
              {equipment.code}
            </CardDescription>
          </CardHeader>
        </Card>
        <ReportForm qrCode={code} />
      </div>
    </main>
  );
}
