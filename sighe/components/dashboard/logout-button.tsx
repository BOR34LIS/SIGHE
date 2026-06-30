"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="icon" aria-label="Cerrar sesión">
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}
