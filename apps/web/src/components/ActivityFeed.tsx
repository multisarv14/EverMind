"use client";

import { useExecutionSession } from "@/context/ExecutionSessionContext";

export default function ActivityFeed() {
  const { session } = useExecutionSession();
  const events = session.events;

  const items =
    events.length > 0
      ? events
      : [
          {
            id: "idle",
            title: session.objective || "No active execution",
            description: session.response || "Waiting for an objective...",
            createdAt: new Date(),
          },
        ];

  return (
    <section className="ev-card h-full p-5">

      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-white">
          EverMind Activity Feed
        </h3>

        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-300">
          {session.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-4">

        {items.map((item) => (

          <div key={item.id} className="flex gap-3">

            <div className="mt-2 h-2.5 w-2.5 rounded-full bg-violet-400" />

            <div>

              <div className="text-[15px] font-medium text-white">
                {item.title}
              </div>

              {item.description && (
                <div className="mt-1 text-[13px] text-white/45">
                  {item.description}
                </div>
              )}

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}
