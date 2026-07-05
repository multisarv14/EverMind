"use client";

export default function Hero() {
  return (
    <section className="mt-2">

      <h2 className="text-[28px] font-semibold tracking-tight text-white">
        Good evening, CEO 👋
      </h2>

      <h1 className="mt-1 text-[46px] font-bold leading-none bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
        I'm EverMind.
      </h1>

      <p className="mt-2 text-[15px] leading-6 text-white/60">
        I run your company. I plan, decide, execute and deliver.
        <br />
        You focus on the vision. I handle everything else.
      </p>

      <div className="mt-4 rounded-[24px] border border-violet-500/30 bg-[#0b0f1c] px-6 py-4 shadow-[0_0_60px_rgba(108,92,255,.18)]">

        <div className="text-[11px] uppercase tracking-[0.35em] text-white/35">
          What would you like to accomplish?
        </div>

        <textarea
          rows={1}
          placeholder="Tell me anything..."
          className="mt-3 h-10 w-full resize-none overflow-hidden bg-transparent text-[18px] text-white placeholder:text-white/25 outline-none border-none"
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "0px";
            el.style.height = `${el.scrollHeight}px`;
          }}
        />

        <div className="mt-3 flex flex-wrap gap-2">

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
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70 transition hover:border-violet-400/30 hover:bg-violet-500/10"
            >
              {item}
            </button>
          ))}

        </div>

      </div>

    </section>
  );
}
