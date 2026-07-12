"use client";

import {
  Bell,
  Bot,
  CircleDot,
  Cpu,
  FolderOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TopStatusMetric {
  key: "system-status" | "active-agent" | "runtime-stage" | "events-today" | "memory-usage";
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  accentClassName: string;
}

export const defaultTopStatusMetrics: readonly TopStatusMetric[] = [
  {
    key: "system-status",
    title: "System Status",
    value: "Online",
    icon: CircleDot,
    accentClassName: "text-emerald-400",
  },
  {
    key: "active-agent",
    title: "Active Agent",
    value: "Chief Agent",
    icon: Bot,
    accentClassName: "text-violet-300",
  },
  {
    key: "runtime-stage",
    title: "Runtime Stage",
    value: "Idle",
    icon: FolderOpen,
    accentClassName: "text-white/70",
  },
  {
    key: "events-today",
    title: "Events Today",
    value: "24",
    icon: Bell,
    accentClassName: "text-white/70",
  },
  {
    key: "memory-usage",
    title: "Memory Usage",
    value: "28%",
    subValue: "",
    icon: Cpu,
    accentClassName: "text-violet-300",
  },
];

interface TopStatusProps {
  metrics?: readonly TopStatusMetric[];
}

export default function TopStatus({
  metrics = defaultTopStatusMetrics,
}: TopStatusProps) {
  return (
    <section className="h-[56px] shrink-0">

      <div className="grid h-[56px] grid-cols-5 gap-3">
        {metrics.map(({ key, title, value, subValue, icon: Icon, accentClassName }) => (
          <article
            key={key}
            className="flex h-[56px] min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-[#0a1020] px-2.5"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.02]">
              <Icon size={12} className={accentClassName} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[9px] font-medium uppercase tracking-[0.08em] text-white/45">
                {title}
              </p>

              <p className="truncate text-[12px] font-medium leading-4 text-white">
                {value}
              </p>

              {typeof subValue === "string" && subValue.length > 0 && (
                <p className="truncate text-[10px] text-white/45">{subValue}</p>
              )}
            </div>
          </article>
        ))}
      </div>

    </section>
  );
}
