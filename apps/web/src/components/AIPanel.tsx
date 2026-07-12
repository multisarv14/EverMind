"use client";

import {
  Activity,
  Bell,
  CircleUserRound,
  Database,
  Gauge,
  HardDrive,
  Server,
  Sparkles,
  Sun,
  Workflow,
  CheckCircle2,
  ArrowRight,
  MoonStar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUIState } from "@/context/UIStateContext";

interface RuntimeEvent {
  key: string;
  time: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  colorClassName: string;
}

interface HealthMetric {
  key: string;
  label: string;
  value: string;
  progress?: number;
  progressClassName?: string;
  icon: LucideIcon;
  status?: "ok" | "warn";
}

const runtimeEvents: readonly RuntimeEvent[] = [
  {
    key: "chief",
    time: "10:24:35",
    title: "Chief Agent",
    detail: "Delegated task to Research Agent",
    icon: Sparkles,
    colorClassName: "from-violet-500 to-fuchsia-500",
  },
  {
    key: "research",
    time: "10:24:31",
    title: "Research Agent",
    detail: "Researching AI CRM competitors",
    icon: Activity,
    colorClassName: "from-emerald-500 to-green-500",
  },
  {
    key: "memory",
    time: "10:24:15",
    title: "Memory Engine",
    detail: "Stored 3 new memories",
    icon: Database,
    colorClassName: "from-sky-500 to-cyan-500",
  },
  {
    key: "planning",
    time: "10:24:10",
    title: "Planning Engine",
    detail: "Execution plan created",
    icon: Workflow,
    colorClassName: "from-cyan-500 to-teal-500",
  },
  {
    key: "understanding",
    time: "10:23:58",
    title: "Understanding Engine",
    detail: "Intent understood",
    icon: Sparkles,
    colorClassName: "from-violet-500 to-indigo-500",
  },
  {
    key: "user",
    time: "10:23:42",
    title: "User",
    detail: "New objective received",
    icon: CircleUserRound,
    colorClassName: "from-indigo-500 to-violet-500",
  },
];

const healthMetrics: readonly HealthMetric[] = [
  {
    key: "cpu",
    label: "CPU Usage",
    value: "32%",
    progress: 32,
    progressClassName: "bg-gradient-to-r from-violet-600 to-fuchsia-500",
    icon: Gauge,
  },
  {
    key: "memory",
    label: "Memory Usage",
    value: "28%",
    progress: 28,
    progressClassName: "bg-gradient-to-r from-cyan-500 to-sky-400",
    icon: Server,
  },
  {
    key: "storage",
    label: "Storage Usage",
    value: "45%",
    progress: 45,
    progressClassName: "bg-gradient-to-r from-amber-400 to-orange-400",
    icon: HardDrive,
  },
  {
    key: "api",
    label: "API Status",
    value: "All Systems Operational",
    icon: CheckCircle2,
    status: "ok",
  },
  {
    key: "database",
    label: "Database",
    value: "Connected",
    icon: Database,
    status: "ok",
  },
  {
    key: "services",
    label: "AI Services",
    value: "Operational",
    icon: Sparkles,
    status: "ok",
  },
];

export default function AIPanel() {
  const {
    theme,
    toggleTheme,
    notificationsOpen,
    unreadCount,
    toggleNotifications,
  } = useUIState();

  return (
    <aside className="h-screen w-[330px] overflow-y-auto border-l border-white/10 bg-[#060b16] p-2.5">

      <div className="mb-2.5 flex items-center justify-end gap-2 rounded-xl border border-white/10 bg-[#090f1d] px-2.5 py-1.5">
        <button type="button" onClick={toggleNotifications} className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-white/75">
          <Bell size={13} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" />
          )}
        </button>

        <button type="button" onClick={toggleTheme} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-white/75">
          {theme === "dark" ? <Sun size={13} /> : <MoonStar size={13} />}
        </button>

        <div className="h-5 w-px bg-white/10" />

        <div className="flex items-center gap-2 pr-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-violet-500/70 to-indigo-500/70 text-[9px] font-semibold text-white">
            RR
          </div>
          <div>
            <p className="text-[11px] font-medium text-white">Ramdas Raut</p>
            <p className="text-[10px] text-white/50">Founder</p>
          </div>
          <div className="h-7 w-7 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]" />
        </div>
      </div>

      {notificationsOpen && (
        <div className="mb-2.5 rounded-xl border border-white/10 bg-[#0a1223] p-2.5">
          <p className="text-[12px] font-medium text-white">Notifications</p>
          <p className="mt-1 text-[11px] text-white/60">All notifications are marked as read.</p>
        </div>
      )}

      <section className="rounded-xl border border-white/10 bg-[#090f1d] p-2.5">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-white">Live Runtime Stream</h3>
          <span className="flex items-center gap-1 text-[11px] text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Live
          </span>
        </div>

        <div className="relative space-y-1.5 rounded-xl border border-white/10 bg-[#08101f] p-2">

          <div className="pointer-events-none absolute bottom-4 left-[44px] top-4 w-px bg-white/10" />

          {runtimeEvents.map(({ key, time, title, detail, icon: Icon, colorClassName }) => (

            <article key={key} className="grid grid-cols-[40px_1fr] gap-2">
              <p className="pt-2 text-[10px] text-white/45">{time}</p>

              <div className="flex items-start gap-2.5">
                <div className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${colorClassName}`}>
                  <Icon size={13} className="text-white" />
                </div>

                <div className="min-w-0 pb-1.5">
                  <p className="truncate text-[14px] font-medium text-white">{title}</p>
                  <p className="truncate text-[12px] text-white/60">{detail}</p>
                </div>
              </div>
            </article>

          ))}

          <button
            type="button"
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-[13px] font-medium text-violet-200 transition hover:bg-violet-500/15"
          >
            View Full Stream
            <ArrowRight size={13} />
          </button>

        </div>
      </section>

      <section className="mt-2.5 rounded-xl border border-white/10 bg-[#090f1d] p-2.5">
        <h3 className="mb-2 text-[16px] font-semibold text-white">System Health</h3>

        <div className="space-y-1.5">
          {healthMetrics.map(({ key, label, value, progress, progressClassName, icon: Icon, status }) => (
            <article key={key} className="rounded-lg border border-white/10 bg-[#0a1223] px-2.5 py-1.5">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 text-white/80">
                  <Icon size={12} className="shrink-0" />
                  <span className="truncate text-[12px]">{label}</span>
                </div>

                <div className={`text-[11px] font-medium ${status === "ok" ? "text-emerald-400" : "text-amber-300"}`}>
                  {value}
                </div>
              </div>

              {typeof progress === "number" && (
                <div className="h-1.5 rounded-full bg-white/10">
                  <div
                    className={`h-1.5 rounded-full ${progressClassName ?? "bg-white/40"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

    </aside>
  );
}
