"use client";

import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useKernel } from "@/hooks/useKernel";

const suggestions = [
  "Launch a SaaS product",
  "Research competitors",
  "Prepare investor pitch",
  "Plan marketing campaign",
  "Create project roadmap",
  "Analyze business risks",
];

export default function Hero() {
  const [message, setMessage] = useState("");
  const { loading, run } = useKernel();

  async function executePrompt(rawPrompt: string) {
    const prompt = rawPrompt.trim();
    if (!prompt || loading) return;

    await run(prompt);
    setMessage("");
  }

  async function execute() {
    await executePrompt(message);
  }

  async function executeGreetingAction(action: string) {
    setMessage(action);
    await executePrompt(action);
  }

  return (
    <section className="mt-2">

      <div className="mb-4 flex items-center gap-2 text-violet-300">
        <Sparkles size={18} />
        <span className="text-sm font-medium">
          AI Executive Command Center
        </span>
      </div>

      <h1 className="bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-5xl font-bold text-transparent">
        EverMind
      </h1>

      <p className="mt-3 max-w-3xl text-white/60">
        Give me an objective. I will understand it, think,
        research, plan, decide, execute and remember.
      </p>

      <div className="mt-6 rounded-3xl border border-violet-500/20 bg-[#0b0f1c] p-6">

        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your objective..."
          className="w-full resize-none bg-transparent text-lg text-white outline-none placeholder:text-white/30"
        />

        <div className="mt-5 flex flex-wrap gap-2">
          {suggestions.map((item) => (
            <button
              key={item}
              onClick={() => executeGreetingAction(item)}
              disabled={loading}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:border-violet-500 hover:text-white"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            disabled={loading}
            onClick={execute}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-white hover:bg-violet-500 disabled:opacity-50"
          >
            Execute
            <ArrowRight size={18} />
          </button>
        </div>

      </div>

    </section>
  );
}
