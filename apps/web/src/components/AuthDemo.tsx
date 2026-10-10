"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Download, Pencil, Send } from "lucide-react";
import { agents } from "@/constants/agents";

const teamAgents = agents.filter((a) => ["strategy", "hr", "finance", "sales"].includes(a.id));

type Msg = { from: "user" | "ai"; text: string; gate?: boolean };

const actions = [
  { id: "approve", icon: Check, label: "Approve plan", user: "Approve plan", ai: "Done. I created 3 tasks: open the 2 engineer roles, brief the sales lead search, and book interviews for week 2. HR Agent will draft the job posts next." },
  { id: "edit", icon: Pencil, label: "Edit draft", user: "Edit draft", ai: "Opened the draft. Tell me what to change, for example “lower the budget by 10%” or “hire the sales lead first”, and I'll update the plan." },
  { id: "export", icon: Download, label: "Export", user: "Export", ai: "Your plan is ready as a document with the 90-day timeline and monthly budget. In your account you can download it as PDF or Word." },
];

const GATE = "That needs your own company workspace. Create an account or sign in and I'll continue from here.";

/** A small scripted preview of EverMind on the auth screens. Nothing is sent to a server. */
export default function AuthDemo() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    body.current?.scrollTo({ top: body.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const act = (a: (typeof actions)[number]) =>
    setMsgs((m) => [...m, { from: "user", text: a.user }, { from: "ai", text: a.ai }]);

  function ask(e: FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    setText("");
    setMsgs((m) => [...m, { from: "user", text: q }, { from: "ai", text: GATE, gate: true }]);
  }

  const orb = "mt-0.5 h-7 w-7 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)]";
  const bubbleUser = "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-violet-600/90 px-4 py-2.5 text-[14px] text-white";

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-violet-400/20 bg-[color-mix(in_srgb,var(--card-bg)_80%,transparent)] shadow-[0_12px_40px_rgba(124,92,255,.18)] backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <p className="text-[12px] font-medium uppercase tracking-wide text-violet-300">Try it</p>
        <div className="flex items-center">
          {teamAgents.map(({ id, icon: Icon, tone, name }, i) => (
            <span key={id} title={name} className={`flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-[var(--card-bg)] ${tone} ${i > 0 ? "-ml-2" : ""}`}>
              <Icon size={14} />
            </span>
          ))}
          <span className="ml-2.5 text-[12px] text-white/50">4 agents working</span>
        </div>
      </div>

      <div ref={body} className="max-h-[300px] space-y-4 overflow-y-auto p-5">
        <p className={bubbleUser}>&ldquo;Plan our hiring for the next quarter.&rdquo;</p>
        <div className="flex gap-3">
          <span className={orb} />
          <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3 text-[14px] leading-relaxed text-white/80">
            <p>I recommend two engineers and one sales lead first. Here&apos;s the 90-day plan and budget:</p>
            <ul className="mt-2.5 space-y-1.5 text-[13px] text-white/65">
              {["Role priorities and hiring order", "Budget by month, within runway", "Interview plan and 30-60-90 goals"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"><Check size={10} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {msgs.map((m, i) =>
          m.from === "user" ? (
            <p key={i} className={bubbleUser}>{m.text}</p>
          ) : (
            <div key={i} className="flex gap-3">
              <span className={orb} />
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3 text-[14px] leading-relaxed text-white/80">
                <p>{m.text}</p>
                {m.gate && (
                  <div className="mt-3 flex gap-2">
                    <Link href="/signup" className="rounded-lg bg-violet-600 px-3.5 py-1.5 text-[12.5px] font-medium text-white hover:bg-violet-500">Create account</Link>
                    <Link href="/login" className="rounded-lg border border-white/15 px-3.5 py-1.5 text-[12.5px] text-white/75 hover:text-white">Sign in</Link>
                  </div>
                )}
              </div>
            </div>
          ),
        )}
      </div>

      <div className="space-y-3 border-t border-white/10 p-4">
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <button key={a.id} type="button" onClick={() => act(a)} className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] transition ${a.id === "approve" ? "bg-violet-600 font-medium text-white hover:bg-violet-500" : "border border-white/15 text-white/75 hover:text-white"}`}>
              <a.icon size={13} /> {a.label}
            </button>
          ))}
        </div>
        <form onSubmit={ask} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a follow-up…" aria-label="Ask a follow-up" className="min-w-0 flex-1 bg-transparent py-1.5 text-[13px] text-white outline-none placeholder:text-white/35" />
          <button type="submit" aria-label="Send" className="text-violet-300 hover:text-violet-200"><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
}
