"use client";

import { useState } from "react";
import { useKernel } from "@/hooks/useKernel";

export default function Hero() {
  const [message, setMessage] = useState("");
  const { loading, run } = useKernel();

  async function executePrompt(rawPrompt: string) {
    const prompt = rawPrompt.trim();

    if (!prompt || loading) return;

    try {
      const result = await run(prompt);

      console.log("Kernel Response:", result);
    } catch (err) {
      console.error(err);
    }
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

      <h2 className="text-[28px] font-semibold text-white">
        Good evening, CEO 👋
      </h2>

      <h1 className="mt-1 bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-[46px] font-bold leading-none text-transparent">
        I&apos;m EverMind.
      </h1>

      <p className="mt-2 text-[15px] leading-6 text-white/60">
        I run your company. I plan, decide, execute and deliver.
      </p>

      <div className="mt-4 rounded-[24px] border border-violet-500/30 bg-[#0b0f1c] p-5 shadow-[0_0_60px_rgba(108,92,255,.18)]">

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Tell EverMind your objective..."
          className="w-full resize-none bg-transparent text-lg text-white outline-none placeholder:text-white/25"
        />

        <div className="mt-4 flex items-center justify-between gap-4">

          <div className="flex flex-wrap gap-2">

            {[
              "Plan something",
              "Solve a problem",
              "Make a decision",
              "Analyze this",
              "Research",
              "Create anything",
            ].map((item) => (
              <button
                key={item}
                onClick={() => executeGreetingAction(item)}
                disabled={loading}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70 transition hover:border-violet-400/30 hover:bg-violet-500/10"
              >
                {item}
              </button>
            ))}

          </div>

          <button
            onClick={execute}
            disabled={loading}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-50"
            title="Execute"
          >
            ➜
          </button>

        </div>

      </div>

    </section>
  );
}
