import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { currentSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--app-bg)] text-white">
      <Sidebar user={{ name: session.user.name, subtitle: session.company.name }} />
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
