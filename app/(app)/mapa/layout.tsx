import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/get-current-profile";

export default async function MapaLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile?.company_id || (profile.role !== "admin" && profile.role !== "tecnico")) {
    redirect("/");
  }

  return <>{children}</>;
}
