"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ClipboardList, Lightbulb, Scale, Search } from "lucide-react";
import { useApi, type Me } from "@/lib/useApi";

const starters = [
  { icon: ClipboardList, label: "Plan something", text: "Help me plan " },
  { icon: Lightbulb, label: "Solve a problem", text: "I need to solve this problem: " },
  { icon: Scale, label: "Make a decision", text: "Help me decide: " },
  { icon: Search, label: "Research", text: "Research " },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Hero() {
  const [message, setMessage] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const me = useApi<Me>("/api/auth/me").data;

  function execute() {
    const prompt = message.trim();
    if (prompt) router.push(`/chat?q=${encodeURIComponent(prompt)}`);
  }

  function start(text: string) {
    setMessage(text);
    input.current?.focus();
  }

  return (
    <section>
      <h1 className="text-[30px] font-semibold leading-tight text-white" suppressHydrationWarning>
        {greeting()}
        {me ? `, ${me.user.name.split(" ")[0]}` : ""} <span>👋</span>
      </h1>
      <p className="mt-1 text-[15px] text-white/60">What would you like to accomplish today?</p>

      <div className="mt-5 rounded-2xl border-2 border-violet-500/60 bg-[var(--card-bg)] p-4 shadow-[0_0_28px_rgba(124,92,255,.25)]">
        <div className="relative">
          <textarea
            ref={input}
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                execute();
              }
            }}
            placeholder="Tell EverMind what you want to get done…"
            aria-label="Your objective"
            className="w-full resize-none bg-transparent pr-14 text-[15px] text-white outline-none placeholder:text-white/40"
          />
          <button
            onClick={execute}
            disabled={!message.trim()}
            aria-label="Send"
            className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {starters.map(({ icon: Icon, label, text }) => (
          <button
            key={label}
            onClick={() => start(text)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[13px] text-white/75 transition hover:border-violet-500/50 hover:text-white"
          >
            <Icon size={14} className="text-white/55" />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
