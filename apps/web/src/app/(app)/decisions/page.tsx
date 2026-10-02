"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CheckCircle2, ClipboardPen, Sparkles, Trash2 } from "lucide-react";
import PageShell, { EmptyState } from "@/components/PageShell";
import HowItWorks from "@/components/HowItWorks";
import Markdown from "@/components/Markdown";
import { api, errMsg, ApiError } from "@/lib/client";
import { useApi, timeAgo, type Me } from "@/lib/useApi";
import { USAGE_EVENT } from "@/components/PlanMeter";

interface Decision {
  id: string;
  title: string;
  context: string;
  options: string;
  decision: string;
  status: "proposed" | "approved" | "rejected";
  aiRecommendation: string;
  updatedAt: string;
}

const BADGE: Record<Decision["status"], string> = {
  proposed: "bg-amber-500/15 text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-rose-500/15 text-rose-400",
};

const field =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-violet-500/70";
const lbl = "mb-1.5 block text-[13px] font-medium text-white/75";

function DecisionCard({ d, editable, onChange, onError }: { d: Decision; editable: boolean; onChange: () => void; onError: (m: string, plan?: boolean) => void }) {
  const [text, setText] = useState(d.decision);
  const [busy, setBusy] = useState(false);

  async function patch(body: object) {
    try {
      await api(`/api/decisions/${d.id}`, "PATCH", body);
      onChange();
    } catch (e) {
      onError(errMsg(e));
    }
  }

  async function recommend() {
    setBusy(true);
    try {
      await api(`/api/decisions/${d.id}/recommend`, "POST");
      window.dispatchEvent(new Event(USAGE_EVENT));
      onChange();
    } catch (e) {
      onError(errMsg(e), e instanceof ApiError && e.code === "limit_reached");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-white">{d.title}</h3>
          <p className="mt-0.5 text-[11px] text-white/40">Updated {timeAgo(d.updatedAt)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[12px] capitalize ${BADGE[d.status]}`}>{d.status}</span>
      </div>

      {d.context && <p className="mt-3 whitespace-pre-wrap text-[13px] text-white/70"><span className="text-white/45">Context · </span>{d.context}</p>}
      {d.options && <p className="mt-2 whitespace-pre-wrap text-[13px] text-white/70"><span className="text-white/45">Options · </span>{d.options}</p>}

      {d.aiRecommendation && (
        <div className="mt-4 rounded-xl border border-violet-500/25 bg-violet-500/[0.06] p-4">
          <p className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-violet-300"><Sparkles size={13} /> EverMind recommends</p>
          <Markdown>{d.aiRecommendation}</Markdown>
        </div>
      )}

      {editable && (
        <div className="mt-4 space-y-3">
          <textarea className={`${field} resize-none`} rows={2} placeholder="Record the final decision and reasoning…" value={text} maxLength={3000}
            onChange={(e) => setText(e.target.value)} onBlur={() => text !== d.decision && patch({ decision: text })} aria-label="Final decision" />
          <div className="flex flex-wrap items-center gap-2">
            {(["approved", "rejected", "proposed"] as const).map((s) => (
              <button key={s} onClick={() => patch({ status: s })} disabled={d.status === s}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-[12px] capitalize text-white/75 hover:bg-white/5 disabled:border-violet-500/40 disabled:text-violet-300">
                {s === "proposed" ? "Reopen" : s === "approved" ? "Approve" : "Reject"}
              </button>
            ))}
            <button onClick={recommend} disabled={busy}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-violet-500 disabled:opacity-60">
              <Sparkles size={13} /> {busy ? "Thinking…" : d.aiRecommendation ? "Ask again" : "Ask EverMind"}
            </button>
            <button aria-label="Delete decision" onClick={() => api(`/api/decisions/${d.id}`, "DELETE").then(onChange)} className="ml-auto text-white/40 hover:text-rose-300"><Trash2 size={15} /></button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function DecisionsPage() {
  const me = useApi<Me>("/api/auth/me").data;
  const list = useApi<{ decisions: Decision[] }>("/api/decisions");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [options, setOptions] = useState("");
  const [error, setError] = useState("");
  const [planLink, setPlanLink] = useState(false);

  const editable = me?.can.createProject ?? false;
  const items = list.data?.decisions ?? [];

  async function add(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/decisions", "POST", { title, context, options });
      setTitle(""); setContext(""); setOptions("");
      list.reload();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <PageShell title="Decisions" subtitle="Write down important decisions, get EverMind's recommendation, and keep a record of what you chose and why.">
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">
          {error}{planLink && <Link href="/settings" className="ml-2 font-medium underline">View plans</Link>}
        </p>
      )}

      <HowItWorks
        items={[
          { icon: ClipboardPen, title: "Log the decision", text: "Write the question, the situation and the options you are weighing." },
          { icon: Sparkles, title: "Ask EverMind", text: "Get a clear recommendation with the reasons, the main risk and a first step." },
          { icon: CheckCircle2, title: "Decide and record it", text: "Approve or reject, and note your final choice. Your team can see why later." },
        ]}
      />

      {editable && (
        <form onSubmit={add} className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <h3 className="text-[15px] font-semibold text-white">Log a decision</h3>

          <p className="mb-2 mt-3 text-[11px] uppercase tracking-wide text-white/40">Need an idea? Start from an example</p>
          <div className="flex flex-wrap gap-2">
            {["Hire an engineer or a sales lead first?", "Should we raise our prices by 10%?", "Open a second branch this year?", "Build this feature ourselves or buy a tool?"].map((ex) => (
              <button type="button" key={ex} onClick={() => setTitle(ex)} className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-white/70 transition hover:border-violet-500/50 hover:text-white">{ex}</button>
            ))}
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="d-title" className={lbl}>What needs to be decided?</label>
              <input id="d-title" className={field} placeholder="e.g. Hire a sales lead or an engineer first?" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={200} />
            </div>
            <div>
              <label htmlFor="d-context" className={lbl}>What is the situation? <span className="text-white/35">(optional)</span></label>
              <textarea id="d-context" className={`${field} resize-none`} rows={2} placeholder="Constraints, numbers, deadlines, what led to this question" value={context} onChange={(e) => setContext(e.target.value)} maxLength={3000} />
            </div>
            <div>
              <label htmlFor="d-options" className={lbl}>Options you are considering <span className="text-white/35">(optional)</span></label>
              <textarea id="d-options" className={`${field} resize-none`} rows={2} placeholder="One option per line. Leave empty and EverMind will suggest some." value={options} onChange={(e) => setOptions(e.target.value)} maxLength={2000} />
            </div>
          </div>
          <button className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500">Add decision</button>
        </form>
      )}

      {list.data && items.length === 0 ? (
        <EmptyState title="No decisions logged yet" text={editable ? "Log your first decision above, then ask EverMind for a recommendation." : "Decisions logged by your team will appear here."} />
      ) : (
        <ul className="space-y-4">
          {items.map((d) => (
            <DecisionCard key={`${d.id}-${d.updatedAt}`} d={d} editable={editable} onChange={list.reload}
              onError={(m, plan) => { setError(m); setPlanLink(Boolean(plan)); }} />
          ))}
        </ul>
      )}
    </PageShell>
  );
}
