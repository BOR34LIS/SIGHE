import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Navbar } from "@/components/navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <Navbar profile={profile} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
