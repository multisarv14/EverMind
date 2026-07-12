import {
  Activity,
  CheckCircle2,
  FolderOpen,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface KPIItem {
  key: "objectives" | "projects" | "tasks-executed" | "success-rate" | "avg-response";
  title: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  accentClassName: string;
  cardClassName: string;
  chartPath: string;
}

export const defaultKPIItems: readonly KPIItem[] = [
  {
    key: "objectives",
    title: "Objectives",
    value: "12",
    delta: "+3 today",
    icon: Target,
    accentClassName: "text-violet-300",
    cardClassName: "border-violet-500/25 bg-[linear-gradient(145deg,rgba(123,52,255,.17),rgba(19,14,38,.9))]",
    chartPath: "M5 26 L19 26 L26 14 L36 19 L47 17 L59 14",
  },
  {
    key: "projects",
    title: "Projects",
    value: "8",
    delta: "+2 active",
    icon: FolderOpen,
    accentClassName: "text-blue-300",
    cardClassName: "border-blue-500/25 bg-[linear-gradient(145deg,rgba(45,126,255,.16),rgba(13,22,41,.9))]",
    chartPath: "M5 26 L17 26 L24 15 L33 19 L44 18 L59 14",
  },
  {
    key: "tasks-executed",
    title: "Tasks Executed",
    value: "156",
    delta: "+28 today",
    icon: CheckCircle2,
    accentClassName: "text-emerald-300",
    cardClassName: "border-emerald-500/25 bg-[linear-gradient(145deg,rgba(17,171,101,.17),rgba(11,33,27,.9))]",
    chartPath: "M5 26 L16 26 L22 13 L32 20 L41 17 L59 13",
  },
  {
    key: "success-rate",
    title: "Success Rate",
    value: "92%",
    delta: "+2.5%",
    icon: TrendingUp,
    accentClassName: "text-amber-300",
    cardClassName: "border-amber-500/25 bg-[linear-gradient(145deg,rgba(184,114,12,.17),rgba(36,23,9,.9))]",
    chartPath: "M5 26 L18 26 L24 15 L36 19 L47 16 L59 14",
  },
  {
    key: "avg-response",
    title: "Avg Response",
    value: "2.4s",
    delta: "-0.6s",
    icon: Activity,
    accentClassName: "text-cyan-300",
    cardClassName: "border-cyan-500/25 bg-[linear-gradient(145deg,rgba(8,148,178,.16),rgba(8,24,30,.9))]",
    chartPath: "M5 26 L19 26 L26 14 L36 20 L46 18 L59 14",
  },
];

interface KPISectionProps {
  items?: readonly KPIItem[];
}

export default function KPISection({
  items = defaultKPIItems,
}: KPISectionProps) {
  return (
    <section className="mt-3">
      <div className="grid grid-cols-5 gap-3">

        {items.map(({ key, icon: Icon, title, value, delta, accentClassName, cardClassName, chartPath }) => (

          <div
            key={key}
            className={`flex h-[104px] flex-col justify-between rounded-xl border p-2.5 ${cardClassName}`}
          >

            <div className="flex items-center justify-between">

              <div>
                <div className={`text-[12px] font-medium ${accentClassName}`}>
                  {title}
                </div>

                <div className="mt-1 text-[16px] font-semibold leading-5 text-white">
                  {value}
                </div>

                <div className="mt-1 text-[10px] text-white/70">
                  {delta}
                </div>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/20">
                <Icon size={14} className={accentClassName} />
              </div>

            </div>

            <svg
              viewBox="0 0 64 30"
              className="h-[18px] w-[54px] self-end"
              fill="none"
              aria-hidden="true"
            >
              <path
                d={chartPath}
                stroke="currentColor"
                strokeWidth="1.8"
                className={accentClassName}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

          </div>

        ))}

      </div>
    </section>
  );
}
