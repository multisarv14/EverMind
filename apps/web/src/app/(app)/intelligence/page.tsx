"use client";

import PageShell from "@/components/PageShell";
import { useApi, type ConversationSummary } from "@/lib/useApi";

interface Status {
  aiConfigured: boolean;
  model: string;
}

export default function IntelligencePage() {
  const status = useApi<Status>("/api/status").data;
  const convos = useApi<{ conversations: ConversationSummary[] }>("/api/conversations").data;

  const cards = [
    {
      label: "AI engine",
      value: status ? (status.aiConfigured ? "Connected" : "Not configured") : "…",
      note: status && !status.aiConfigured ? "Add ANTHROPIC_API_KEY to apps/web/.env.local" : "Ready for objectives",
    },
    { label: "Model", value: status?.model ?? "…", note: "Powers every EverMind response" },
    { label: "Conversations remembered", value: convos ? String(convos.conversations.length) : "…", note: "Stored in your company memory" },
  ];

  return (
    <PageShell title="Intelligence" subtitle="How EverMind is thinking right now">
      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="text-[12px] text-white/60">{c.label}</p>
            <p className="mt-1 text-[20px] font-semibold text-white">{c.value}</p>
            <p className="mt-2 text-[12px] text-white/50">{c.note}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
