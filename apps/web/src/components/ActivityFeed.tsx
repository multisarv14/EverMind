"use client";

import { useExecutionSession } from "@/context/ExecutionSessionContext";

const stages = [
  "Understanding",
  "Thinking",
  "Knowledge",
  "Planning",
  "Decision",
  "Agent",
  "Memory",
  "Completed",
];

export default function ActivityFeed() {
  const { session } = useExecutionSession();

  const completed = new Set(
    session.events.map((e) => e.title)
  );

  return (
    <section className="ev-card h-full overflow-y-auto p-5">

      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-white">
          Runtime Timeline
        </h3>

        <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-300">
          {session.currentStage}
        </span>
      </div>

      <div className="space-y-5">

        {stages.map((stage) => {
          const active = session.currentStage === stage;
          const done = completed.has(stage);

          return (
            <div
              key={stage}
              className="flex items-start gap-4"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`h-3 w-3 rounded-full ${
                    active
                      ? "bg-violet-400 ring-4 ring-violet-500/20"
                      : done
                      ? "bg-emerald-400"
                      : "bg-slate-600"
                  }`}
                />

                {stage !== "Completed" && (
                  <div className="h-10 w-px bg-white/10" />
                )}
              </div>

              <div className="flex-1">
                <div
                  className={`font-medium ${
                    active
                      ? "text-violet-300"
                      : done
                      ? "text-white"
                      : "text-white/40"
                  }`}
                >
                  {stage}
                </div>

                {active && (
                  <div className="mt-1 text-sm text-white/60">
                    Executing...
                  </div>
                )}
              </div>
            </div>
          );
        })}

      </div>
    </section>
  );
}
