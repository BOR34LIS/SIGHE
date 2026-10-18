import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" || !profile.company_id) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            SH
          </div>
          <span className="font-semibold text-text">SIGHE · Admin</span>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
        >
          Volver
        </Link>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
