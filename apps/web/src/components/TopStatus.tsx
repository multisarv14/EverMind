"use client";

import { RefreshCw, AudioLines } from "lucide-react";
import { useApi } from "@/lib/useApi";

interface Status {
  aiConfigured: boolean;
}

export default function TopStatus() {
  const { data } = useApi<Status>("/api/status");

  const system =
    data && !data.aiConfigured
      ? { value: "AI key needed", dot: "bg-amber-400" }
      : { value: "Optimal", dot: "bg-emerald-400" };

  const chips = [
    { label: "System Status", ...system },
    { label: "AI Confidence", value: "High", dot: "bg-violet-400" },
    { label: "Company Memory", value: "Learning", dot: "bg-blue-500" },
    { label: "Active Agents", value: "12", dot: "bg-emerald-400" },
  ];

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center">
      <div />

      <div className="flex gap-3">
        {chips.map((c) => (
          <div
            key={c.label}
            className="flex w-[168px] items-start justify-between rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-2.5"
          >
            <div>
              <p className="whitespace-nowrap text-[12px] text-white/75">{c.label}</p>
              <p className="mt-1 flex items-center gap-2 whitespace-nowrap text-[13px] font-medium text-white">
                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                {c.value}
              </p>
            </div>
            <RefreshCw size={12} className="mt-0.5 text-white/40" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3">
        <div className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_40%_35%,#f0abfc,#7c3aed_55%,#1e1b4b)] shadow-[0_0_18px_rgba(168,85,247,.5)]" />
        <div className="leading-tight">
          <p className="text-[13px] font-semibold text-white">EverMind</p>
          <p className="text-[12px] text-white/55">AI Executive</p>
        </div>
        <AudioLines size={26} className="ml-2 text-violet-400" />
      </div>
    </header>
  );
}
