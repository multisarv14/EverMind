import Link from "next/link";
import { MessageSquare } from "lucide-react";
import PageShell from "@/components/PageShell";
import { agents } from "@/constants/agents";

export default function AgentsPage() {
  return (
    <PageShell title="EverMind Agents" subtitle="Specialists you can talk to. Pick one and EverMind answers as that expert, using your company knowledge.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map(({ id, icon: Icon, tone, name, text }) => (
          <div key={name} className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
              <Icon size={20} />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-white">{name}</p>
            <p className="mt-1 flex-1 text-[12px] text-white/60">{text}</p>
            <Link
              href={`/chat?agent=${id}`}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500"
            >
              <MessageSquare size={15} /> Chat with {name.replace(" Agent", "")}
            </Link>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
