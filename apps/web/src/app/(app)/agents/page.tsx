import PageShell from "@/components/PageShell";
import { agents } from "@/constants/agents";

export default function AgentsPage() {
  return (
    <PageShell title="EverMind Agents" subtitle="My specialized agents working for you">
      <div className="grid grid-cols-3 gap-4">
        {agents.map(({ icon: Icon, tone, name, text }) => (
          <div key={name} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
              <Icon size={20} />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-white">{name}</p>
            <p className="mt-1 text-[12px] text-white/60">{text}</p>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Active
            </p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
