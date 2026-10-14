import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { currentSession } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";

export const metadata = { title: "Admin · EverMind", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/login");
  // Same answer as a missing page, so the panel isn't advertised to other users.
  if (!isPlatformAdmin(session.user)) notFound();

  return <AppShell user={{ name: session.user.name, subtitle: session.company.name, admin: true }}>{children}</AppShell>;
}
