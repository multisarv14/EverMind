"use client";

import PageShell from "@/components/PageShell";
import BarChart from "@/components/BarChart";
import { useApi } from "@/lib/useApi";

interface Analytics {
  days: { day: string; tokens: number; conversations: number }[];
  totals: { tokens: number; conversations: number };
  tasks: { todo: number; doing: number; done: number };
  decisions: { proposed: number; approved: number; rejected: number };
  members: { name: string; conversations: number }[];
}

const fmtDay = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <p className="text-[12px] text-white/55">{label}</p>
      <p className="mt-1 text-[28px] font-semibold leading-tight text-white">{value}</p>
      {note && <p className="mt-1 text-[12px] text-white/45">{note}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, error } = useApi<Analytics>("/api/analytics");

  if (error) return <PageShell title="Analytics" subtitle="How your company uses EverMind"><p className="text-[13px] text-white/60">Couldn&apos;t load analytics. Please refresh.</p></PageShell>;
  if (!data) return <PageShell title="Analytics" subtitle="How your company uses EverMind"><p className="text-[13px] text-white/60">Loading…</p></PageShell>;

  const taskTotal = data.tasks.todo + data.tasks.doing + data.tasks.done;
  const donePct = taskTotal ? Math.round((data.tasks.done / taskTotal) * 100) : 0;
  const segments = [
    { label: "To do", value: data.tasks.todo, color: "var(--cat-1)" },
    { label: "In progress", value: data.tasks.doing, color: "var(--cat-2)" },
    { label: "Done", value: data.tasks.done, color: "var(--cat-3)" },
  ];
  const maxChats = Math.max(...data.members.map((m) => m.conversations), 1);

  return (
    <PageShell title="Analytics" subtitle="How much your team uses EverMind, and how your work is progressing. It fills in as you use the app.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="AI usage (14 days)" value={data.totals.tokens.toLocaleString()} note="Tokens: how much EverMind has read and written" />
        <Tile label="Conversations (14 days)" value={String(data.totals.conversations)} note="Chats started by your team" />
        <Tile label="Tasks completed" value={taskTotal ? `${donePct}%` : "—"} note={taskTotal ? `${data.tasks.done} of ${taskTotal} tasks` : "No tasks yet"} />
        <Tile label="Decisions approved" value={String(data.decisions.approved)} note={`${data.decisions.proposed} awaiting a decision`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <BarChart title="AI usage" unit="tokens" bars={data.days.map((d) => ({ label: fmtDay(d.day), full: fmtDay(d.day), value: d.tokens }))} />
        <BarChart title="Conversations started" unit="conversations" bars={data.days.map((d) => ({ label: fmtDay(d.day), full: fmtDay(d.day), value: d.conversations }))} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <h3 className="text-[14px] font-semibold text-white">Work status</h3>
          {taskTotal === 0 ? (
            <p className="mt-3 text-[13px] text-white/50">No tasks yet. Add some on the Operations board.</p>
          ) : (
            <>
              <div className="mt-4 flex h-3 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={`${data.tasks.todo} to do, ${data.tasks.doing} in progress, ${data.tasks.done} done`}>
                {segments.filter((s) => s.value > 0).map((s) => (
                  <div key={s.label} style={{ flex: s.value, background: s.color }} />
                ))}
              </div>
              <ul className="mt-4 space-y-2">
                {segments.map((s) => (
                  <li key={s.label} className="flex items-center gap-2 text-[13px] text-white/80">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                    {s.label}
                    <span className="ml-auto font-medium text-white">{s.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <h3 className="text-[14px] font-semibold text-white">Team activity <span className="font-normal text-white/45">· conversations, 14 days</span></h3>
          <ul className="mt-4 space-y-3">
            {data.members.map((m) => (
              <li key={m.name}>
                <div className="flex justify-between text-[13px] text-white/80"><span>{m.name}</span><span className="font-medium text-white">{m.conversations}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${(m.conversations / maxChats) * 100}%`, background: "var(--series-1)" }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
