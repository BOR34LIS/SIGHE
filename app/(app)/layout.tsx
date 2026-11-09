import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { getStaffNotifications } from "@/lib/get-staff-notifications";
import { Navbar } from "@/components/navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const isStaff = profile.role === "admin" || profile.role === "tecnico";
  const notifications = isStaff ? await getStaffNotifications() : null;

  return (
    <div className="flex flex-1 flex-col bg-background">
      <Navbar profile={profile} notifications={notifications} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
