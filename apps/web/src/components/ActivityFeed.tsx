import {
  BookText,
  Briefcase,
  Code2,
  DollarSign,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AgentStatus = "active" | "idle";

export interface ActiveAgent {
  key: "chief" | "research" | "business" | "technical" | "documentation";
  name: string;
  task: string;
  icon: LucideIcon;
  accentClassName: string;
  status: AgentStatus;
}

export const defaultActiveAgents: readonly ActiveAgent[] = [
  {
    key: "chief",
    name: "Chief Agent",
    task: "Coordinating all operations",
    icon: ShieldCheck,
    accentClassName: "from-violet-500 to-fuchsia-500",
    status: "active",
  },
  {
    key: "research",
    name: "Research Agent",
    task: "Ready to research",
    icon: Search,
    accentClassName: "from-emerald-500 to-green-500",
    status: "idle",
  },
  {
    key: "business",
    name: "Business Agent",
    task: "Analyzing business data",
    icon: DollarSign,
    accentClassName: "from-amber-500 to-orange-500",
    status: "active",
  },
  {
    key: "technical",
    name: "Technical Agent",
    task: "Ready for technical tasks",
    icon: Code2,
    accentClassName: "from-sky-500 to-cyan-500",
    status: "idle",
  },
  {
    key: "documentation",
    name: "Documentation Agent",
    task: "Ready to document",
    icon: BookText,
    accentClassName: "from-indigo-500 to-violet-500",
    status: "idle",
  },
];

interface ActivityFeedProps {
  agents?: readonly ActiveAgent[];
}

export default function ActivityFeed({
  agents = defaultActiveAgents,
}: ActivityFeedProps) {
  const activeCount = agents.filter((item) => item.status === "active").length;

  return (
    <section className="h-full rounded-xl border border-white/10 bg-[#090f1d] p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-white">
          Active Agents
        </h3>

        <button
          type="button"
          className="text-[13px] font-medium text-violet-300 transition hover:text-violet-200"
        >
          View All Agents →
        </button>
      </div>

      <div className="space-y-1.5">
        {agents.map(({ key, name, task, icon: Icon, accentClassName, status }) => (
          <article
            key={key}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0b1324] px-2.5 py-1.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${accentClassName}`}>
                <Icon size={13} className="text-white" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-white">
                  {name}
                </p>
                <p className="truncate text-[11px] text-white/55">
                  {task}
                </p>
              </div>
            </div>

            <div className="ml-3 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${status === "active" ? "bg-emerald-400" : "bg-white/30"}`} />
              <span className={`text-[11px] ${status === "active" ? "text-emerald-300" : "text-white/55"}`}>
                {status === "active" ? "Active" : "Idle"}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2 text-[11px] text-white/75">
        <p>Total Agents: {agents.length}</p>
        <p>Active: {activeCount}</p>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 text-violet-300">
        <Briefcase size={12} />
        <span className="text-[10px]">Runtime team synced</span>
      </div>
    </section>
  );
}
