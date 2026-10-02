"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import PlanMeter from "@/components/PlanMeter";
import {
  Home,
  MessageSquare,
  FolderKanban,
  Brain,
  Bot,
  BookOpen,
  GitFork,
  Workflow,
  Users,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";

const menu = [
  { icon: Home, label: "Command Center", href: "/dashboard" },
  { icon: MessageSquare, label: "Conversations", href: "/chat" },
  { icon: FolderKanban, label: "Projects", href: "/projects" },
  { icon: Brain, label: "Intelligence", href: "/intelligence" },
  { icon: Bot, label: "Agents", href: "/agents" },
  { icon: BookOpen, label: "Knowledge", href: "/knowledge" },
  { icon: GitFork, label: "Decisions", href: "/decisions" },
  { icon: Workflow, label: "Operations", href: "/operations" },
  { icon: Users, label: "People", href: "/people" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const states = [
  { label: "Listening", dot: "bg-sky-400" },
  { label: "Thinking", dot: "bg-blue-500" },
  { label: "Planning", dot: "bg-violet-400" },
  { label: "Executing", dot: "bg-fuchsia-400" },
  { label: "Learning", dot: "bg-violet-500" },
];

export default function Sidebar({ user }: { user: { name: string; subtitle: string } }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[265px] shrink-0 flex-col border-r border-white/[0.07] bg-[#06070f] px-4 py-5">
      <div className="flex items-center gap-3 px-1">
        <div className="h-11 w-11 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)] shadow-[0_0_22px_rgba(124,92,255,.55)]" />
        <div className="leading-tight">
          <h1 className="text-[22px] font-semibold text-white">EverMind</h1>
          <p className="text-[13px] text-white/55">AI Executive</p>
        </div>
      </div>

      <div className="mt-5 border-t border-white/[0.07]" />

      <nav className="mt-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {menu.map(({ icon: Icon, label, href }) => {
          const active = pathname.startsWith(href);

          return (
            <Link
              key={label}
              href={href}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-[7px] text-left text-[14px] transition ${
                active
                  ? "border border-blue-500/40 bg-gradient-to-r from-blue-600/40 to-indigo-700/30 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} className={active ? "text-sky-300" : "text-white/60"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="relative hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 [@media(min-height:1000px)]:block">
        <p className="text-[13px] font-semibold text-white">EverMind is</p>
        <p className="mt-1 flex items-center gap-2 text-[11px] text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Online
        </p>
        <ul className="mt-3 space-y-2">
          {states.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-[11px] text-white/65">
              <span className={`h-1 w-1 rounded-full ${s.dot}`} />
              {s.label}
            </li>
          ))}
        </ul>
        <div className="pointer-events-none absolute -right-5 bottom-2 h-[88px] w-[88px] rounded-full bg-[radial-gradient(circle_at_50%_50%,#fff_0,#a78bfa_14%,#5b21b6_42%,transparent_70%)] opacity-90 blur-[1px]" />
      </div>

      <PlanMeter />
      <UserMenu name={user.name} subtitle={user.subtitle} />
    </aside>
  );
}
