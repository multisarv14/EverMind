"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import PageShell from "@/components/PageShell";
import { useApi, formatTokens, type Me } from "@/lib/useApi";

interface Overview {
  projects: number;
  openTasks: number;
  doneTasks: number;
  decisions: number;
  reports: number;
  knowledge: number;
  conversations: number;
}

export default function IntelligencePage() {
  const status = useApi<{ aiConfigured: boolean; model: string }>("/api/status").data;
  const me = useApi<Me>("/api/auth/me").data;
  const o = useApi<Overview>("/api/overview").data;
  const team = useApi<{ members: unknown[] }>("/api/team").data;

  const known = o
    ? [
        { label: "Knowledge items", value: o.knowledge },
        { label: "Projects", value: o.projects },
        { label: "Open tasks", value: o.openTasks },
        { label: "Decisions logged", value: o.decisions },
        { label: "Reports", value: o.reports },
        { label: "Conversations", value: o.conversations },
      ]
    : [];

  const checklist = [
    { done: Boolean(status?.aiConfigured), label: "Connect the AI", hint: "Add your Anthropic key so EverMind can answer.", href: "/settings" },
    { done: (o?.knowledge ?? 0) > 0, label: "Teach EverMind about your company", hint: "Add what you sell, who your customers are and how you work.", href: "/knowledge" },
    { done: (o?.projects ?? 0) > 0, label: "Create your first project", hint: "Group work and give EverMind project-specific instructions.", href: "/projects" },
    { done: (o?.openTasks ?? 0) + (o?.doneTasks ?? 0) > 0, label: "Add tasks to the board", hint: "Or let EverMind break a goal into tasks.", href: "/operations" },
    { done: (team?.members.length ?? 0) > 1, label: "Invite a teammate", hint: "Give your team access with the right permissions.", href: "/people" },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <PageShell title="Intelligence" subtitle="How EverMind is set up and what it knows about your company">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "AI engine", value: status ? (status.aiConfigured ? "Connected" : "Not connected") : "…", note: status?.aiConfigured ? "Ready for objectives" : "Needs an API key" },
          { label: "Model", value: status?.model ?? "…", note: "Powers every EverMind answer" },
          { label: "Tokens this month", value: me ? `${formatTokens(me.usage.used)} / ${formatTokens(me.usage.limit)}` : "…", note: me ? `${me.plan.name} plan` : "" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="text-[12px] text-white/60">{c.label}</p>
            <p className="mt-1 text-[20px] font-semibold text-white">{c.value}</p>
            <p className="mt-2 text-[12px] text-white/50">{c.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-white">Setup checklist</h3>
            <span className="text-[12px] text-white/50">{doneCount} of {checklist.length} done</span>
          </div>
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex items-start gap-3 py-3 hover:opacity-80">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.done ? "bg-emerald-500/20 text-emerald-400" : "text-white/30"}`}>
                    {c.done ? <Check size={13} /> : <Circle size={14} />}
                  </span>
                  <span>
                    <span className={`block text-[13px] font-medium ${c.done ? "text-white/50 line-through" : "text-white"}`}>{c.label}</span>
                    <span className="text-[12px] text-white/50">{c.hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <h3 className="text-[15px] font-semibold text-white">What EverMind knows</h3>
          <p className="mt-1 text-[12px] text-white/50">Everything saved in your company workspace.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {known.map((k) => (
              <div key={k.label} className="rounded-xl border border-white/[0.07] bg-[var(--card-bg)] p-3">
                <p className="text-[20px] font-semibold text-white">{k.value}</p>
                <p className="text-[11px] text-white/55">{k.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-white/45">
            Company knowledge and project instructions are included in EverMind&apos;s context for every conversation, so answers fit your business.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
