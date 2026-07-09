"use client";

import {
  BarChart3,
  Brain,
  Briefcase,
  Cpu,
  DollarSign,
  Gavel,
  Megaphone,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useExecutionSession } from "@/context/ExecutionSessionContext";

const agents = [
  { icon: Brain, title: "Chief Agent", color: "text-violet-300" },
  { icon: DollarSign, title: "Business Agent", color: "text-amber-300" },
  { icon: Search, title: "Research Agent", color: "text-emerald-300" },
  { icon: Cpu, title: "Technical Agent", color: "text-cyan-300" },
  { icon: Briefcase, title: "Documentation Agent", color: "text-sky-300" },
  { icon: ShieldCheck, title: "Testing Agent", color: "text-lime-300" },
  { icon: Users, title: "HR Agent", color: "text-pink-300" },
  { icon: Gavel, title: "Legal Agent", color: "text-orange-300" },
  { icon: Megaphone, title: "Marketing Agent", color: "text-fuchsia-300" },
  { icon: BarChart3, title: "Sales Agent", color: "text-blue-300" },
];

export default function AIPanel() {
  const { session } = useExecutionSession();

  const latest =
    session.events.length > 0
      ? session.events[0]
      : undefined;

  return (
    <aside className="w-[260px] border-l border-white/10 bg-[#0a0d17] p-5">

      <h2 className="text-xl font-semibold">AI Runtime</h2>

      <div className="mt-5 rounded-xl border border-violet-500/20 bg-white/5 p-4">
        <div className="text-xs uppercase text-white/40">
          Current Stage
        </div>

        <div className="mt-2 text-lg font-semibold text-violet-300">
          {session.currentStage}
        </div>

        <div className="mt-4 text-xs uppercase text-white/40">
          Latest Event
        </div>

        <div className="mt-2 text-sm text-white/80">
          {latest?.title ?? "Waiting..."}
        </div>

        <div className="mt-4 text-xs uppercase text-white/40">
          Response
        </div>

        <div className="mt-2 text-sm text-white/70">
          {session.response || "..."}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">

        {agents.map(({ icon: Icon, title, color }) => {
          const active = title === (session.selectedAgent || "Chief Agent");

          return (
            <div
              key={title}
              className={`rounded-xl border p-2 ${
                active
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <Icon className={color} size={18} />

              <div className="mt-2 text-xs font-medium">
                {title}
              </div>

              <div
                className={`mt-1 text-[11px] ${
                  active
                    ? "text-violet-300"
                    : "text-white/40"
                }`}
              >
                {active ? "ACTIVE" : "IDLE"}
              </div>
            </div>
          );
        })}

      </div>

    </aside>
  );
}
