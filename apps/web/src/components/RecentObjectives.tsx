"use client";

import { useExecutionSession } from "@/context/ExecutionSessionContext";

export type ObjectiveStatus = "in-progress" | "completed" | "pending";

export interface ObjectiveItem {
  key: string;
  title: string;
  status: ObjectiveStatus;
  updatedAgo: string;
}

export const defaultObjectiveItems: readonly ObjectiveItem[] = [
  {
    key: "obj-1",
    title: "Analyze AI in Real Estate CRM market",
    status: "in-progress",
    updatedAgo: "2 min ago",
  },
  {
    key: "obj-2",
    title: "Create marketing strategy for SaaS product",
    status: "completed",
    updatedAgo: "1 hour ago",
  },
  {
    key: "obj-3",
    title: "Prepare investor pitch deck",
    status: "completed",
    updatedAgo: "3 hours ago",
  },
  {
    key: "obj-4",
    title: "Research latest AI trends 2026",
    status: "completed",
    updatedAgo: "5 hours ago",
  },
  {
    key: "obj-5",
    title: "Build technical architecture for platform",
    status: "pending",
    updatedAgo: "1 day ago",
  },
];

interface RecentObjectivesProps {
  items?: readonly ObjectiveItem[];
}

export default function RecentObjectives({
  items = defaultObjectiveItems,
}: RecentObjectivesProps) {
  const { session } = useExecutionSession();

  const runtimeStatus: ObjectiveStatus =
    session.status === "running"
      ? "in-progress"
      : session.status === "completed"
      ? "completed"
      : "pending";

  const runtimeObjective =
    session.objective.trim().length > 0
      ? {
          key: "runtime-objective",
          title: session.objective,
          status: runtimeStatus,
          updatedAgo: "Just now",
        }
      : null;

  const mergedItems = runtimeObjective
    ? [runtimeObjective, ...items.filter((item) => item.title !== runtimeObjective.title)]
    : [...items];

  const getStatusClassName = (status: ObjectiveStatus): string => {
    if (status === "in-progress") {
      return "bg-emerald-500/15 text-emerald-300";
    }

    if (status === "completed") {
      return "bg-emerald-500/10 text-emerald-300";
    }

    return "bg-amber-500/15 text-amber-300";
  };

  const getStatusLabel = (status: ObjectiveStatus): string => {
    if (status === "in-progress") {
      return "In Progress";
    }

    if (status === "completed") {
      return "Completed";
    }

    return "Pending";
  };

  return (
    <section className="h-full rounded-xl border border-white/10 bg-[#090f1d] p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-white">Recent Objectives</h3>
        <button
          type="button"
          className="text-[13px] font-medium text-violet-300 transition hover:text-violet-200"
        >
          View All →
        </button>
      </div>

      <div className="divide-y divide-white/10 rounded-lg border border-white/10 bg-[#08101f]">
        {mergedItems.map((item) => (
          <article
            key={item.key}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] text-white/85">{item.title}</p>
            </div>

            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClassName(item.status)}`}>
              {getStatusLabel(item.status)}
            </span>

            <span className="text-[12px] text-white/50">{item.updatedAgo}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
