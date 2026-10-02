"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MessageSquare, Plus, X } from "lucide-react";
import PageShell from "@/components/PageShell";
import { agents } from "@/constants/agents";
import { AGENT_TRAINING } from "@/constants/agentTraining";
import { industryById } from "@/constants/industries";
import { api, errMsg } from "@/lib/client";
import { useApi, type Me } from "@/lib/useApi";

type Agent = (typeof agents)[number];

export default function AgentsPage() {
  const { data: me, reload } = useApi<Me>("/api/auth/me");
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const manage = me?.can.manageTeam ?? false;
  const team = me ? agents.filter((a) => me.agents.includes(a.id)) : agents;
  const others = me ? agents.filter((a) => !me.agents.includes(a.id)) : [];
  const recommended = industryById(me?.company.industry)?.recommended ?? [];
  const open = agents.find((a) => a.id === openId) ?? null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function setTeam(ids: string[]) {
    setError("");
    try {
      await api("/api/company/agents", "PATCH", { agents: ids });
      reload();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  return (
    <PageShell
      title="Your AI team"
      subtitle="Specialists you can talk to. Pick one to chat, or open Details to see what it knows and what it can do."
    >
      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">{error}</p>}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {team.map((a) => {
          const t = AGENT_TRAINING[a.id];
          const Icon = a.icon;
          return (
            <li key={a.id} className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-violet-500/30">
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.tone}`}><Icon size={20} /></span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-white">{a.name}</p>
                  <p className="truncate text-[12px] text-white/50">{a.text}</p>
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-white/65">{t.mission}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.playbooks.slice(0, 3).map((p) => (
                  <span key={p.name} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/65">{p.name}</span>
                ))}
                {t.playbooks.length > 3 && <span className="px-1 py-1 text-[11px] text-white/40">+{t.playbooks.length - 3} more</span>}
              </div>

              <div className="mt-auto flex items-center gap-2 pt-5">
                <Link href={`/chat?agent=${a.id}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500">
                  <MessageSquare size={14} /> Chat
                </Link>
                <button onClick={() => setOpenId(a.id)} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3.5 py-2.5 text-[13px] text-white/75 hover:bg-white/5">
                  Details <ArrowRight size={13} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {others.length > 0 && (
        <section className="mt-10">
          <h3 className="text-[15px] font-semibold text-white">More specialists</h3>
          <p className="mt-1 text-[12px] text-white/50">{manage ? "Add any of these to your team." : "Ask an owner or admin to add them to your team."}</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {others.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-white/[0.14] p-4">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.tone}`}><Icon size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-white">{a.name}</span>
                    <span className="block truncate text-[12px] text-white/50">{a.text}</span>
                    {recommended.includes(a.id) && <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Recommended for you</span>}
                  </span>
                  {manage && (
                    <button onClick={() => setTeam([...team.map((x) => x.id), a.id])} className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-[12px] text-white/80 hover:bg-white/5">
                      <Plus size={13} /> Add
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              key="scrim"
              aria-label="Close details"
              onClick={() => setOpenId(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 cursor-default bg-black/40"
            />
            <motion.aside
              key="panel"
              role="dialog"
              aria-label={`${open.name} details`}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-y-0 right-0 z-40 flex w-[480px] max-w-full flex-col border-l border-white/[0.08] bg-[var(--panel-bg)] shadow-[-16px_0_40px_rgba(0,0,0,.25)]"
            >
              <Details agent={open} onClose={() => setOpenId(null)}
                canRemove={manage && team.length > 1}
                onRemove={() => { void setTeam(team.filter((x) => x.id !== open.id).map((x) => x.id)); setOpenId(null); }} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

function Details({ agent, onClose, canRemove, onRemove }: { agent: Agent; onClose: () => void; canRemove: boolean; onRemove: () => void }) {
  const t = AGENT_TRAINING[agent.id];
  const Icon = agent.icon;
  const list = "list-disc space-y-1.5 pl-4 text-[13px] leading-snug text-white/70";

  return (
    <>
      <div className="flex items-start gap-3 border-b border-white/[0.07] p-5">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${agent.tone}`}><Icon size={22} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold text-white">{agent.name}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-white/60">{t.mission}</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"><X size={18} /></button>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
        <section>
          <h3 className="mb-2 text-[11px] uppercase tracking-wide text-white/40">Playbooks · tap to start</h3>
          <ul className="space-y-1.5">
            {t.playbooks.map((p) => (
              <li key={p.name}>
                <Link href={`/chat?agent=${agent.id}&q=${encodeURIComponent(p.ask)}`} className="block rounded-xl border border-white/10 px-3.5 py-2.5 transition hover:border-violet-500/50 hover:bg-white/[0.04]">
                  <span className="block text-[13px] font-medium text-white">{p.name}</span>
                  <span className="mt-0.5 block text-[12px] text-white/50">{p.ask}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-[11px] uppercase tracking-wide text-white/40">Foundations — used in Basic answers</h3>
          <ul className={list}>{t.basics.map((b) => <li key={b}>{b}</li>)}</ul>
        </section>

        <section>
          <h3 className="mb-2 text-[11px] uppercase tracking-wide text-white/40">Advanced toolkit — used in Advanced answers</h3>
          <ul className={list}>{t.advanced.map((b) => <li key={b}>{b}</li>)}</ul>
        </section>

        <section>
          <h3 className="mb-2 text-[11px] uppercase tracking-wide text-white/40">Local context</h3>
          <p className="text-[13px] leading-relaxed text-white/65">{t.india}</p>
        </section>
      </div>

      <div className="flex items-center gap-2 border-t border-white/[0.07] p-4">
        <Link href={`/chat?agent=${agent.id}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500">
          <MessageSquare size={14} /> Chat with {agent.name.replace(" Agent", "")}
        </Link>
        {canRemove && (
          <button onClick={onRemove} className="rounded-xl border border-white/10 px-3.5 py-2.5 text-[13px] text-white/60 hover:border-rose-500/40 hover:text-rose-300">
            Remove from team
          </button>
        )}
      </div>
    </>
  );
}
