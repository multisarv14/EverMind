"use client";

import { Activity, Bot, Brain, Sparkles } from "lucide-react";
import { useExecutionSession } from "@/context/ExecutionSessionContext";

export default function TopStatus() {
  const { session } = useExecutionSession();

  const cards = [
    {
      title: "Runtime Status",
      value: session.status.toUpperCase(),
      dot:
        session.status === "completed"
          ? "bg-emerald-400"
          : session.status === "failed"
          ? "bg-red-400"
          : session.status === "running"
          ? "bg-yellow-400"
          : "bg-slate-400",
      Icon: Activity,
    },
    {
      title: "Current Stage",
      value: session.currentStage,
      dot: "bg-violet-400",
      Icon: Sparkles,
    },
    {
      title: "Objective",
      value: session.objective || "Waiting...",
      dot: "bg-sky-400",
      Icon: Brain,
    },
    {
      title: "Active Agent",
      value: session.selectedAgent || "Chief Agent",
      dot: "bg-emerald-400",
      Icon: Bot,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(({ title, value, dot, Icon }) => (
        <div
          key={title}
          className="rounded-xl border border-white/8 bg-white/[0.04] backdrop-blur-2xl px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-white/45">
                {title}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dot}`} />

                <span className="truncate text-sm font-medium text-white">
                  {value}
                </span>
              </div>
            </div>

            <Icon size={18} className="text-white/35" />
          </div>
        </div>
      ))}
    </div>
  );
}
