"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, MessageSquare, Users, X } from "lucide-react";
import { agents } from "@/constants/agents";
import { AGENT_TRAINING } from "@/constants/agentTraining";
import { useApi, timeAgo, type ConversationSummary, type Me } from "@/lib/useApi";

type Agent = (typeof agents)[number];

function AgentDetail({ agent, onBack }: { agent: Agent; onBack: () => void }) {
  const chats = useApi<{ conversations: ConversationSummary[] }>("/api/conversations").data;
  const mine = (chats?.conversations ?? []).filter((c) => c.agent === agent.id).slice(0, 5);
  const Icon = agent.icon;
  const playbooks = AGENT_TRAINING[agent.id]?.playbooks ?? [];

  return (
    <>
      <div className="px-5 pb-3 pt-5">
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white">
          <ArrowLeft size={14} /> All agents
        </button>
        <div className="flex items-center gap-3">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${agent.tone}`}>
            <Icon size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-semibold text-white">{agent.name}</h2>
            <p className="text-[12px] text-white/55">{agent.text}</p>
          </div>
        </div>
        <Link
          href={`/chat?agent=${agent.id}`}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500"
        >
          <MessageSquare size={15} /> Chat with {agent.name.replace(" Agent", "")}
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <p className="mb-2 mt-2 text-[11px] uppercase tracking-wide text-white/40">Playbooks · tap to start</p>
        <ul className="space-y-1.5">
          {playbooks.map((pb) => (
            <li key={pb.name}>
              <Link
                href={`/chat?agent=${agent.id}&q=${encodeURIComponent(pb.ask)}`}
                className="block rounded-xl border border-white/10 px-3 py-2.5 transition hover:border-violet-500/50 hover:bg-white/[0.04]"
              >
                <span className="block text-[13px] font-medium text-white">{pb.name}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-white/50">{pb.ask}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mb-2 mt-6 text-[11px] uppercase tracking-wide text-white/40">Recent chats</p>
        {mine.length === 0 ? (
          <p className="text-[12px] text-white/45">No conversations with this agent yet.</p>
        ) : (
          <ul className="space-y-1">
            {mine.map((c) => (
              <li key={c.id}>
                <Link href={`/chat/${c.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.05]">
                  <span className="truncate text-[13px] text-white/85">{c.title}</span>
                  <span className="shrink-0 text-[11px] text-white/40">{timeAgo(c.updatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

/**
 * Page body plus a slim right-hand rail (like Gmail's side panel). Clicking the
 * team button or any agent icon opens a drawer on the right.
 */
export default function AgentDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const me = useApi<Me>("/api/auth/me").data;
  // Until the profile loads, show everyone; afterwards only the company's own team.
  const team = me ? agents.filter((a) => me.agents.includes(a.id)) : agents;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const agent = team.find((a) => a.id === selected);

  function pick(id: string) {
    // Clicking the active agent again closes the panel, like Gmail's side panel.
    if (open && selected === id) return setOpen(false);
    setSelected(id);
    setOpen(true);
  }

  function toggleList() {
    if (open && selected === null) return setOpen(false);
    setSelected(null);
    setOpen(true);
  }

  return (
    <div className="relative h-full">
      <div className={`h-full overflow-y-auto sm:pr-14 transition-[padding] duration-300 ${open ? "xl:pr-[calc(3.5rem+360px)]" : ""}`}>
        {children}
      </div>

      {/* Rail */}
      <div className="absolute inset-y-0 right-0 z-20 hidden w-14 flex-col items-center sm:flex border-l border-white/[0.07] bg-[var(--panel-bg)] py-4">
        <button
          onClick={toggleList}
          aria-label={open && selected === null ? "Close AI team" : "Open AI team"}
          aria-expanded={open && selected === null}
          title="My AI Team"
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${open && selected === null ? "bg-violet-600/25 text-violet-300" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
        >
          <Users size={19} />
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-semibold text-white">
            {team.length}
          </span>
        </button>

        <div className="my-3 h-px w-7 shrink-0 bg-white/10" />

        <ul className="flex min-h-0 flex-1 flex-col items-center gap-1.5 overflow-y-auto">
          {team.map(({ id, icon: Icon, tone, name }) => {
            const active = open && selected === id;
            return (
              <li key={id} className="group relative">
                <button
                  onClick={() => pick(id)}
                  aria-label={name}
                  aria-pressed={active}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition hover:scale-110 ${tone} ${active ? "ring-2 ring-violet-500" : ""}`}
                >
                  <Icon size={17} />
                </button>
                <span className="pointer-events-none absolute right-full top-1/2 z-30 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--card-bg)] px-2.5 py-1 text-[12px] text-white opacity-0 shadow-lg ring-1 ring-white/10 transition group-hover:opacity-100">
                  {name}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Phones: a floating button instead of the side rail */}
      <button
        onClick={toggleList}
        aria-label="Open AI team"
        className="fixed bottom-5 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_6px_24px_rgba(124,92,255,.5)] sm:hidden"
      >
        <Users size={20} />
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-violet-700">{team.length}</span>
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="drawer"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label="My AI Team"
            className="absolute inset-y-0 right-0 z-30 flex w-full flex-col sm:right-14 sm:z-10 sm:w-[360px] sm:max-w-[calc(100%-3.5rem)] border-l border-white/[0.07] bg-[var(--panel-bg)] shadow-[-12px_0_30px_rgba(0,0,0,.18)]"
          >
            <button onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
              <X size={17} />
            </button>

            {agent ? (
              <AgentDetail key={agent.id} agent={agent} onBack={() => setSelected(null)} />
            ) : (
              <>
                <div className="px-5 pb-3 pt-5">
                  <h2 className="text-[16px] font-semibold text-white">My AI Team</h2>
                  <p className="mt-0.5 text-[12px] text-white/50">Pick a specialist</p>
                </div>

                <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
                  {team.map(({ id, icon: Icon, tone, name, text }) => (
                    <li key={id}>
                      <button onClick={() => setSelected(id)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.06]">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-white">{name}</span>
                          <span className="block truncate text-[12px] text-white/50">{text}</span>
                        </span>
                        <ArrowRight size={15} className="shrink-0 text-white/0 transition group-hover:text-white/60" />
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-white/[0.07] px-5 py-3">
                  <Link href="/agents" className="text-[13px] font-medium text-violet-300 hover:underline">
                    Manage team →
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
