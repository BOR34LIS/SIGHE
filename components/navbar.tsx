"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { NotificationBell } from "@/components/notification-bell";
import type { CurrentProfile } from "@/lib/get-current-profile";
import type { StaffNotifications } from "@/lib/staff-notifications";

export function Navbar({
  profile,
  // null para quien no es admin/tecnico (ver app/(app)/layout.tsx): esos
  // roles no ven la campanita en absoluto.
  notifications,
}: {
  profile: CurrentProfile;
  notifications: StaffNotifications | null;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Inicio", show: true },
    { href: "/mapa", label: "Mapa", show: profile.role === "admin" || profile.role === "tecnico" },
    {
      href: "/reportes",
      label: "Reportes",
      show: profile.role === "admin" || profile.role === "tecnico",
    },
    {
      href: "/inventario",
      label: "Inventario",
      show: profile.role === "admin" || profile.role === "tecnico",
    },
    { href: "/admin/usuarios", label: "Usuarios", show: profile.role === "admin" },
  ].filter((link) => link.show);

  return (
    <header className="border-b border-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="shrink-0 font-semibold text-text">SIGHE</span>

        {/* overflow-x-auto solo aqui: si no entran todos los links, esta
            franja hace scroll horizontal sin mover el logo ni los botones
            de la derecha (ambos son shrink-0, nunca se achican). */}
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const isActive =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-text-muted hover:bg-surface-muted hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {notifications && <NotificationBell initial={notifications} />}
          <form action={logout}>
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
