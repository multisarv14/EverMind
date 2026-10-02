"use client";

import Link from "next/link";
import PageShell, { EmptyState } from "@/components/PageShell";
import { useApi, timeAgo, type ConversationSummary } from "@/lib/useApi";

export default function KnowledgePage() {
  const { data, error, loading } = useApi<{ conversations: ConversationSummary[] }>("/api/conversations");

  return (
    <PageShell title="Knowledge" subtitle="Everything EverMind remembers from your conversations">
      {error ? (
        <EmptyState title="Can't load your memory" text="Something went wrong. Please refresh and try again." />
      ) : loading ? (
        <p className="text-[13px] text-white/60">Loading memory…</p>
      ) : data!.conversations.length === 0 ? (
        <EmptyState title="Nothing remembered yet" text="Give EverMind an objective on the Command Center and it will be stored here." />
      ) : (
        <ul className="space-y-3">
          {data!.conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/chat/${c.id}`}
                className="block rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-violet-500/40"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="truncate text-[14px] font-semibold text-white">{c.title}</p>
                  <span className="shrink-0 text-[11px] text-white/50">{timeAgo(c.updatedAt)}</span>
                </div>
                {c.preview && <p className="mt-1 line-clamp-2 text-[12px] text-white/60">{c.preview}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
