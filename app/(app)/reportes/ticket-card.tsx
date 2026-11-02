import { takeTicket, resolveTicket } from "./actions";
import { STATUS_BADGE_CLASSES, STATUS_LABELS, type TicketRow } from "./types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketCard({ ticket }: { ticket: TicketRow }) {
  const takeTicketWithId = takeTicket.bind(null, ticket.id);
  const resolveTicketWithId = resolveTicket.bind(null, ticket.id);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
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
        {ticket.description && <p className="mt-0.5 text-text-muted">{ticket.description}</p>}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
        <span>Reportado por {ticket.reporter?.full_name ?? ticket.reporter?.email ?? "—"}</span>
        <span>{formatDate(ticket.created_at)}</span>
        {ticket.assignee && (
          <span>Asignado a {ticket.assignee.full_name ?? ticket.assignee.email}</span>
        )}
      </div>

      {ticket.status === "pendiente" && (
        <form action={takeTicketWithId} className="mt-1">
          <button
            type="submit"
            className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Tomar
          </button>
        </form>
      )}

      {ticket.status === "en_revision" && (
        <form action={resolveTicketWithId} className="mt-1">
          <button
            type="submit"
            className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Marcar como resuelto
          </button>
        </form>
      )}
    </div>
  );
}
