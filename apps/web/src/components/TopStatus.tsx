"use client";

import { useApi } from "@/lib/useApi";

/** One quiet status line instead of a row of chips. */
export default function TopStatus() {
  const { data } = useApi<{ aiConfigured: boolean }>("/api/status");

  const state = !data
    ? null
    : data.aiConfigured
      ? { label: "EverMind is online", dot: "bg-emerald-400" }
      : { label: "AI key needed", dot: "bg-amber-400" };

  return (
    <div className="flex h-8 items-center justify-end">
      {state && (
        <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[12px] text-white/70">
          <span className={`h-1.5 w-1.5 rounded-full ${state.dot}`} />
          {state.label}
        </span>
      )}
    </div>
  );
}
