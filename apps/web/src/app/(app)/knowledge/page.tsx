"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import PageShell, { EmptyState } from "@/components/PageShell";
import { api, errMsg } from "@/lib/client";
import { useApi, timeAgo, type ConversationSummary, type Me } from "@/lib/useApi";

interface Item {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const field =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-violet-500/70";

export default function KnowledgePage() {
  const me = useApi<Me>("/api/auth/me").data;
  const kb = useApi<{ items: Item[] }>("/api/knowledge");
  const chats = useApi<{ conversations: ConversationSummary[] }>("/api/conversations");

  const [tab, setTab] = useState<"company" | "memory">("company");
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const editable = me?.can.createProject ?? false;
  const items = kb.data?.items ?? [];

  function startEdit(i: Item | null) {
    setEditing(i ? i.id : "new");
    setTitle(i?.title ?? "");
    setContent(i?.content ?? "");
    setError("");
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editing === "new") await api("/api/knowledge", "POST", { title, content });
      else await api(`/api/knowledge/${editing}`, "PATCH", { title, content });
      setEditing(null);
      kb.reload();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  const tabBtn = (id: "company" | "memory", label: string) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-lg px-4 py-2 text-[13px] ${tab === id ? "bg-violet-600/25 text-white" : "text-white/60 hover:bg-white/5"}`}
    >
      {label}
    </button>
  );

  return (
    <PageShell title="Knowledge" subtitle="What EverMind knows about your company. It reads this in every conversation.">
      <div className="mb-5 flex gap-2">
        {tabBtn("company", `Company knowledge${items.length ? ` · ${items.length}` : ""}`)}
        {tabBtn("memory", "Remembered conversations")}
      </div>

      {tab === "company" && (
        <>
          {editable && editing === null && (
            <button onClick={() => startEdit(null)} className="mb-5 rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500">
              Add knowledge
            </button>
          )}

          {editing !== null && (
            <form onSubmit={save} className="mb-6 space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <h3 className="text-[15px] font-semibold text-white">{editing === "new" ? "Add to company knowledge" : "Edit knowledge"}</h3>
              <input className={field} placeholder="Title (e.g. What we sell, Pricing, Brand voice)" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
              <textarea className={`${field} resize-none`} rows={6} placeholder="Write what EverMind should know. Facts, products, customers, policies, goals…" value={content} onChange={(e) => setContent(e.target.value)} required maxLength={8000} />
              {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-[13px] text-rose-300">{error}</p>}
              <div className="flex gap-2">
                <button className="rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500">Save</button>
                <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-white/10 px-5 py-2.5 text-[13px] text-white/75 hover:bg-white/5">Cancel</button>
              </div>
            </form>
          )}

          {kb.data && items.length === 0 && editing === null ? (
            <EmptyState title="Teach EverMind about your company" text={editable ? "Add facts about what you sell, who your customers are and how you work. EverMind will use them to give better, more specific answers." : "Your team hasn't added company knowledge yet."} />
          ) : (
            <ul className="grid gap-3 xl:grid-cols-2">
              {items.map((i) => (
                <li key={i.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-[14px] font-semibold text-white"><BookOpen size={15} className="text-violet-300" />{i.title}</h3>
                    {editable && (
                      <span className="flex shrink-0 gap-2 text-white/40">
                        <button aria-label={`Edit ${i.title}`} onClick={() => startEdit(i)} className="hover:text-white"><Pencil size={14} /></button>
                        <button aria-label={`Delete ${i.title}`} onClick={() => api(`/api/knowledge/${i.id}`, "DELETE").then(kb.reload)} className="hover:text-rose-300"><Trash2 size={14} /></button>
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-[13px] leading-relaxed text-white/65">{i.content}</p>
                  <p className="mt-3 text-[11px] text-white/35">Updated {timeAgo(i.updatedAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "memory" && (
        chats.data && chats.data.conversations.length === 0 ? (
          <EmptyState title="Nothing remembered yet" text="Give EverMind an objective on the Command Center and it will be stored here." />
        ) : (
          <ul className="space-y-3">
            {chats.data?.conversations.map((c) => (
              <li key={c.id}>
                <Link href={`/chat/${c.id}`} className="block rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-violet-500/40">
                  <div className="flex items-center justify-between gap-4">
                    <p className="truncate text-[14px] font-semibold text-white">{c.title}</p>
                    <span className="shrink-0 text-[11px] text-white/50">{timeAgo(c.updatedAt)}</span>
                  </div>
                  {c.preview && <p className="mt-1 line-clamp-2 text-[12px] text-white/60">{c.preview}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )
      )}
    </PageShell>
  );
}
