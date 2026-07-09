"use client";

import { Activity, Bot, Brain, Clock } from "lucide-react";
import { useExecutionSession } from "@/context/ExecutionSessionContext";

export default function TopStatus() {
  const { session } = useExecutionSession();

  const eventCount = session.events.length;

  const cards = [
    {
      title: "Runtime",
      value: session.status.toUpperCase(),
      icon: Activity,
    },
    {
      title: "Stage",
      value: session.currentStage,
      icon: Brain,
    },
    {
      title: "Events",
      value: String(eventCount),
      icon: Clock,
    },
    {
      title: "Agent",
      value: session.selectedAgent || "Chief Agent",
      icon: Bot,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(({ title, value, icon: Icon }) => (
        <div
          key={title}
          className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase text-white/45">
                {title}
              </div>

              <div className="mt-2 text-sm font-semibold text-white">
                {value}
              </div>
            </div>

            <Icon size={18} className="text-violet-300" />
          </div>
        </div>
      ))}
    </div>
  );
}
