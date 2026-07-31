"use client";

import { useExecutionSession } from "@/context/ExecutionSessionContext";

export interface PerformancePoint {
  label: string;
  value: number;
}

export interface PerformanceStat {
  key: string;
  title: string;
  value: string;
  delta: string;
  deltaClassName: string;
}

const points: readonly PerformancePoint[] = [
  { label: "03 Jul", value: 22 },
  { label: "04 Jul", value: 31 },
  { label: "05 Jul", value: 25 },
  { label: "06 Jul", value: 30 },
  { label: "07 Jul", value: 35 },
  { label: "08 Jul", value: 26 },
  { label: "09 Jul", value: 34 },
];

const stats: readonly PerformanceStat[] = [
  {
    key: "total",
    title: "Total Tasks",
    value: "156",
    delta: "+28 today",
    deltaClassName: "text-emerald-300",
  },
  {
    key: "completed",
    title: "Completed",
    value: "143",
    delta: "+25 today",
    deltaClassName: "text-emerald-300",
  },
  {
    key: "failed",
    title: "Failed",
    value: "13",
    delta: "+3 today",
    deltaClassName: "text-rose-300",
  },
  {
    key: "avg",
    title: "Avg Time",
    value: "2.4s",
    delta: "-0.6s",
    deltaClassName: "text-emerald-300",
  },
];

export default function PerformanceOverview() {
  const { session } = useExecutionSession();

  const maxY = 40;
  const successPercent = 92;
  const totalRuntimeEvents = session.events.length;
  const completedRuntime = session.status === "completed" ? 1 : 0;
  const failedRuntime = session.status === "failed" ? 1 : 0;

  const mergedStats = stats.map((item) => {
    if (item.key === "total") {
      return {
        ...item,
        value: String(Math.max(Number(item.value), totalRuntimeEvents)),
      };
    }

    if (item.key === "completed") {
      return {
        ...item,
        value: String(Math.max(Number(item.value), completedRuntime)),
      };
    }

    if (item.key === "failed") {
      return {
        ...item,
        value: String(Math.max(Number(item.value), failedRuntime)),
      };
    }

    return item;
  });

  return (
    <section className="h-full rounded-xl border border-white/10 bg-[#090f1d] p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-white">Performance Overview</h3>
        <button
          type="button"
          className="text-[13px] font-medium text-violet-300 transition hover:text-violet-200"
        >
          View Analytics →
        </button>
      </div>

      <div className="grid grid-cols-[1.1fr_0.9fr] gap-2.5">
        <article className="rounded-lg border border-white/10 bg-[#08101f] p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-medium text-white/90">Tasks Over Time</p>
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[11px] text-white/60"
            >
              7 Days
            </button>
          </div>

          <div className="h-[136px] rounded-md border border-white/10 bg-[#0a1222] px-2 py-2">
            <div className="grid h-[108px] grid-cols-7 items-end gap-2">
              {points.map((point) => (
                <div key={point.label} className="flex h-full flex-col items-center justify-end gap-1">
                  <div className="relative flex h-full w-full items-end">
                    <div className="w-full rounded-sm bg-gradient-to-t from-violet-500/80 to-fuchsia-400/80" style={{ height: `${(point.value / maxY) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-white/50">{point.label}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-white/10 bg-[#08101f] p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-medium text-white/90">Success Rate</p>
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[11px] text-white/60"
            >
              7 Days
            </button>
          </div>

          <div className="flex items-center justify-center py-3">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/10" style={{ background: `conic-gradient(#22c55e ${successPercent}%, rgba(255,255,255,0.12) ${successPercent}% 100%)` }}>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#08101f] text-[28px] font-semibold text-white">
                {successPercent}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-white/65">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Success 92%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Failed 8%
            </span>
          </div>
        </article>
      </div>

      <div className="mt-2.5 grid grid-cols-4 gap-2">
        {mergedStats.map((item) => (
          <article key={item.key} className="rounded-lg border border-white/10 bg-[#0a1223] px-2.5 py-2">
            <p className="text-[12px] text-white/65">{item.title}</p>
            <p className="mt-0.5 text-[17px] font-semibold text-white">{item.value}</p>
            <p className={`text-[11px] ${item.deltaClassName}`}>{item.delta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
