"use client";

import { useState, type FormEvent } from "react";
import { api, errMsg } from "@/lib/client";
import { formatTokens, useApi } from "@/lib/useApi";
import { Loading, Notice, Table, button, card, formatDate, ghostButton, input } from "@/components/admin/ui";

interface Company {
  id: string;
  name: string;
  owner: string | null;
  industry: string | null;
  plan: string;
  effectivePlan: string;
  members: number;
  seats: number;
  creditsUsed: number;
  allowance: number;
  packBalance: number;
  billingStatus: string | null;
  requestedPlan: string | null;
  createdAt: string;
}

const PLANS = ["free", "pro", "business"];

export default function CompaniesTab() {
  const { data, error, reload } = useApi<{ companies: Company[]; truncated: boolean }>("/api/admin/companies");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  if (!data) return <Loading error={error} />;

  const needle = q.trim().toLowerCase();
  const rows = needle
    ? data.companies.filter((c) => c.name.toLowerCase().includes(needle) || c.owner?.toLowerCase().includes(needle))
    : data.companies;

  async function setPlan(c: Company, plan: string) {
    if (plan === c.plan) return;
    if (!confirm(`Move ${c.name} from ${c.plan} to ${plan}? No payment is taken.`)) return;
    setMsg(null);
    try {
      const r = await api<{ warning: string | null }>(`/api/admin/companies/${c.id}`, "PATCH", { plan });
      setMsg({ kind: "ok", text: `${c.name} is now on ${plan}.${r.warning ? ` ${r.warning}` : ""}` });
      reload();
    } catch (e) {
      setMsg({ kind: "error", text: errMsg(e) });
    }
  }

  return (
    <div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by company or owner email" className={`${input} w-full sm:w-80`} />
        <p className="text-[12px] text-white/50">
          {rows.length} of {data.companies.length} companies{data.truncated ? " (newest 500 shown)" : ""}
        </p>
      </div>

      <Table head={["Company", "Owner", "Plan", "Members", "Credits this month", "Created", ""]}>
        {rows.map((c) => (
          <CompanyRow key={c.id} c={c} open={open === c.id} onToggle={() => setOpen(open === c.id ? null : c.id)} onPlan={setPlan} onGranted={(text) => (setMsg({ kind: "ok", text }), setOpen(null), reload())} onError={(text) => setMsg({ kind: "error", text })} />
        ))}
      </Table>
      {rows.length === 0 && <p className="py-8 text-center text-[13px] text-white/50">No companies match.</p>}
    </div>
  );
}

function CompanyRow({
  c,
  open,
  onToggle,
  onPlan,
  onGranted,
  onError,
}: {
  c: Company;
  open: boolean;
  onToggle: () => void;
  onPlan: (c: Company, plan: string) => void;
  onGranted: (text: string) => void;
  onError: (text: string) => void;
}) {
  const pct = c.allowance ? Math.min(100, Math.round((c.creditsUsed / c.allowance) * 100)) : 0;

  return (
    <>
      <tr className="align-top">
        <td className="px-4 py-3">
          <p className="font-medium text-white">{c.name}</p>
          <p className="text-[12px] text-white/45">{c.industry ?? "No industry"}</p>
        </td>
        <td className="px-4 py-3 break-all">{c.owner ?? "—"}</td>
        <td className="px-4 py-3">
          <select value={c.plan} onChange={(e) => onPlan(c, e.target.value)} className={input} aria-label={`Plan for ${c.name}`}>
            {PLANS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {c.effectivePlan !== c.plan && <p className="mt-1 text-[11px] text-amber-300">Acting as {c.effectivePlan} (payment overdue)</p>}
          {c.billingStatus && <p className="mt-1 text-[11px] text-white/45">Online billing: {c.billingStatus}</p>}
          {c.requestedPlan && <p className="mt-1 text-[11px] text-violet-300">Asked for {c.requestedPlan}</p>}
        </td>
        <td className="px-4 py-3">
          {c.members} / {c.seats}
        </td>
        <td className="px-4 py-3">
          <p>
            {formatTokens(c.creditsUsed)} / {formatTokens(c.allowance)} <span className="text-white/45">({pct}%)</span>
          </p>
          {c.packBalance > 0 && <p className="text-[11px] text-white/45">+{formatTokens(c.packBalance)} extra</p>}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.createdAt)}</td>
        <td className="px-4 py-3 text-right">
          <button onClick={onToggle} className={ghostButton}>
            {open ? "Close" : "Give credits"}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} className="px-4 pb-4">
            <GrantForm company={c} onDone={onGranted} onError={onError} />
          </td>
        </tr>
      )}
    </>
  );
}

function GrantForm({ company, onDone, onError }: { company: Company; onDone: (text: string) => void; onError: (text: string) => void }) {
  const [credits, setCredits] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = Math.round(Number(credits));
    if (!(n > 0)) return onError("Enter a positive number of credits.");
    setBusy(true);
    try {
      await api(`/api/admin/companies/${company.id}/credits`, "POST", { credits: n, note });
      onDone(`Gave ${n.toLocaleString()} credits to ${company.name} (valid 12 months).`);
    } catch (err) {
      onError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${card} flex flex-wrap items-end gap-3 p-4`}>
      <label className="text-[12px] text-white/60">
        Credits
        <input type="number" min={1} value={credits} onChange={(e) => setCredits(e.target.value)} required className={`${input} mt-1 block w-36`} />
      </label>
      <label className="min-w-0 flex-1 text-[12px] text-white/60">
        Note (optional)
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="e.g. Pilot bonus" className={`${input} mt-1 block w-full`} />
      </label>
      <button disabled={busy} className={button}>
        {busy ? "Giving…" : "Give credits"}
      </button>
    </form>
  );
}
