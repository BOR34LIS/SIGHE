import { LogoutButton } from "@/components/dashboard/logout-button";

const roleLabels: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrador",
  tecnico: "Técnico",
  usuario: "Usuario",
};

export function Topbar({
  fullName,
  role,
  companyName,
}: {
  fullName: string;
  role: string;
  companyName: string;
}) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <p className="text-sm font-medium">{companyName}</p>
      <div className="flex items-center gap-3">
        <div className="text-right text-sm">
          <p className="font-medium">{fullName}</p>
          <p className="text-xs text-muted-foreground">
            {roleLabels[role] ?? role}
          </p>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
