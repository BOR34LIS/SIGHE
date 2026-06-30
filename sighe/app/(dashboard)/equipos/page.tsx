import Link from "next/link";
import { cookies } from "next/headers";
import { Plus, Pencil, Eye } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { DeleteEquipmentButton } from "@/components/equipment/delete-equipment-button";
import { statusLabels, statusVariant } from "@/lib/equipment-status";

export default async function EquiposPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: equipment }, { data: types }, { data: profiles }] = await Promise.all([
    supabase.from("equipment").select("*").order("created_at", { ascending: false }),
    supabase.from("equipment_types").select("id, name"),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const typeMap = new Map((types ?? []).map((t) => [t.id, t.name]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Equipos</h1>
        <Button asChild>
          <Link href="/equipos/nuevo">
            <Plus className="size-4" />
            Nuevo equipo
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Marca / Modelo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead className="w-1" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(equipment ?? []).map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell>{typeMap.get(item.equipment_type_id) ?? "—"}</TableCell>
                <TableCell>
                  {item.brand} {item.model}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[item.status]}>
                    {statusLabels[item.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.assigned_user_id
                    ? (profileMap.get(item.assigned_user_id) ?? "—")
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/equipos/${item.id}`}>
                        <Eye className="size-4" />
                        Ver detalle
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link href={`/equipos/${item.id}/editar`} aria-label="Editar equipo">
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <DeleteEquipmentButton id={item.id} code={item.code} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!equipment || equipment.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Todavía no hay equipos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
