"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  Clock3,
  FileBarChart2,
  FolderKanban,
  LayoutDashboard,
  PanelLeftClose,
  PlayCircle,
  Route,
  Settings,
  Target,
  Workflow,
  Database,
  Scale,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SidebarItem {
  key: string;
  icon: LucideIcon;
  label: string;
  href: string;
  enabled?: boolean;
}

export interface SidebarGroup {
  key: string;
  items: readonly SidebarItem[];
}

export const defaultSidebarGroups: readonly SidebarGroup[] = [
  {
    key: "main",
    items: [
      {
        key: "dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/",
        enabled: true,
      },
    ],
  },
  {
    key: "execution",
    items: [
      {
        key: "runtime",
        icon: Workflow,
        label: "Runtime",
        href: "/runtime",
      },
      {
        key: "execution",
        icon: PlayCircle,
        label: "Execution",
        href: "/execution",
      },
      {
        key: "sessions",
        icon: Clock3,
        label: "Sessions",
        href: "/sessions",
      },
    ],
  },
  {
    key: "intelligence",
    items: [
      {
        key: "thinking",
        icon: BrainCircuit,
        label: "Thinking",
        href: "/thinking",
      },
      {
        key: "planning",
        icon: Route,
        label: "Planning",
        href: "/planning",
      },
      {
        key: "decision",
        icon: Scale,
        label: "Decision",
        href: "/decision",
      },
    ],
  },
  {
    key: "memory-knowledge",
    items: [
      {
        key: "memory",
        icon: Database,
        label: "Memory",
        href: "/memory",
      },
      {
        key: "knowledge",
        icon: BookOpen,
        label: "Knowledge",
        href: "/knowledge",
      },
    ],
  },
  {
    key: "management",
    items: [
      {
        key: "objectives",
        icon: Target,
        label: "Objectives",
        href: "/objectives",
      },
      {
        key: "projects",
        icon: FolderKanban,
        label: "Projects",
        href: "/projects",
      },
      {
        key: "agents",
        icon: Bot,
        label: "Agents",
        href: "/agents",
      },
    ],
  },
  {
    key: "insights",
    items: [
      {
        key: "analytics",
        icon: BarChart3,
        label: "Analytics",
        href: "/analytics",
      },
      {
        key: "reports",
        icon: FileBarChart2,
        label: "Reports",
        href: "/reports",
      },
      {
        key: "settings",
        icon: Settings,
        label: "Settings",
        href: "/settings",
      },
    ],
  },
];

interface SidebarProps {
  groups?: readonly SidebarGroup[];
}

export default function Sidebar({
  groups = defaultSidebarGroups,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="h-screen w-[194px] border-r border-white/10 bg-[#070a13] flex flex-col">

      <div className="border-b border-white/10 px-2 py-2">

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1020] px-2 py-1.5">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-700 to-indigo-500 shadow-[0_0_20px_rgba(110,87,255,0.35)]">
            <BrainCircuit size={17} className="text-white" />
          </div>

          <div>
            <h1 className="text-[18px] leading-5 font-semibold text-white">
              EverMind
            </h1>

            <p className="text-xs text-white/55">
              AI Executive OS
            </p>
          </div>

        </div>

      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">

        <div className="space-y-2">

          {groups.map(({ key: groupKey, items }) => (

            <section key={groupKey}>

              <div className="space-y-1">

                {items.map(({ key, icon: Icon, label: itemLabel, href }) => {
                  const active = isActive(href);
                  const enabled = href === "/";
                  const className = `flex items-center gap-2 rounded-xl px-2 py-1.5 text-[13px] font-medium transition ${
                    active
                      ? "border border-violet-400/25 bg-violet-500/15 text-white"
                      : "text-white/72 hover:bg-white/[0.04] hover:text-white"
                  }`;

                  if (!enabled) {
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-disabled="true"
                        className={className}
                      >
                        <Icon size={14} className="text-white/70" />
                        <span>{itemLabel}</span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={key}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={className}
                    >
                      <Icon size={14} className={active ? "text-violet-300" : "text-white/70"} />
                      <span>{itemLabel}</span>
                    </Link>
                  );
                })}

              </div>

            </section>

          ))}

        </div>

      </nav>

      <div className="px-3 pb-3 pt-2">
        <button
          type="button"
          aria-label="Collapse sidebar"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-white/70 transition hover:text-white"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

    </aside>
  );
}
