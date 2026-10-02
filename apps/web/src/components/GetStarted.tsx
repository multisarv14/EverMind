"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { useApi } from "@/lib/useApi";

interface Overview {
  projects: number;
  openTasks: number;
  doneTasks: number;
  knowledge: number;
}

export default function GetStarted() {
  const status = useApi<{ aiConfigured: boolean }>("/api/status").data;
  const o = useApi<Overview>("/api/overview").data;
  const team = useApi<{ members: unknown[] }>("/api/team").data;

  const steps = [
    { done: Boolean(status?.aiConfigured), label: "Connect the AI", href: "/intelligence" },
    { done: (o?.knowledge ?? 0) > 0, label: "Tell EverMind about your company", href: "/knowledge" },
    { done: (o?.projects ?? 0) > 0, label: "Create your first project", href: "/projects" },
    { done: (o?.openTasks ?? 0) + (o?.doneTasks ?? 0) > 0, label: "Add tasks to your board", href: "/operations" },
    { done: (team?.members.length ?? 0) > 1, label: "Invite a teammate", href: "/people" },
  ];
  const done = steps.filter((s) => s.done).length;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Get started</h3>
        <span className="text-[12px] text-white/50">{o && team ? `${done} of ${steps.length} done` : ""}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ul className="mt-3 space-y-0.5">
        {steps.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-white/[0.04]">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-emerald-500/20 text-emerald-400" : "text-white/30"}`}>
                {s.done ? <Check size={13} /> : <Circle size={14} />}
              </span>
              <span className={`text-[13px] ${s.done ? "text-white/45 line-through" : "text-white"}`}>{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
