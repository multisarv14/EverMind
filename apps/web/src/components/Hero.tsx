"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Command,
  Search,
  Sparkles,
} from "lucide-react";
import { useKernel } from "@/hooks/useKernel";

export interface HeroQuickAction {
  key: string;
  label: string;
  value: string;
}

export interface HeroCopy {
  greeting: string;
  subtitle: string;
  placeholder: string;
  executeLabel: string;
}

export const defaultHeroCopy: HeroCopy = {
  greeting: "Good Morning, Ramdas",
  subtitle: "EverMind is online and ready to execute.",
  placeholder: "Give me an objective or ask anything...",
  executeLabel: "Execute",
};

export const defaultHeroQuickActions: readonly HeroQuickAction[] = [
  {
    key: "launch-saas",
    label: "Launch a SaaS product",
    value: "Launch a SaaS product",
  },
  {
    key: "analyze-trends",
    label: "Analyze market trends",
    value: "Analyze market trends",
  },
  {
    key: "create-strategy",
    label: "Create business strategy",
    value: "Create business strategy",
  },
  {
    key: "prepare-pitch",
    label: "Prepare pitch deck",
    value: "Prepare pitch deck",
  },
  {
    key: "research-competitors",
    label: "Research competitors",
    value: "Research competitors",
  },
];

interface HeroProps {
  copy?: HeroCopy;
  quickActions?: readonly HeroQuickAction[];
}

export default function Hero({
  copy = defaultHeroCopy,
  quickActions = defaultHeroQuickActions,
}: HeroProps) {
  const [message, setMessage] = useState("");
  const { loading, run } = useKernel();

  async function execute(promptText?: string) {
    const prompt = (promptText ?? message).trim();

    if (!prompt || loading) return;

    try {
      const result = await run(prompt);

      console.log("Kernel Response:", result);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <section className="mt-1">
      <h2 className="text-[24px] font-semibold text-white">
        {copy.greeting} <span className="text-[20px]">👋</span>
      </h2>

      <p className="mt-1 text-[14px] leading-5 text-white/65">
        {copy.subtitle}
      </p>

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void execute();
        }}
      >
        <div className="flex h-[52px] items-center gap-3 rounded-xl border border-violet-400/25 bg-[#090f1f] px-4 shadow-[0_0_20px_rgba(113,72,255,0.2)]">
          <Search size={16} className="text-white/45" />

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={copy.placeholder}
            className="h-full w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/35"
          />

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-[12px] text-white/55">
            <Command size={13} className="text-white/45" />
            <span>+ ↵</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-9 min-w-[96px] items-center justify-center rounded-[10px] bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 text-[13px] font-medium text-white transition hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50"
            title={copy.executeLabel}
          >
            {loading ? "Running..." : copy.executeLabel}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {quickActions.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMessage(item.value)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[12px] text-white/65 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white"
            >
              <Sparkles size={14} className="text-white/45" />
              <span>{item.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              if (message.trim().length > 0) {
                void execute();
              }
            }}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[12px] text-violet-300 transition hover:bg-violet-500/10"
          >
            <span>Run</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </form>
    </section>
  );
}
