import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/get-current-profile";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (profile?.role !== "admin" || !profile.company_id) {
    redirect("/");
  }

  return <>{children}</>;
}
