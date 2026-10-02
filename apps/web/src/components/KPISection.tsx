"use client";

import { useApi, type ConversationSummary } from "@/lib/useApi";
import { Target, Code, ListChecks, GitBranch, FileText, Brain } from "lucide-react";

const kpis = [
  { icon: Target, tone: "text-violet-400 bg-violet-500/15", value: 0, title: "Active Initiatives", note: "No initiatives yet" },
  { icon: Code, tone: "text-sky-400 bg-sky-500/15", value: 0, title: "Projects", note: "Created by your team" },
  { icon: ListChecks, tone: "text-emerald-400 bg-emerald-500/15", value: 0, title: "Tasks", note: "No tasks yet" },
  { icon: GitBranch, tone: "text-orange-400 bg-orange-500/15", value: 0, title: "Decisions", note: "No decisions yet" },
  { icon: FileText, tone: "text-violet-300 bg-violet-500/15", value: 0, title: "Documents", note: "No documents yet" },
  { icon: Brain, tone: "text-pink-400 bg-pink-500/15", value: 0, title: "Memory", note: "Conversations remembered" },
];

export default function KPISection() {
  const { data } = useApi<{ conversations: ConversationSummary[] }>("/api/conversations");
  const remembered = data?.conversations.length ?? 0;
  const projectCount = useApi<{ projects: unknown[] }>("/api/projects").data?.projects.length ?? 0;

  return (
    <section className="grid grid-cols-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] py-3">
      {kpis.map(({ icon: Icon, tone, value, title, note }) => (
        <div key={title} className="border-r border-white/[0.05] px-4 last:border-r-0">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
              <Icon size={19} />
            </span>
            <span className="text-[22px] font-medium text-white">{title === "Memory" ? remembered : title === "Projects" ? projectCount : value}</span>
          </div>
          <p className="mt-2 text-[13px] font-medium text-white">{title}</p>
          <p className="text-[11px] leading-tight text-white/55">{note}</p>
        </div>
      ))}
    </section>
  );
}
