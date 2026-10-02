"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { agents } from "@/constants/agents";
import { industryById } from "@/constants/industries";
import { api, errMsg } from "@/lib/client";
import { useApi, type Me } from "@/lib/useApi";

export default function OnboardingPage() {
  const router = useRouter();
  const me = useApi<Me>("/api/auth/me").data;
  const [chosen, setChosen] = useState<string[] | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  if (!me) return <p className="p-10 text-[14px] text-white/60">Loading…</p>;

  const industry = industryById(me.company.industry);
  const recommended = industry?.recommended ?? [];
  const selected = chosen ?? recommended;

  const toggle = (id: string) =>
    setChosen(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  async function checkWithAi() {
    setChecking(true);
    setError("");
    setNote("");
    try {
      const r = await api<{ picks: { id: string; reason: string }[] }>("/api/company/recommend-agents", "POST");
      setChosen(r.picks.map((p) => p.id));
      setReasons(Object.fromEntries(r.picks.map((p) => [p.id, p.reason])));
      setNote("EverMind read what your company does and picked these specialists for you.");
    } catch (e) {
      setError(`${errMsg(e)} You can still choose from the suggestions below.`);
    } finally {
      setChecking(false);
    }
  }

  async function save() {
    if (selected.length === 0) return setError("Choose at least one agent.");
    setBusy(true);
    setError("");
    try {
      await api("/api/company/agents", "PATCH", { agents: selected });
      router.replace("/projects?welcome=1");
      router.refresh();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-[980px] px-6 py-10">
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)] shadow-[0_0_20px_rgba(124,92,255,.6)]" />
        <span className="text-[19px] font-semibold">EverMind</span>
      </div>

      <h1 className="mt-8 text-[30px] font-bold leading-tight">Build your AI team</h1>
      <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-white/65">
        Welcome, {me.user.name.split(" ")[0]}. Pick the specialists {me.company.name} needs. We pre-selected the ones that
        usually help a <span className="text-white">{industry?.label ?? "company like yours"}</span> most. You can change this anytime.
      </p>

      {industry && <p className="mt-3 rounded-xl bg-violet-500/10 px-4 py-3 text-[13px] text-violet-200">{industry.blurb}</p>}
      {me.company.about && (
        <p className="mt-3 text-[13px] text-white/55"><span className="text-white/40">You said: </span>&ldquo;{me.company.about}&rdquo;</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={checkWithAi}
          disabled={checking}
          className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-[13px] font-medium text-violet-200 transition hover:bg-violet-500/20 disabled:opacity-60"
        >
          <Sparkles size={15} /> {checking ? "EverMind is checking…" : "Let EverMind check my business"}
        </button>
        <button onClick={() => setChosen(recommended)} className="text-[13px] text-white/60 hover:text-white">Use recommended</button>
        <button onClick={() => setChosen(agents.map((a) => a.id))} className="text-[13px] text-white/60 hover:text-white">Select all</button>
        <span className="ml-auto text-[13px] text-white/50">{selected.length} of {agents.length} selected</span>
      </div>
      {note && <p className="mt-3 text-[13px] text-emerald-400">{note}</p>}
      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-300">{error}</p>}

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map(({ id, icon: Icon, tone, name, text }) => {
          const on = selected.includes(id);
          const rec = recommended.includes(id);
          return (
            <li key={id}>
              <button
                onClick={() => toggle(id)}
                aria-pressed={on}
                className={`relative h-full w-full rounded-2xl border p-4 text-left transition ${on ? "border-violet-500/60 bg-violet-500/[0.08]" : "border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05]"}`}
              >
                <span className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border ${on ? "border-violet-500 bg-violet-600 text-white" : "border-white/20"}`}>
                  {on && <Check size={12} />}
                </span>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={18} /></span>
                <p className="mt-3 text-[14px] font-semibold text-white">{name}</p>
                <p className="mt-0.5 text-[12px] text-white/55">{text}</p>
                {reasons[id] ? (
                  <p className="mt-2 text-[12px] leading-snug text-violet-200">{reasons[id]}</p>
                ) : (
                  rec && <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">Recommended</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex justify-end">
        <button
          onClick={save}
          disabled={busy || selected.length === 0}
          className="rounded-xl bg-violet-600 px-7 py-3 text-[14px] font-medium text-white shadow-[0_0_24px_rgba(124,92,255,.4)] hover:bg-violet-500 disabled:opacity-50"
        >
          {busy ? "Setting up…" : "Continue"}
        </button>
      </div>
    </main>
  );
}
