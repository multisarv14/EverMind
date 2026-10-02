"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import PageShell from "@/components/PageShell";
import { useApi, formatTokens, type Me } from "@/lib/useApi";

export default function SettingsPage() {
  const { data: me, reload } = useApi<Me>("/api/auth/me");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function requestUpgrade(plan: string) {
    setBusy(plan);
    setError("");
    try {
      const res = await fetch("/api/plan/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy("");
    }
  }

  if (!me) {
    return (
      <PageShell title="Settings" subtitle="Your plan and usage">
        <p className="text-[13px] text-white/60">Loading…</p>
      </PageShell>
    );
  }

  const pct = Math.min(100, Math.round((me.usage.used / me.usage.limit) * 100));
  const full = me.usage.used >= me.usage.limit;
  const isFree = me.plan.id === "free";

  return (
    <PageShell title="Settings" subtitle="Your plan and usage">
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[12px] text-white/50">{me.company.name}</p>
            <h3 className="text-[18px] font-semibold text-white">
              {me.plan.name} plan <span className="text-[13px] font-normal text-white/50">· {me.company.teamSize} people</span>
            </h3>
          </div>
          <p className="text-[13px] text-white/70">
            {me.usage.used.toLocaleString()} of {me.usage.limit.toLocaleString()} tokens used this month
          </p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${full ? "bg-rose-400" : pct > 80 ? "bg-amber-400" : "bg-violet-500"}`}
            style={{ width: `${Math.max(pct, 1)}%` }}
          />
        </div>
        <p className="mt-2 text-[12px] text-white/45">
          Tokens measure how much EverMind reads and writes. Your allowance resets at the start of each month.
        </p>
        {full && isFree && (
          <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-300">
            You&apos;ve used your free tokens for this month. Upgrade to keep using EverMind.
          </p>
        )}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">{error}</p>}

      <h3 className="mb-3 mt-8 text-[16px] font-semibold text-white">Plans</h3>
      <div className="grid gap-4 lg:grid-cols-3">
        {me.plans.map((p) => {
          const current = p.id === me.plan.id;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 ${current ? "border-violet-500/50 bg-violet-500/[0.07]" : "border-white/[0.07] bg-white/[0.025]"}`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-[16px] font-semibold text-white">{p.name}</h4>
                {current && <span className="rounded-full bg-violet-600/40 px-2.5 py-0.5 text-[11px] text-violet-100">Current</span>}
              </div>
              <p className="mt-1 text-[12px] text-white/55">{p.blurb}</p>
              <ul className="mt-4 space-y-2 text-[13px] text-white/80">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" />{formatTokens(p.monthlyTokens)} tokens / month</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" />Up to {p.seats} team members</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" />Projects and company memory</li>
              </ul>
              {!current && p.id !== "free" && isFree && (
                <button
                  disabled={!me.can.manageBilling || me.upgradeRequested || busy === p.id}
                  onClick={() => requestUpgrade(p.id)}
                  className="mt-5 w-full rounded-xl bg-violet-600 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  {me.upgradeRequested ? "Request received" : busy === p.id ? "Sending…" : `Request ${p.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isFree && (
        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          {me.upgradeRequested ? (
            <p className="text-[13px] text-emerald-300">
              Thanks — we&apos;ve got your upgrade request and will contact you to complete it.
            </p>
          ) : me.can.manageBilling ? (
            <>
              <p className="text-[13px] text-white/70">
                Online payment isn&apos;t available yet. Choose a plan above and we&apos;ll contact you to switch your company over.
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Optional: tell us what you need (team size, how you use EverMind)…"
                className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-violet-500/70"
              />
            </>
          ) : (
            <p className="text-[13px] text-white/60">Only the company owner can request a plan change.</p>
          )}
        </div>
      )}
    </PageShell>
  );
}
