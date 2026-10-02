import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { currentSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/login");
  if (session.role === "owner" && session.company.industry && !session.company.agents) redirect("/onboarding");

  return <AppShell user={{ name: session.user.name, subtitle: session.company.name }}>{children}</AppShell>;
}
