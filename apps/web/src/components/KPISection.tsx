"use client";

import {
  Brain,
  Activity,
  Database,
  CheckCircle,
  Cpu,
  Workflow,
  Timer,
} from "lucide-react";

import { useExecutionSession } from "@/context/ExecutionSessionContext";

export default function KPISection() {
  const { session } = useExecutionSession();

  const cards = [
    {
      icon: Activity,
      title: "Runtime Events",
      value: session.events.length,
      color: "text-violet-300",
    },
    {
      icon: Brain,
      title: "Current Stage",
      value: session.currentStage,
      color: "text-cyan-300",
    },
    {
      icon: Cpu,
      title: "Active Agent",
      value: session.selectedAgent || "Chief Agent",
      color: "text-emerald-300",
    },
    {
      icon: Database,
      title: "Memory",
      value: "Ready",
      color: "text-pink-300",
    },
    {
      icon: Workflow,
      title: "Pipeline",
      value: session.status.toUpperCase(),
      color: "text-amber-300",
    },
    {
      icon: CheckCircle,
      title: "Response",
      value: session.response ? "Available" : "Pending",
      color: "text-lime-300",
    },
    {
      icon: Timer,
      title: "Execution",
      value: session.status === "running" ? "Running" : "Idle",
      color: "text-sky-300",
    },
  ];

  return (
    <section className="mt-3">
      <div className="grid grid-cols-7 gap-3">
        {cards.map(({ icon: Icon, title, value, color }) => (
          <div
            key={title}
            className="ev-card flex h-[118px] flex-col justify-between p-3"
          >
            <div className="flex items-center justify-between">
              <Icon size={18} className={color} />
              <span className="text-sm font-semibold text-white text-right">
                {value}
              </span>
            </div>

            <div className="text-sm font-medium text-white/80">
              {title}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
