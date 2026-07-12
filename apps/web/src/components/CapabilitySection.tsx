"use client";

import {
  Brain,
  CirclePlay,
  ClipboardList,
  Lightbulb,
  MessageSquareText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useExecutionSession } from "@/context/ExecutionSessionContext";

export interface RuntimeStage {
  key: "understanding" | "thinking" | "planning" | "execution" | "response";
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accentClassName: string;
  accentGlowClassName: string;
}

export interface CurrentExecution {
  objective: string;
  agent: string;
  startedAgo: string;
  status: "in-progress" | "completed" | "queued" | "failed";
}

export const defaultRuntimeStages: readonly RuntimeStage[] = [
  {
    key: "understanding",
    title: "Understanding",
    subtitle: "Analyzing intent",
    icon: Brain,
    accentClassName: "text-violet-300 border-violet-400/30",
    accentGlowClassName: "shadow-[0_0_26px_rgba(132,84,255,.45)]",
  },
  {
    key: "thinking",
    title: "Thinking",
    subtitle: "Reasoning",
    icon: Lightbulb,
    accentClassName: "text-blue-300 border-blue-400/30",
    accentGlowClassName: "shadow-[0_0_24px_rgba(60,147,255,.42)]",
  },
  {
    key: "planning",
    title: "Planning",
    subtitle: "Creating plan",
    icon: ClipboardList,
    accentClassName: "text-cyan-300 border-cyan-400/30",
    accentGlowClassName: "shadow-[0_0_24px_rgba(40,210,220,.42)]",
  },
  {
    key: "execution",
    title: "Execution",
    subtitle: "Executing",
    icon: CirclePlay,
    accentClassName: "text-emerald-300 border-emerald-400/30",
    accentGlowClassName: "shadow-[0_0_24px_rgba(36,201,126,.42)]",
  },
  {
    key: "response",
    title: "Response",
    subtitle: "Generating",
    icon: MessageSquareText,
    accentClassName: "text-amber-300 border-amber-400/30",
    accentGlowClassName: "shadow-[0_0_24px_rgba(241,171,71,.42)]",
  },
];

export const defaultCurrentExecution: CurrentExecution = {
  objective: "Analyze AI in Real Estate CRM market",
  agent: "Research Agent",
  startedAgo: "2 min ago",
  status: "in-progress",
};

interface CapabilitySectionProps {
  stages?: readonly RuntimeStage[];
  currentExecution?: CurrentExecution;
}

export default function CapabilitySection({
  stages = defaultRuntimeStages,
  currentExecution = defaultCurrentExecution,
}: CapabilitySectionProps) {
  const { session } = useExecutionSession();

  const mappedStatus: CurrentExecution["status"] =
    session.status === "running"
      ? "in-progress"
      : session.status === "completed"
      ? "completed"
      : session.status === "failed"
      ? "failed"
      : "queued";

  const activeExecution: CurrentExecution = {
    ...currentExecution,
    objective: session.objective || currentExecution.objective,
    status: session.objective ? mappedStatus : currentExecution.status,
    startedAgo: session.objective ? "Just now" : currentExecution.startedAgo,
  };

  const statusLabel =
    activeExecution.status === "in-progress"
      ? "In Progress"
      : activeExecution.status === "completed"
      ? "Completed"
      : activeExecution.status === "queued"
      ? "Queued"
      : "Failed";

  const statusClassName =
    activeExecution.status === "in-progress"
      ? "text-emerald-300"
      : activeExecution.status === "completed"
      ? "text-cyan-300"
      : activeExecution.status === "queued"
      ? "text-amber-300"
      : "text-rose-300";

  return (
    <section className="h-full rounded-xl border border-white/10 bg-[#090f1d] p-3">

      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-white">
          AI Runtime Pipeline
        </h3>

        <button
          type="button"
          className="text-[13px] font-medium text-violet-300 transition hover:text-violet-200"
        >
          View Full Pipeline →
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#070d1a] px-3 py-4">

        <div className="relative grid grid-cols-5 gap-2">

          <div className="pointer-events-none absolute left-[10%] right-[10%] top-[23px] h-px bg-gradient-to-r from-violet-500/60 via-cyan-400/50 to-emerald-400/55" />

          {stages.map(({ key, icon: Icon, title, subtitle, accentClassName, accentGlowClassName }) => (

            <article key={key} className="relative z-10 flex flex-col items-start">

              <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full border bg-[#0b1324] ${accentClassName} ${accentGlowClassName}`}>
                <Icon size={16} />
              </div>

              <h4 className="text-[12px] font-semibold text-white">
                {title}
              </h4>

              <p className="mt-1 text-[11px] text-white/55">
                {subtitle}
              </p>

            </article>

          ))}

        </div>

      </div>

      <div className="mt-2.5 rounded-xl border border-white/10 bg-[#0a1223] p-3">
        <div className="mb-2 text-[14px] font-medium text-violet-300">
          Current Execution
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
              <p className="truncate text-[13px] text-white">
                Objective: {activeExecution.objective}
              </p>
            </div>

            <div className="mt-1.5 flex items-center gap-4 text-[12px] text-white/70">
              <p>Agent: {activeExecution.agent}</p>
              <p>Started: {activeExecution.startedAgo}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[12px] font-medium ${statusClassName}`}>
              {statusLabel}
            </span>

            <button
              type="button"
              className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/85 transition hover:bg-white/[0.06]"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

    </section>
  );
}
