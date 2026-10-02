"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Check, Circle, FileText, FolderKanban, GitBranch, ListChecks, MessageSquare, Sparkles, Users } from "lucide-react";
import PageShell from "@/components/PageShell";
import { useApi, formatTokens, timeAgo, type Me } from "@/lib/useApi";

interface Overview {
  projects: number;
  openTasks: number;
  doneTasks: number;
  decisions: number;
  reports: number;
  knowledge: number;
  conversations: number;
}

interface Learning {
  suggestions: unknown[];
  approved: number;
  feedback: { up: number; down: number };
  lastRun: string | null;
}

interface Step {
  points: number;
  earned: number;
  done: boolean;
  title: string;
  why: string;
  href: string;
  cta: string;
}

const card = "rounded-2xl border border-white/[0.07] bg-white/[0.025]";

export default function IntelligencePage() {
  const status = useApi<{ aiConfigured: boolean; model: string }>("/api/status").data;
  const me = useApi<Me>("/api/auth/me").data;
  const o = useApi<Overview>("/api/overview").data;
  const learn = useApi<Learning>("/api/learning").data;
  const team = useApi<{ members: unknown[] }>("/api/team").data;

  const loaded = Boolean(status && me && o && learn && team);

  // How well EverMind knows this company: each thing the team adds earns points toward 100.
  const knowledgeEarned = Math.round((Math.min(o?.knowledge ?? 0, 3) / 3) * 25);
  const steps: Step[] = [
    { points: 15, earned: me?.company.about ? 15 : 0, done: Boolean(me?.company.about), title: "Describe what your company does", why: "EverMind uses it to pick relevant examples and advice.", href: "/settings", cta: "Add a description" },
    { points: 25, earned: knowledgeEarned, done: (o?.knowledge ?? 0) >= 3, title: "Add company knowledge (3 or more items)", why: "What you sell, who your customers are, your prices and policies. EverMind reads these in every answer.", href: "/knowledge", cta: "Add knowledge" },
    { points: 15, earned: (o?.projects ?? 0) > 0 ? 15 : 0, done: (o?.projects ?? 0) > 0, title: "Create a project", why: "A project gives EverMind a goal and instructions to follow.", href: "/projects", cta: "Create a project" },
    { points: 15, earned: (o?.openTasks ?? 0) + (o?.doneTasks ?? 0) + (o?.decisions ?? 0) > 0 ? 15 : 0, done: (o?.openTasks ?? 0) + (o?.doneTasks ?? 0) + (o?.decisions ?? 0) > 0, title: "Track some work: tasks or decisions", why: "So EverMind can see what is happening in the company.", href: "/operations", cta: "Add a task" },
    {
      points: 15,
      earned: (learn?.approved ?? 0) > 0 ? 15 : 0,
      done: (learn?.approved ?? 0) > 0,
      title: "Approve something EverMind learned",
      why:
        (learn?.suggestions.length ?? 0) > 0
          ? "EverMind has suggestions waiting. You decide what to keep."
          : (o?.conversations ?? 0) === 0
            ? "Chat with EverMind first. Each night it suggests facts from your chats for you to approve."
            : "Each night EverMind suggests facts from your chats. You can also ask it to learn right now.",
      href: (learn?.suggestions.length ?? 0) === 0 && (o?.conversations ?? 0) === 0 ? "/chat" : "/knowledge",
      cta: (learn?.suggestions.length ?? 0) > 0 ? "Review suggestions" : (o?.conversations ?? 0) === 0 ? "Start a chat" : "Learn from my chats",
    },
    { points: 10, earned: (learn?.feedback.up ?? 0) + (learn?.feedback.down ?? 0) > 0 ? 10 : 0, done: (learn?.feedback.up ?? 0) + (learn?.feedback.down ?? 0) > 0, title: "Rate an answer with 👍 or 👎", why: "It shows EverMind what you like and what to avoid.", href: "/chat", cta: "Open a chat" },
    { points: 5, earned: (team?.members.length ?? 0) > 1 ? 5 : 0, done: (team?.members.length ?? 0) > 1, title: "Invite a teammate", why: "More people using EverMind means more it can learn.", href: "/people", cta: "Invite someone" },
  ];
  const score = steps.reduce((a, s) => a + s.earned, 0);
  const next = steps.find((s) => !s.done);
  const level = score >= 80 ? "Knows your company well" : score >= 40 ? "Getting to know you" : "Just getting started";

  const aiReady = Boolean(status?.aiConfigured);
  const remembered = [
    { icon: BookOpen, label: "Company knowledge", value: o?.knowledge, note: "Facts you added", href: "/knowledge" },
    { icon: Sparkles, label: "Learned facts", value: learn?.approved, note: "Approved from your chats", href: "/knowledge" },
    { icon: FolderKanban, label: "Projects", value: o?.projects, note: "Goals with instructions", href: "/projects" },
    { icon: ListChecks, label: "Open tasks", value: o?.openTasks, note: "Work in progress", href: "/operations" },
    { icon: GitBranch, label: "Decisions", value: o?.decisions, note: "Logged choices", href: "/decisions" },
    { icon: MessageSquare, label: "Conversations", value: o?.conversations, note: "Chats you had", href: "/chat" },
    { icon: FileText, label: "Reports", value: o?.reports, note: "Generated summaries", href: "/reports" },
    { icon: Users, label: "Team members", value: team?.members.length, note: "People using EverMind", href: "/people" },
  ];

  return (
    <PageShell title="Intelligence" subtitle="How well EverMind knows your company, and what to add so its answers get better.">
      {!loaded ? (
        <p className="text-[13px] text-white/60">Loading…</p>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            {/* Score */}
            <section className={`${card} p-6`}>
              <div className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-white/45"><Brain size={14} /> EverMind&apos;s knowledge of {me!.company.name}</div>
              <div className="mt-4 flex items-end gap-4">
                <p className="text-[56px] font-bold leading-none text-white">{score}<span className="text-[24px] font-medium text-white/40">/100</span></p>
                <p className="pb-2 text-[15px] font-medium text-violet-300">{level}</p>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Knowledge score">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-all" style={{ width: `${Math.max(score, 2)}%` }} />
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-white/50">The more EverMind knows, the more specific and useful its answers become. Each step below adds points.</p>

              <div className={`mt-5 flex items-start gap-3 rounded-xl p-4 ${aiReady ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${aiReady ? "bg-emerald-400" : "bg-amber-400"}`} />
                <div className="text-[13px] leading-relaxed">
                  <p className="font-medium text-white">{aiReady ? "EverMind is ready to answer" : "EverMind can't answer yet"}</p>
                  <p className="text-white/60">{aiReady ? "The AI is connected. Ask anything in a chat." : "The AI isn't connected. Whoever manages EverMind needs to add the AI key (see the README), then restart."}</p>
                </div>
              </div>
            </section>

            {/* Next best step */}
            <section className={`${card} flex flex-col p-6`}>
              <p className="text-[12px] uppercase tracking-wide text-white/45">Best next step</p>
              {next ? (
                <>
                  <h2 className="mt-3 text-[20px] font-semibold leading-snug text-white">{next.title}</h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/60">{next.why}</p>
                  <p className="mt-3 text-[12px] text-emerald-400">+{next.points - next.earned} points</p>
                  <Link href={next.href} className="mt-6 flex items-center justify-center gap-2 self-start rounded-xl bg-violet-600 px-5 py-3 text-[14px] font-medium text-white hover:bg-violet-500">
                    {next.cta} <ArrowRight size={15} />
                  </Link>
                </>
              ) : (
                <div className="mt-3">
                  <h2 className="text-[20px] font-semibold text-white">You&apos;re all set 🎉</h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/60">EverMind knows your company well. Keep chatting and approving what it learns, and it will keep getting better.</p>
                </div>
              )}
            </section>
          </div>

          {/* Checklist */}
          <section className={`${card} mt-5 p-6`}>
            <h3 className="text-[15px] font-semibold text-white">Make EverMind smarter</h3>
            <ul className="mt-3 divide-y divide-white/[0.06]">
              {steps.map((s) => (
                <li key={s.title}>
                  <Link href={s.href} className="flex items-start gap-3 py-3 hover:opacity-80">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-emerald-500/20 text-emerald-400" : "text-white/30"}`}>
                      {s.done ? <Check size={13} /> : <Circle size={14} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] font-medium ${s.done ? "text-white/45 line-through" : "text-white"}`}>{s.title}</span>
                      <span className="block text-[12px] text-white/45">{s.why}</span>
                    </span>
                    <span className="shrink-0 text-[12px] text-white/40">{s.earned}/{s.points}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* What it remembers */}
          <section className="mt-5">
            <h3 className="mb-3 text-[15px] font-semibold text-white">What EverMind remembers</h3>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {remembered.map(({ icon: Icon, label, value, note, href }) => (
                <li key={label}>
                  <Link href={href} className={`${card} flex items-center gap-3 p-4 transition hover:border-violet-500/40`}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><Icon size={18} /></span>
                    <span className="min-w-0">
                      <span className="block text-[20px] font-semibold leading-tight text-white">{value ?? 0}</span>
                      <span className="block truncate text-[12px] font-medium text-white/80">{label}</span>
                      <span className="block truncate text-[11px] text-white/40">{note}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Learning */}
          <section className={`${card} mt-5 p-6`}>
            <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white"><Sparkles size={15} className="text-violet-300" /> It learns every night</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-white/60">
              Each night EverMind reads the day&apos;s conversations and suggests facts worth remembering. Nothing is saved until you approve it.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/70">
              <span>Last learned: <span className="text-white">{learn!.lastRun ? timeAgo(learn!.lastRun) : "not yet"}</span></span>
              <span>Waiting for your approval: <span className="text-white">{learn!.suggestions.length}</span></span>
              <span>Your ratings: 👍 {learn!.feedback.up} · 👎 {learn!.feedback.down} this month</span>
              {learn!.suggestions.length > 0 && <Link href="/knowledge" className="font-medium text-violet-300 hover:underline">Review now →</Link>}
            </div>
          </section>

          {/* Technical */}
          <details className="mt-5 rounded-2xl border border-white/[0.07] px-6 py-4">
            <summary className="cursor-pointer list-none text-[13px] font-medium text-white/60 hover:text-white">Technical details</summary>
            <dl className="mt-4 grid gap-4 text-[13px] sm:grid-cols-3">
              <div><dt className="text-white/45">AI model</dt><dd className="mt-0.5 text-white">{status!.model}</dd><dd className="text-[12px] text-white/40">The AI that writes EverMind&apos;s answers.</dd></div>
              <div><dt className="text-white/45">Tokens used this month</dt><dd className="mt-0.5 text-white">{formatTokens(me!.usage.used)} of {formatTokens(me!.usage.limit)}</dd><dd className="text-[12px] text-white/40">Tokens measure how much EverMind reads and writes. Plan: {me!.plan.name}.</dd></div>
              <div><dt className="text-white/45">AI connection</dt><dd className="mt-0.5 text-white">{aiReady ? "Connected" : "Not connected"}</dd><dd className="text-[12px] text-white/40">Needs an Anthropic API key on the server.</dd></div>
            </dl>
          </details>
        </>
      )}
    </PageShell>
  );
}
