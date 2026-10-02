"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  ClipboardList,
  Lightbulb,
  Scale,
  ScanSearch,
  Search,
  Sparkles,
} from "lucide-react";

const suggestions = [
  { icon: ClipboardList, label: "Plan something" },
  { icon: Lightbulb, label: "Solve a problem" },
  { icon: Scale, label: "Make a decision" },
  { icon: ScanSearch, label: "Analyze this" },
  { icon: Search, label: "Research" },
  { icon: Sparkles, label: "Create anything" },
];

export default function Hero() {
  const [message, setMessage] = useState("");
  const router = useRouter();

  function execute(raw: string) {
    const prompt = raw.trim();
    if (!prompt) return;
    router.push(`/chat?q=${encodeURIComponent(prompt)}`);
  }

  return (
    <section>
      <h1 className="text-[34px] font-semibold leading-tight text-white">
        Good morning, CEO <span>👋</span>
      </h1>
      <p className="bg-gradient-to-r from-sky-400 via-violet-400 to-violet-500 bg-clip-text text-[36px] font-bold leading-tight text-transparent">
        I&apos;m EverMind.
      </p>
      <p className="mt-2 text-[14px] leading-snug text-white/70">
        I run your company. I plan, decide, execute and deliver.
        <br />
        You focus on the vision. I handle everything else.
      </p>

      <div className="mt-4 rounded-2xl border-2 border-violet-500/70 bg-[#0a0c1c] px-5 pb-3 pt-4 shadow-[0_0_28px_rgba(124,92,255,.35)]">
        <p className="text-[15px] text-white/90">What would you like to accomplish?</p>

        <div className="relative mt-1">
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                execute(message);
              }
            }}
            placeholder="Tell me anything..."
            className="w-full resize-none bg-transparent pr-14 text-[14px] text-white outline-none placeholder:text-white/40"
          />
          <button
            onClick={() => execute(message)}
            aria-label="Execute"
            className="absolute bottom-1 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_0_16px_rgba(124,92,255,.6)] transition hover:bg-violet-500 "
          >
            <ArrowUp size={18} />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 border-t border-white/[0.08] pt-3">
          {suggestions.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => execute(label)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/80 transition hover:border-violet-500/60 hover:text-white "
            >
              <Icon size={13} className="text-white/60" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[12px] text-white/60">I&apos;ll understand, plan and execute across your entire company.</p>
    </section>
  );
}
