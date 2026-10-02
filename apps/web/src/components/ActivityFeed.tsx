"use client";

import Link from "next/link";
import { useApi, timeAgo, type ConversationSummary } from "@/lib/useApi";

const initial = [
  { title: "System initialized and ready", text: "EverMind is online and learning about your goals", dot: "bg-blue-500" },
  { title: "AI team activated", text: "12 agents are online and at your service", dot: "bg-emerald-400" },
  { title: "Waiting for your command", text: "Tell me what you want to accomplish", dot: "bg-pink-500" },
];

export default function ActivityFeed() {
  const { data } = useApi<{ conversations: ConversationSummary[] }>("/api/conversations");

  const live = (data?.conversations ?? []).slice(0, 4).map((c) => ({
    title: c.title,
    text: c.preview || "Conversation started",
    dot: "bg-violet-400",
    when: timeAgo(c.updatedAt),
    href: `/chat/${c.id}`,
  }));

  const rows = [
    ...live,
    ...initial.map((i) => ({ ...i, when: "Just now", href: "" })),
  ].slice(0, 4);

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">EverMind Activity Feed</h3>
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live
        </span>
      </div>

      <ul className="mt-3 min-h-0 flex-1 space-y-3 overflow-hidden">
        {rows.map((r, i) => {
          const body = (
            <>
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${r.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-white">{r.title}</p>
                <p className="truncate text-[10px] text-white/55">{r.text}</p>
              </div>
              <span className="shrink-0 text-[10px] text-white/50">{r.when}</span>
            </>
          );
          return (
            <li key={`${r.title}-${i}`}>
              {r.href ? (
                <Link href={r.href} className="flex items-start gap-3 hover:opacity-80">
                  {body}
                </Link>
              ) : (
                <div className="flex items-start gap-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
