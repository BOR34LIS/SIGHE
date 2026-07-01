import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { Pencil, ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentQrCode } from "@/components/qr/equipment-qr-code";
import { ReportTicketForm } from "@/components/equipment/report-ticket-form";
import { statusLabels, statusVariant } from "@/lib/equipment-status";

export default async function EquipoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: equipment } = await supabase
    .from("equipment")
    .select("*")
    .eq("id", id)
    .single();

  if (!equipment) {
    notFound();
  }

  const [{ data: type }, { data: assignedUser }] = await Promise.all([
    supabase
      .from("equipment_types")
      .select("name")
      .eq("id", equipment.equipment_type_id)
      .single(),
    equipment.assigned_user_id
      ? supabase
          .from("profiles")
          .select("full_name")
          .eq("id", equipment.assigned_user_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const reportUrl = `${protocol}://${host}/q/${equipment.id}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href="/equipos" aria-label="Volver">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">{equipment.code}</h1>
          <Badge variant={statusVariant[equipment.status]}>
            {statusLabels[equipment.status]}
          </Badge>
        </div>
        <Button asChild variant="outline">
          <Link href={`/equipos/${equipment.id}/editar`}>
            <Pencil className="size-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del equipo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Tipo" value={type?.name ?? "—"} />
            <Row label="Marca" value={equipment.brand} />
            <Row label="Modelo" value={equipment.model} />
            <Row label="N° de serie" value={equipment.serial_number ?? "—"} />
            <Row label="Asignado a" value={assignedUser?.full_name ?? "Sin asignar"} />
            <Row label="Notas" value={equipment.notes ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Código QR</CardTitle>
          </CardHeader>
          <CardContent>
            <EquipmentQrCode url={reportUrl} code={equipment.code} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Reportar una falla</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportTicketForm equipmentId={equipment.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
