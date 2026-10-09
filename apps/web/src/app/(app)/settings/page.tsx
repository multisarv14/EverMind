"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import PageShell from "@/components/PageShell";
import { api, errMsg } from "@/lib/client";
import { useApi, formatInr, formatTokens, type Me } from "@/lib/useApi";
import { setThemePref, useThemePref, type ThemePref } from "@/lib/theme";
import { TEAM_SIZES, ROLE_LABEL } from "@/constants/team";
import { INDUSTRIES } from "@/constants/industries";

type Tab = "profile" | "company" | "appearance" | "plan";

const field =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-violet-500/70";
const card = "max-w-[620px] rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6";
const primary = "rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-60";

function Notice({ ok, error }: { ok: string; error: string }) {
  if (error) return <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-300">{error}</p>;
  if (ok) return <p className="rounded-lg bg-emerald-500/10 px-3 py-2.5 text-[13px] text-emerald-300">{ok}</p>;
  return null;
}

function Profile({ me, reload }: { me: Me; reload: () => void }) {
  const [name, setName] = useState(me.user.name);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");

  async function save(e: FormEvent) {
    e.preventDefault();
    setOk(""); setError("");
    try {
      await api("/api/settings/profile", "PATCH", { name, ...(next ? { currentPassword: current, newPassword: next } : {}) });
      setOk(next ? "Profile and password updated." : "Profile updated.");
      setCurrent(""); setNext("");
      reload();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <form onSubmit={save} className={`${card} space-y-4`}>
      <h3 className="text-[15px] font-semibold text-white">Your profile</h3>
      <div>
        <label htmlFor="pname" className="mb-1.5 block text-[13px] text-white/70">Name</label>
        <input id="pname" className={field} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} />
      </div>
      <div>
        <label className="mb-1.5 block text-[13px] text-white/70">Email</label>
        <input className={`${field} opacity-60`} value={me.user.email} disabled />
      </div>
      <div className="rounded-xl border border-white/[0.07] p-4">
        <p className="text-[13px] font-medium text-white">Change password</p>
        <p className="mb-3 text-[12px] text-white/45">Leave blank to keep your current password.</p>
        <div className="space-y-3">
          <input className={field} type="password" placeholder="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <input className={field} type="password" placeholder="New password (min 8 characters)" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} minLength={next ? 8 : undefined} />
        </div>
      </div>
      <p className="text-[12px] text-white/45">Your role: <span className="text-white/75">{ROLE_LABEL[me.role]}</span></p>
      <Notice ok={ok} error={error} />
      <button className={primary}>Save changes</button>
    </form>
  );
}

function Company({ me, reload }: { me: Me; reload: () => void }) {
  const [name, setName] = useState(me.company.name);
  const [size, setSize] = useState(me.company.teamSize);
  const [industry, setIndustry] = useState(me.company.industry);
  const [about, setAbout] = useState(me.company.about);
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const owner = me.can.manageBilling;

  async function save(e: FormEvent) {
    e.preventDefault();
    setOk(""); setError("");
    try {
      await api("/api/settings/company", "PATCH", { name, teamSize: size, ...(industry ? { industry } : {}), about });
      setOk("Company updated.");
      reload();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <form onSubmit={save} className={`${card} space-y-4`}>
      <h3 className="text-[15px] font-semibold text-white">Company</h3>
      <div>
        <label htmlFor="cname" className="mb-1.5 block text-[13px] text-white/70">Company name</label>
        <input id="cname" className={field} value={name} onChange={(e) => setName(e.target.value)} disabled={!owner} required minLength={2} maxLength={100} />
      </div>
      <div>
        <label htmlFor="csize" className="mb-1.5 block text-[13px] text-white/70">Team size</label>
        <select id="csize" className={field} value={size} onChange={(e) => setSize(e.target.value)} disabled={!owner}>
          {TEAM_SIZES.map((t) => <option key={t} value={t} className="bg-[var(--card-bg)]">{t}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="cind" className="mb-1.5 block text-[13px] text-white/70">Company type</label>
        <select id="cind" className={field} value={industry} onChange={(e) => setIndustry(e.target.value)} disabled={!owner}>
          <option value="">Not set</option>
          {INDUSTRIES.map((i) => <option key={i.id} value={i.id} className="bg-[var(--card-bg)]">{i.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="cabout" className="mb-1.5 block text-[13px] text-white/70">What your company does</label>
        <textarea id="cabout" className={`${field} resize-none`} rows={3} maxLength={400} value={about} onChange={(e) => setAbout(e.target.value)} disabled={!owner} placeholder="EverMind uses this to give answers that fit your business." />
      </div>
      {!owner && <p className="text-[12px] text-white/45">Only the company owner can change these details.</p>}
      <Notice ok={ok} error={error} />
      {owner && <button className={primary}>Save changes</button>}
    </form>
  );
}

function Appearance() {
  const pref = useThemePref();
  const options: { id: ThemePref; label: string; icon: typeof Sun; note: string }[] = [
    { id: "light", label: "Light", icon: Sun, note: "Bright and clean" },
    { id: "dark", label: "Dark", icon: Moon, note: "Easy on the eyes" },
    { id: "system", label: "System", icon: Monitor, note: "Match your device" },
  ];

  return (
    <div className={card}>
      <h3 className="text-[15px] font-semibold text-white">Appearance</h3>
      <p className="mt-1 text-[12px] text-white/50">Choose how EverMind looks on this device.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {options.map(({ id, label, icon: Icon, note }) => (
          <button
            key={id}
            onClick={() => setThemePref(id)}
            aria-pressed={pref === id}
            className={`rounded-xl border p-4 text-left transition ${pref === id ? "border-violet-500/60 bg-violet-500/10" : "border-white/10 hover:bg-white/5"}`}
          >
            <Icon size={20} className="text-violet-300" />
            <p className="mt-3 text-[14px] font-medium text-white">{label}</p>
            <p className="text-[12px] text-white/50">{note}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

interface Payment {
  id: string;
  kind: "subscription" | "pack";
  plan: string | null;
  packId: string | null;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  createdAt: string;
}

const dateOf = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function Plan({ me, reload }: { me: Me; reload: () => void }) {
  const [period, setPeriod] = useState<"monthly" | "yearly">(me.billing.interval ?? "monthly");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const justPaid = useSearchParams().has("paid");
  const history = useApi<{ payments: Payment[] }>("/api/billing");

  // Back from the payment page: the webhook usually lands within seconds, so refresh a few times.
  useEffect(() => {
    if (!justPaid) return;
    const timers = [3000, 8000, 15000].map((ms) => setTimeout(() => { reload(); history.reload(); }, ms));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function go(key: string, url: string, body: unknown) {
    setBusy(key);
    setError("");
    try {
      const res = await api<{ url: string }>(url, "POST", body);
      window.location.assign(res.url);
    } catch (e) {
      setError(errMsg(e));
      setBusy("");
    }
  }

  async function requestUpgrade(plan: string) {
    setBusy(plan);
    setError("");
    try {
      await api("/api/plan/upgrade", "POST", { plan, note });
      reload();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy("");
    }
  }

  async function cancel() {
    if (!window.confirm("Stop renewing your plan? It keeps working until the end of the period you've paid for.")) return;
    setBusy("cancel");
    setError("");
    try {
      await api("/api/billing/cancel", "POST");
      reload();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy("");
    }
  }

  const { used, limit, packBalance, resetsAt } = me.usage;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const full = used >= limit;
  const isFree = me.plan.id === "free";
  const b = me.billing;
  const subscribed = b.status === "active" || b.status === "past_due";
  const owner = me.can.manageBilling;

  return (
    <>
      {justPaid && (
        <p className="mb-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-300">
          Thanks! Your payment is being confirmed. Credits and plan changes appear here within a minute.
        </p>
      )}
      {b.graceUntil && (
        <p role="alert" className="mb-4 rounded-xl bg-amber-500/10 px-4 py-3 text-[13px] text-amber-300">
          Your last renewal payment failed. The {me.plan.name} plan keeps working until {dateOf(b.graceUntil)}; please update your payment from the link in the Razorpay email, or your company moves to the Free plan.
        </p>
      )}

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[12px] text-white/50">{me.company.name}</p>
            <h3 className="text-[18px] font-semibold text-white">
              {me.plan.name} plan{b.interval && subscribed && <span className="text-[13px] font-normal text-white/50"> · billed {b.interval}</span>}
            </h3>
            {subscribed && b.periodEnd && (
              <p className="mt-0.5 text-[12px] text-white/50">
                {b.cancelAtPeriodEnd ? `Ends on ${dateOf(b.periodEnd)}, then moves to Free` : `Renews on ${dateOf(b.periodEnd)}`}
              </p>
            )}
          </div>
          <p className="text-[13px] text-white/70">{used.toLocaleString()} of {limit.toLocaleString()} credits used</p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full ${full ? "bg-rose-400" : pct > 80 ? "bg-amber-400" : "bg-violet-500"}`} style={{ width: `${Math.max(pct, 1)}%` }} />
        </div>
        <p className="mt-2 text-[12px] text-white/45">
          Credits measure how much AI work EverMind does; cheaper AI models use fewer. Your allowance resets on {dateOf(resetsAt)}.
          {packBalance > 0 && <> You also have <span className="text-white/80">{packBalance.toLocaleString()} pack credits</span>, used after the allowance.</>}
        </p>
        {full && packBalance <= 0 && (
          <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-300">
            {me.plan.topUps ? "This month's credits are used up. Buy a credit pack below or upgrade to keep using AI." : "You've used your free credits for this month. Upgrade to keep using EverMind."}
          </p>
        )}
        {owner && subscribed && !b.cancelAtPeriodEnd && (
          <button onClick={cancel} disabled={busy === "cancel"} className="mt-4 text-[12px] text-white/50 underline hover:text-white/80 disabled:opacity-50">
            {busy === "cancel" ? "Cancelling…" : "Cancel plan"}
          </button>
        )}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">{error}</p>}

      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[16px] font-semibold text-white">Plans</h3>
        <div className="inline-flex rounded-lg border border-white/10 p-0.5 text-[12px]" role="group" aria-label="Billing period">
          {(["monthly", "yearly"] as const).map((i) => (
            <button key={i} onClick={() => setPeriod(i)} aria-pressed={period === i}
              className={`rounded-md px-3 py-1.5 ${period === i ? "bg-violet-600 text-white" : "text-white/60 hover:text-white"}`}>
              {i === "monthly" ? "Monthly" : "Yearly · 2 months free"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {me.plans.map((p) => {
          const current = p.id === me.plan.id && (p.id === "free" || !subscribed || b.interval === period);
          const price = p.priceInr[period];
          return (
            <div key={p.id} className={`flex flex-col rounded-2xl border p-5 ${p.id === me.plan.id ? "border-violet-500/50 bg-violet-500/[0.07]" : "border-white/[0.07] bg-white/[0.025]"}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-[16px] font-semibold text-white">{p.name}</h4>
                {p.id === me.plan.id && <span className="rounded-full bg-violet-600/40 px-2.5 py-0.5 text-[11px] text-violet-100">Current</span>}
              </div>
              <p className="mt-1 text-[12px] text-white/55">{p.blurb}</p>
              <p className="mt-3 text-[22px] font-semibold text-white">
                {price ? formatInr(price) : "₹0"}
                <span className="text-[12px] font-normal text-white/50">{price ? ` / ${period === "monthly" ? "month" : "year"} + GST` : " forever"}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-[13px] text-white/80">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" />{formatTokens(p.monthlyCredits)} AI credits / month</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" />Up to {p.seats} team members</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" />{p.topUps ? "Buy extra credits anytime" : "Projects and company memory"}</li>
              </ul>
              {p.id !== "free" && !current && owner && b.online && (
                <button disabled={Boolean(busy)} onClick={() => go(p.id, "/api/billing/checkout", { plan: p.id, interval: period })}
                  className="mt-5 w-full rounded-xl bg-violet-600 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-50">
                  {busy === p.id ? "Opening payment…" : isFree ? `Choose ${p.name}` : `Switch to ${p.name}${p.id === me.plan.id ? ` (${period})` : ""}`}
                </button>
              )}
              {p.id !== "free" && !current && owner && !b.online && isFree && (
                <button disabled={me.upgradeRequested || Boolean(busy)} onClick={() => requestUpgrade(p.id)}
                  className="mt-5 w-full rounded-xl bg-violet-600 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-50">
                  {me.upgradeRequested ? "Request received" : busy === p.id ? "Sending…" : `Request ${p.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {owner && b.online && subscribed && (
        <p className="mt-3 text-[12px] text-white/45">Switching plans starts the new plan right away and stops the old one. The unused part of the old period isn&apos;t refunded automatically; contact us if you need a credit.</p>
      )}

      {!b.online && isFree && (
        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          {me.upgradeRequested ? (
            <p className="text-[13px] text-emerald-400">Thanks — we&apos;ve got your upgrade request and will contact you to complete it.</p>
          ) : owner ? (
            <>
              <p className="text-[13px] text-white/70">Online payment isn&apos;t available yet. Choose a plan above and we&apos;ll contact you to switch your company over.</p>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2}
                placeholder="Optional: tell us what you need (team size, how you use EverMind)…"
                className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-violet-500/70" />
            </>
          ) : (
            <p className="text-[13px] text-white/60">Only the company owner can request a plan change.</p>
          )}
        </div>
      )}

      <h3 className="mb-1 mt-8 text-[16px] font-semibold text-white">Extra credits</h3>
      <p className="mb-3 text-[12px] text-white/50">Used after your monthly allowance runs out. Valid for 12 months.</p>
      {me.plan.topUps ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {me.packs.map((pack) => (
            <div key={pack.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <p className="text-[16px] font-semibold text-white">{formatTokens(pack.credits)} credits</p>
              <p className="mt-1 text-[13px] text-white/60">{formatInr(pack.priceInr)} + GST</p>
              {owner && b.online && (
                <button disabled={Boolean(busy)} onClick={() => go(`pack-${pack.id}`, "/api/billing/topup", { pack: pack.id })}
                  className="mt-4 w-full rounded-xl border border-violet-500/50 py-2 text-[13px] font-medium text-violet-200 hover:bg-violet-500/10 disabled:opacity-50">
                  {busy === `pack-${pack.id}` ? "Opening payment…" : "Buy"}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-[13px] text-white/60">Credit packs are available on the Pro and Business plans.</p>
      )}
      {!owner && <p className="mt-3 text-[12px] text-white/45">Only the company owner can change the plan or buy credits.</p>}

      {owner && (history.data?.payments.length ?? 0) > 0 && (
        <>
          <h3 className="mb-3 mt-8 text-[16px] font-semibold text-white">Payments</h3>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
            <table className="w-full text-left text-[13px]">
              <thead className="text-white/50">
                <tr><th className="px-4 py-2.5 font-normal">Date</th><th className="px-4 py-2.5 font-normal">For</th><th className="px-4 py-2.5 font-normal">Amount (incl. GST)</th><th className="px-4 py-2.5 font-normal">Status</th><th className="px-4 py-2.5 font-normal">Reference</th></tr>
              </thead>
              <tbody className="text-white/80">
                {history.data!.payments.map((p) => (
                  <tr key={p.id} className="border-t border-white/[0.06]">
                    <td className="px-4 py-2.5">{dateOf(p.createdAt)}</td>
                    <td className="px-4 py-2.5">{p.kind === "pack" ? `Credit pack (${p.packId})` : `${p.plan ? p.plan[0].toUpperCase() + p.plan.slice(1) : ""} plan`}</td>
                    <td className="px-4 py-2.5">{formatInr(p.amount / 100)}</td>
                    <td className={`px-4 py-2.5 ${p.status === "captured" ? "text-emerald-400" : "text-rose-300"}`}>{p.status === "captured" ? "Paid" : "Failed"}</td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-white/50">{p.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

export default function SettingsPage() {
  const { data: me, reload } = useApi<Me>("/api/auth/me");
  // Links from emails and the payment page open a tab directly (/settings?tab=plan).
  const wanted = useSearchParams().get("tab");
  const [tab, setTab] = useState<Tab>(
    wanted === "company" || wanted === "appearance" || wanted === "plan" ? wanted : "profile"
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "company", label: "Company" },
    { id: "appearance", label: "Appearance" },
    { id: "plan", label: "Plan & billing" },
  ];

  return (
    <PageShell title="Settings" subtitle="Your account, company, appearance and plan">
      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/[0.07] pb-3">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-[13px] ${tab === t.id ? "bg-violet-600/25 text-white" : "text-white/60 hover:bg-white/5"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {!me ? <p className="text-[13px] text-white/60">Loading…</p> : (
        <>
          {tab === "profile" && <Profile me={me} reload={reload} />}
          {tab === "company" && <Company me={me} reload={reload} />}
          {tab === "appearance" && <Appearance />}
          {tab === "plan" && <Plan me={me} reload={reload} />}
        </>
      )}
    </PageShell>
  );
}
