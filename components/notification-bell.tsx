"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mapStaffNotifications, type StaffNotifications } from "@/lib/staff-notifications";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell({ initial }: { initial: StaffNotifications }) {
  const [data, setData] = useState(initial);
  const [isOpen, setIsOpen] = useState(false);
  // Para detectar un click afuera del dropdown y cerrarlo.
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mismo patron que el mapa (ver floor-canvas.tsx): se asegura el token de
  // la sesion antes de suscribirse (si no, Realtime puede tratarnos como
  // anonimos y RLS nos bloquea todo en silencio), y ante cualquier cambio en
  // repair_tickets o spare_parts se vuelve a pedir todo de nuevo — las
  // listas son chicas, no vale la pena actualizar parcialmente.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function refetch() {
      const [{ data: tickets }, { data: parts }] = await Promise.all([
        supabase
          .from("repair_tickets")
          .select("id, created_at, equipment(label)")
          .eq("status", "pendiente")
          .order("created_at", { ascending: false }),
        supabase.from("spare_parts").select("id, name, stock, min_stock").order("name"),
      ]);
      if (cancelled) return;

      setData(
        mapStaffNotifications(
          tickets as unknown as
            | { id: string; created_at: string; equipment: { label: string } | null }[]
            | null,
          parts
        )
      );
    }

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel("staff-notifications")
        .on("postgres_changes", { event: "*", schema: "public", table: "repair_tickets" }, refetch)
        .on("postgres_changes", { event: "*", schema: "public", table: "spare_parts" }, refetch)
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const hasNotifications = data.pendingTickets.length > 0 || data.lowStockParts.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notificaciones"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
      >
        <Bell className="h-4.5 w-4.5" />
        {/* Circulo rojo: solo presencia, no cuenta — "hay algo que mirar". */}
        {hasNotifications && (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-danger" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-80 max-w-[85vw] rounded-2xl border border-border bg-surface shadow-lg">
          <div className="max-h-96 overflow-y-auto p-2">
            {!hasNotifications && (
              <p className="px-3 py-6 text-center text-sm text-text-subtle">
                No hay notificaciones por ahora.
              </p>
            )}

            {data.pendingTickets.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  Reportes pendientes
                </p>
                <div className="flex flex-col gap-2">
                  {data.pendingTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href="/reportes"
                      onClick={() => setIsOpen(false)}
                      className="block rounded-lg border border-border px-3 py-2.5 text-sm text-text transition-colors hover:bg-surface-muted"
                    >
                      <span className="font-medium">{ticket.equipmentLabel}</span>
                      <span className="block text-xs text-text-subtle">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {data.lowStockParts.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  Stock bajo
                </p>
                <div className="flex flex-col gap-2">
                  {data.lowStockParts.map((part) => (
                    <Link
                      key={part.id}
                      href="/inventario"
                      onClick={() => setIsOpen(false)}
                      className="block rounded-lg border border-border px-3 py-2.5 text-sm text-text transition-colors hover:bg-surface-muted"
                    >
                      <span className="font-medium">{part.name}</span>
                      <span className="block text-xs text-text-subtle">
                        Quedan {part.stock} (mínimo {part.minStock})
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
