"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Plus } from "lucide-react";
import { timeAgo, type ConversationSummary } from "@/lib/useApi";
import { USAGE_EVENT } from "@/components/PlanMeter";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const prose =
  "text-[14px] leading-relaxed text-white/90 [&_a]:text-violet-300 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-[18px] [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-[16px] [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:my-3 [&_table]:w-full [&_td]:border [&_td]:border-white/10 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-white/10 [&_th]:px-2 [&_th]:py-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5";

async function fetchHistory(): Promise<ConversationSummary[]> {
  try {
    const res = await fetch("/api/conversations");
    return res.ok ? (await res.json()).conversations : [];
  } catch {
    return [];
  }
}

export default function ChatView({ id }: { id?: string }) {
  const [cid, setCid] = useState(id ?? "");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(id));
  const bottom = useRef<HTMLDivElement>(null);
  const autoSent = useRef(false);
  const projectRef = useRef("");
  const [limitReached, setLimitReached] = useState(false);

  const loadHistory = useCallback(() => {
    fetchHistory().then(setHistory);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchHistory().then((list) => !cancelled && setHistory(list));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/conversations/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setMessages(d.messages))
      .catch(() => setError("This conversation could not be loaded."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || streaming) return;

      setError("");
      setInput("");
      setStreaming(true);
      setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);

      const append = (delta: string) =>
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + delta };
          return next;
        });

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            conversationId: cid || undefined,
            projectId: projectRef.current || undefined,
          }),
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          if (data.code === "limit_reached") setLimitReached(true);
          throw new Error(data.error ?? "Something went wrong.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let split: number;
          while ((split = buffer.indexOf("\n\n")) !== -1) {
            const line = buffer.slice(0, split).trim();
            buffer = buffer.slice(split + 2);
            if (!line.startsWith("data:")) continue;

            const event = JSON.parse(line.slice(5));
            if (event.type === "meta") {
              setCid(event.conversationId);
              window.history.replaceState(null, "", `/chat/${event.conversationId}`);
            } else if (event.type === "text") {
              append(event.text);
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        // Drop the empty assistant bubble if nothing was streamed.
        setMessages((prev) =>
          prev.length && prev[prev.length - 1].role === "assistant" && !prev[prev.length - 1].content
            ? prev.slice(0, -1)
            : prev
        );
      } finally {
        setStreaming(false);
        loadHistory();
        window.dispatchEvent(new Event(USAGE_EVENT));
      }
    },
    [cid, streaming, loadHistory]
  );

  // Hand-off from the Command Center prompt: /chat?q=...
  useEffect(() => {
    if (id || autoSent.current) return;
    const params = new URLSearchParams(window.location.search);
    projectRef.current = params.get("project") ?? "";
    const q = params.get("q");
    if (q) {
      autoSent.current = true;
      window.history.replaceState(null, "", "/chat");
      setTimeout(() => void send(q), 0);
    }
  }, [id, send]);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <div className="flex h-full">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/[0.07] p-3 lg:flex">
        <Link
          href="/chat"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[13px] text-white hover:border-violet-500/60"
        >
          <Plus size={15} /> New conversation
        </Link>
        <p className="mb-2 mt-5 px-2 text-[11px] uppercase tracking-wide text-white/40">Recent</p>
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {history.map((c) => (
            <li key={c.id}>
              <Link
                href={`/chat/${c.id}`}
                className={`block rounded-lg px-3 py-2 text-[13px] ${
                  c.id === cid ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
                }`}
              >
                <span className="block truncate">{c.title}</span>
                <span className="text-[10px] text-white/40">{timeAgo(c.updatedAt)}</span>
              </Link>
            </li>
          ))}
          {history.length === 0 && <li className="px-2 text-[12px] text-white/40">Nothing yet.</li>}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-[760px] space-y-6">
            {loading && <p className="text-[13px] text-white/50">Loading…</p>}

            {!loading && messages.length === 0 && (
              <div className="flex flex-col items-center pt-24 text-center">
                <div className="h-14 w-14 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)] shadow-[0_0_30px_rgba(124,92,255,.6)]" />
                <h2 className="mt-4 text-[22px] font-semibold text-white">What would you like to accomplish?</h2>
                <p className="mt-1 text-[14px] text-white/60">I&apos;ll understand, plan and execute.</p>
              </div>
            )}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-violet-600/25 px-4 py-2.5 text-[14px] text-white">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <div className="mt-1 h-7 w-7 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)]" />
                  <div className={`min-w-0 flex-1 ${prose}`}>
                    {m.content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    ) : (
                      <span className="inline-flex gap-1 pt-2">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300 [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                </div>
              )
            )}

            {error && (
              <div role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">
                {error}
                {limitReached && (
                  <Link href="/settings" className="ml-2 font-medium text-white underline">
                    View plans
                  </Link>
                )}
              </div>
            )}
            <div ref={bottom} />
          </div>
        </div>

        <div className="px-6 pb-5">
          <div className="relative mx-auto max-w-[760px] rounded-2xl border-2 border-violet-500/60 bg-[#0a0c1c] shadow-[0_0_24px_rgba(124,92,255,.25)]">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Tell EverMind what you want to accomplish..."
              className="w-full resize-none bg-transparent px-4 py-3 pr-16 text-[14px] text-white outline-none placeholder:text-white/40"
            />
            <button
              onClick={() => void send(input)}
              disabled={streaming || !input.trim()}
              aria-label="Send"
              className="absolute bottom-2.5 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-40"
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
