import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/login");
  // Only the owner of a brand-new company sets up the team.
  if (session.role !== "owner" || session.company.agents) redirect("/dashboard");

  return <div className="h-screen overflow-y-auto bg-[var(--app-bg)] text-white">{children}</div>;
}
