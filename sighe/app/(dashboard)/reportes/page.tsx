import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  ticketStatusLabels,
  ticketStatusVariant,
  faultTypeLabels,
} from "@/lib/ticket-status";

export default async function ReportesPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [{ data: tickets }, { data: equipment }, { data: profiles }] = await Promise.all([
    supabase.from("repair_tickets").select("*").order("opened_at", { ascending: false }),
    supabase.from("equipment").select("id, code, brand, model"),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const equipmentMap = new Map((equipment ?? []).map((e) => [e.id, e]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Reportes</h1>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipo</TableHead>
              <TableHead>Reporte</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Reportado por</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tickets ?? []).map((ticket) => {
              const eq = equipmentMap.get(ticket.equipment_id);
              return (
                <TableRow key={ticket.id}>
                  <TableCell>
                    {eq ? (
                      <Link
                        href={`/equipos/${eq.id}`}
                        className="font-medium hover:underline"
                      >
                        {eq.code}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{ticket.title}</span>
                      {ticket.description && (
                        <span className="text-xs text-muted-foreground">
                          {ticket.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {ticket.fault_type ? faultTypeLabels[ticket.fault_type] : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ticketStatusVariant[ticket.status]}>
                      {ticketStatusLabels[ticket.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ticket.reported_by
                      ? (profileMap.get(ticket.reported_by) ?? "—")
                      : "Reporte sin cuenta (QR)"}
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.opened_at).toLocaleString("es-CL")}
                  </TableCell>
                </TableRow>
              );
            })}
            {(!tickets || tickets.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Todavía no hay reportes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
