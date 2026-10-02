"use client";

import { useState, type FormEvent } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import PageShell from "@/components/PageShell";
import { api, errMsg } from "@/lib/client";
import { useApi, formatTokens, type Me } from "@/lib/useApi";
import { setThemePref, useThemePref, type ThemePref } from "@/lib/theme";
import { TEAM_SIZES, ROLE_LABEL } from "@/constants/team";

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
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const owner = me.can.manageBilling;

  async function save(e: FormEvent) {
    e.preventDefault();
    setOk(""); setError("");
    try {
      await api("/api/settings/company", "PATCH", { name, teamSize: size });
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

function Plan({ me, reload }: { me: Me; reload: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

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

  const pct = Math.min(100, Math.round((me.usage.used / me.usage.limit) * 100));
  const full = me.usage.used >= me.usage.limit;
  const isFree = me.plan.id === "free";

  return (
    <>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[12px] text-white/50">{me.company.name}</p>
            <h3 className="text-[18px] font-semibold text-white">
              {me.plan.name} plan <span className="text-[13px] font-normal text-white/50">· {me.company.teamSize} people</span>
            </h3>
          </div>
          <p className="text-[13px] text-white/70">{me.usage.used.toLocaleString()} of {me.usage.limit.toLocaleString()} tokens used this month</p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full ${full ? "bg-rose-400" : pct > 80 ? "bg-amber-400" : "bg-violet-500"}`} style={{ width: `${Math.max(pct, 1)}%` }} />
        </div>
        <p className="mt-2 text-[12px] text-white/45">Tokens measure how much EverMind reads and writes. Your allowance resets at the start of each month.</p>
        {full && isFree && <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-300">You&apos;ve used your free tokens for this month. Upgrade to keep using EverMind.</p>}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">{error}</p>}

      <h3 className="mb-3 mt-8 text-[16px] font-semibold text-white">Plans</h3>
      <div className="grid gap-4 lg:grid-cols-3">
        {me.plans.map((p) => {
          const current = p.id === me.plan.id;
          return (
            <div key={p.id} className={`rounded-2xl border p-5 ${current ? "border-violet-500/50 bg-violet-500/[0.07]" : "border-white/[0.07] bg-white/[0.025]"}`}>
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
                <button disabled={!me.can.manageBilling || me.upgradeRequested || busy === p.id} onClick={() => requestUpgrade(p.id)}
                  className="mt-5 w-full rounded-xl bg-violet-600 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-50">
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
            <p className="text-[13px] text-emerald-400">Thanks — we&apos;ve got your upgrade request and will contact you to complete it.</p>
          ) : me.can.manageBilling ? (
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
    </>
  );
}

export default function SettingsPage() {
  const { data: me, reload } = useApi<Me>("/api/auth/me");
  const [tab, setTab] = useState<Tab>("profile");

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "company", label: "Company" },
    { id: "appearance", label: "Appearance" },
    { id: "plan", label: "Plan & usage" },
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
