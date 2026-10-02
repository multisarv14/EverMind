"use client";

import { useEffect, useState } from "react";

const question = "We want to launch an AI CRM for small clinics. Where do we start?";
const answer = [
  "Start narrow, then expand.",
  "Assumption: you have no customers yet. Pick one city and one clinic type for the first 90 days.",
  "1. Interview 10 clinic owners about their scheduling pain.",
  "2. Ship a booking and reminders MVP for one clinic type.",
  "3. Charge from day one to validate willingness to pay.",
];
const full = answer.join("\n");

export default function HeroPreview() {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const t = setTimeout(() => setShown(full.length), 0);
      return () => clearTimeout(t);
    }
    let i = 0;
    const start = setTimeout(() => {
      const t = setInterval(() => {
        i += 2;
        setShown(Math.min(i, full.length));
        if (i >= full.length) clearInterval(t);
      }, 22);
    }, 900);
    return () => clearTimeout(start);
  }, []);

  const lines = full.slice(0, shown).split("\n");
  const typing = shown < full.length;

  return (
    <div className="mx-auto mt-14 max-w-[820px] rounded-2xl border border-violet-500/30 bg-[#0a0c1c]/90 p-5 text-left shadow-[0_0_70px_rgba(124,92,255,.28)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between text-[12px] text-white/40">
        <span>Example conversation</span>
        <span className="flex gap-1.5">
          <i className="h-2 w-2 rounded-full bg-rose-400/60" />
          <i className="h-2 w-2 rounded-full bg-amber-400/60" />
          <i className="h-2 w-2 rounded-full bg-emerald-400/60" />
        </span>
      </div>

      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-md bg-violet-600/25 px-4 py-2.5 text-[14px]">{question}</p>
      </div>

      <div className="mt-4 flex gap-3">
        <span className="mt-1 h-7 w-7 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)]" />
        <div className="min-h-[150px] min-w-0 flex-1 text-[14px] leading-relaxed text-white/80">
          {lines.map((line, i) => (
            <p key={i} className={`${i === 0 ? "font-semibold text-white" : ""} ${i > 1 ? "pl-2" : ""} mt-1`}>
              {line}
              {typing && i === lines.length - 1 && (
                <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-violet-300" />
              )}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
