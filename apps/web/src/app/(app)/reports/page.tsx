"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FileText, ListChecks, Sparkles, Table2 } from "lucide-react";
import PageShell, { EmptyState } from "@/components/PageShell";
import HowItWorks from "@/components/HowItWorks";
import { api, errMsg, ApiError } from "@/lib/client";
import { useApi, timeAgo, type Me } from "@/lib/useApi";
import { USAGE_EVENT } from "@/components/PlanMeter";

export default function ReportsPage() {
  const router = useRouter();
  const me = useApi<Me>("/api/auth/me").data;
  const list = useApi<{ reports: { id: string; title: string; createdAt: string }[] }>("/api/reports");
  const [days, setDays] = useState(7);
  const [withAi, setWithAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [planLink, setPlanLink] = useState(false);

  const editable = me?.can.createProject ?? false;
  const reports = list.data?.reports ?? [];

  async function generate(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setPlanLink(false);
    try {
      const r = await api<{ id: string }>("/api/reports", "POST", { days, withAi });
      window.dispatchEvent(new Event(USAGE_EVENT));
      router.push(`/reports/${r.id}`);
    } catch (err) {
      setError(errMsg(err));
      setPlanLink(err instanceof ApiError && err.code === "limit_reached");
      setBusy(false);
    }
  }

  return (
    <PageShell title="Reports" subtitle="One-click status reports for your team or investors, built from what is in your workspace.">
      <HowItWorks
        items={[
          { icon: Table2, title: "Numbers at a glance", text: "Projects, tasks done and open, decisions, conversations and AI usage for the period." },
          { icon: ListChecks, title: "Projects, tasks, decisions", text: "A readable list of progress, what is still open and what was decided." },
          { icon: Sparkles, title: "Optional EverMind summary", text: "Add a short executive summary with risks and next steps. Download any report to share." },
        ]}
      />

      {editable && (
        <form onSubmit={generate} className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <h3 className="text-[15px] font-semibold text-white">Generate a report</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label htmlFor="r-period" className="text-[13px] text-white/70">Period</label>
            <select id="r-period" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Period"
              className="rounded-lg border border-white/10 bg-[var(--card-bg)] px-3 py-2 text-[13px] text-white outline-none focus:border-violet-500/70">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-white/75">
              <input type="checkbox" checked={withAi} onChange={(e) => setWithAi(e.target.checked)} className="h-4 w-4 accent-violet-600" />
              Add an executive summary written by EverMind
            </label>
            <button disabled={busy} className="ml-auto rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-60">
              {busy ? "Generating…" : "Generate report"}
            </button>
          </div>
          <p className="mt-3 text-[12px] text-white/45">The data in a report is always accurate — it comes straight from your workspace. The AI summary is optional and uses tokens.</p>
          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-[13px] text-rose-300">
              {error}{planLink && <Link href="/settings" className="ml-2 font-medium underline">View plans</Link>}
            </p>
          )}
        </form>
      )}

      {list.data && reports.length === 0 ? (
        <EmptyState title="No reports yet" text={editable ? "Generate your first report above." : "Reports your team generates will appear here."} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {reports.map((r) => (
            <li key={r.id}>
              <Link href={`/reports/${r.id}`} className="block h-full rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-violet-500/40">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><FileText size={18} /></span>
                <p className="mt-3 text-[14px] font-semibold text-white">{r.title}</p>
                <p className="mt-2 text-[11px] text-white/40">Created {timeAgo(r.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
