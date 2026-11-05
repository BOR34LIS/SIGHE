"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import type { CurrentProfile } from "@/lib/get-current-profile";

export function Navbar({ profile }: { profile: CurrentProfile }) {
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
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text">SIGHE</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2">
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
    </header>
  );
}
