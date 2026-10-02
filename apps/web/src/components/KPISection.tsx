"use client";

import Link from "next/link";
import { Target, Code, ListChecks, GitBranch, FileText, Brain } from "lucide-react";
import { useApi } from "@/lib/useApi";

interface Overview {
  projects: number;
  activeInitiatives: number;
  openTasks: number;
  doingTasks: number;
  decisions: number;
  reports: number;
  conversations: number;
}

export default function KPISection() {
  const o = useApi<Overview>("/api/overview").data;
  const n = (v?: number) => v ?? 0;

  const kpis = [
    { icon: Target, tone: "text-violet-400 bg-violet-500/15", value: n(o?.activeInitiatives), title: "Active Initiatives", note: n(o?.activeInitiatives) ? "Projects with open tasks" : "No initiatives yet", href: "/projects" },
    { icon: Code, tone: "text-sky-400 bg-sky-500/15", value: n(o?.projects), title: "Projects", note: n(o?.projects) ? "Created by your team" : "No projects yet", href: "/projects" },
    { icon: ListChecks, tone: "text-emerald-400 bg-emerald-500/15", value: n(o?.openTasks), title: "Tasks", note: n(o?.openTasks) ? `${n(o?.doingTasks)} in progress` : "No open tasks", href: "/operations" },
    { icon: GitBranch, tone: "text-orange-400 bg-orange-500/15", value: n(o?.decisions), title: "Decisions", note: n(o?.decisions) ? "Logged by your team" : "No decisions yet", href: "/decisions" },
    { icon: FileText, tone: "text-violet-300 bg-violet-500/15", value: n(o?.reports), title: "Documents", note: n(o?.reports) ? "Reports generated" : "No documents yet", href: "/reports" },
    { icon: Brain, tone: "text-pink-400 bg-pink-500/15", value: n(o?.conversations), title: "Memory", note: "Conversations remembered", href: "/knowledge" },
  ];

  return (
    <section className="grid grid-cols-2 gap-y-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] py-4 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map(({ icon: Icon, tone, value, title, note, href }) => (
        <Link key={title} href={href} className="px-4 hover:opacity-80 xl:border-r xl:border-white/[0.05] xl:last:border-r-0">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
              <Icon size={19} />
            </span>
            <span className="text-[22px] font-medium text-white">{value}</span>
          </div>
          <p className="mt-2 text-[13px] font-medium text-white">{title}</p>
          <p className="text-[11px] leading-tight text-white/55">{note}</p>
        </Link>
      ))}
    </section>
  );
}
