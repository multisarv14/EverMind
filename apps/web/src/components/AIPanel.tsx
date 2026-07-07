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
  { icon: Brain, title: "Strategy Agent", color: "text-sky-300" },
  { icon: DollarSign, title: "Finance Agent", color: "text-amber-300" },
  { icon: Search, title: "Research Agent", color: "text-emerald-300" },
  { icon: Users, title: "HR Agent", color: "text-pink-300" },
  { icon: Briefcase, title: "Product Agent", color: "text-violet-300" },
  { icon: Gavel, title: "Legal Agent", color: "text-orange-300" },
  { icon: Cpu, title: "Engineering", color: "text-cyan-300" },
  { icon: Megaphone, title: "Marketing", color: "text-fuchsia-300" },
  { icon: ShieldCheck, title: "QA Agent", color: "text-lime-300" },
  { icon: BarChart3, title: "Sales Agent", color: "text-blue-300" },
];

export default function AIPanel() {
  const { session } = useExecutionSession();

  return (
    <aside className="w-[260px] border-l border-white/10 bg-[#0a0d17] p-5">

      <div className="mb-6">
        <h2 className="text-xl font-semibold">My AI Team</h2>

        <p className="text-sm text-white/45">
          {session.selectedAgent || "Chief Agent"} • {session.currentStage}
        </p>

        <div className="mt-4 rounded-lg border border-violet-500/20 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wider text-white/40">
            Last Response
          </div>

          <div className="mt-2 text-sm text-white/80">
            {session.response || "Waiting for execution..."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {agents.map(({ icon: Icon, title, color }) => {
          const active =
            title === (session.selectedAgent || "Chief Agent");

          return (
            <div
              key={title}
              className={`rounded-xl border p-2 ${
                active
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <Icon className={color} size={20} />

              <div className="mt-3 text-sm font-medium">
                {title}
              </div>

              <div
                className={`mt-2 flex items-center gap-1 text-xs ${
                  active
                    ? "text-violet-300"
                    : "text-white/40"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    active
                      ? "bg-violet-400"
                      : "bg-slate-500"
                  }`}
                />

                {active ? "Active" : "Idle"}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
