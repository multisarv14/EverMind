"use client";

import { useExecutionSession } from "@/context/ExecutionSessionContext";

export default function ActivityFeed() {
  const { session } = useExecutionSession();

  return (
    <section className="ev-card h-full p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-white">
          Runtime Timeline
        </h3>

        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-300">
          {session.currentStage}
        </span>
      </div>

      <div className="space-y-4">

        {session.events.length === 0 ? (
          <div className="text-sm text-white/40">
            Waiting for execution...
          </div>
        ) : (
          session.events.map((event) => (
            <div
              key={event.id}
              className="flex gap-3 border-l border-violet-500/30 pl-4"
            >
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-violet-400" />

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">
                    {event.title}
                  </h4>

                  <span className="text-[11px] text-white/30">
                    {event.createdAt.toLocaleTimeString()}
                  </span>
                </div>

                {event.description && (
                  <p className="mt-1 text-sm text-white/55">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          ))
        )}

      </div>
    </section>
  );
}
