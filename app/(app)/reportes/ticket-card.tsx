import { takeTicket } from "./actions";
import { ResolveTicketDialog } from "./resolve-ticket-dialog";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  type SparePartOption,
  type TicketRow,
} from "./types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketCard({
  ticket,
  spareParts,
}: {
  ticket: TicketRow;
  spareParts: SparePartOption[];
}) {
  const takeTicketWithId = takeTicket.bind(null, ticket.id);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-2">
        {/* min-w-0 es necesario para que este bloque SI pueda achicarse y
            dejar que el texto haga wrap, sin esto, un label largo empuja
            la burbuja de estado fuera de la tarjeta en vez de envolver. */}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-text">
            {ticket.equipment?.label ?? "Equipo eliminado"}
            <span className="ml-2 text-sm font-normal text-text-muted">
              {ticket.equipment?.type}
            </span>
          </p>
          <p className="text-sm text-text-muted">
            Piso: {ticket.equipment?.floors?.name ?? "—"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[ticket.status]}`}
        >
          {STATUS_LABELS[ticket.status]}
        </span>
      </div>

      <div className="text-sm text-text">
        <span className="font-medium">{ticket.problem_type}</span>
        {ticket.description && <p className="mt-1 text-text-muted">{ticket.description}</p>}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs text-text-subtle">
        <span>Reportado por {ticket.reporter?.full_name ?? ticket.reporter?.email ?? "—"}</span>
        <span>Recibido: {formatDate(ticket.created_at)}</span>
        {ticket.resolved_at && <span>Resuelto: {formatDate(ticket.resolved_at)}</span>}
        {ticket.assignee && (
          <span>Asignado a {ticket.assignee.full_name ?? ticket.assignee.email}</span>
        )}
      </div>

      {ticket.status === "pendiente" && (
        <form action={takeTicketWithId}>
          <button
            type="submit"
            className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Tomar
          </button>
        </form>
      )}

      {ticket.status === "en_revision" && (
        <ResolveTicketDialog ticketId={ticket.id} spareParts={spareParts} />
      )}
    </div>
  );
}
