"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PROSE } from "@/components/Markdown";
import { agents } from "@/constants/agents";
import { AGENT_TRAINING } from "@/constants/agentTraining";
import { ArrowUp, Check, ChevronDown, Clock, Copy, FolderKanban, Plus, Square, ThumbsDown, ThumbsUp } from "lucide-react";
import { timeAgo, useApi, type ConversationSummary, type Me } from "@/lib/useApi";
import { USAGE_EVENT } from "@/components/PlanMeter";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

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
  const agentRef = useRef("");
  const [agentId, setAgentId] = useState("");
  const agent = agents.find((a) => a.id === agentId);
  const me = useApi<Me>("/api/auth/me").data;
  const team = me ? agents.filter((a) => me.agents.includes(a.id)) : agents;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const cidRef = useRef("");
  const [projectId, setProjectId] = useState("");
  const projects = useApi<{ projects: { id: string; name: string }[] }>("/api/projects").data?.projects ?? [];
  const project = projects.find((p) => p.id === projectId);
  const [limitReached, setLimitReached] = useState(false);
  const [depth, setDepth] = useState<"basic" | "advanced">("basic");
  const [ratings, setRatings] = useState<Record<number, "up" | "down">>({});

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
      .then((d) => {
        setMessages(d.messages);
        if (d.agent) setAgentId(d.agent);
        if (d.projectId) setProjectId(d.projectId);
        if (d.depth === "advanced" || d.depth === "basic") setDepth(d.depth);
      })
      .catch(() => setError("This conversation could not be loaded."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!cid || streaming) return;
    let cancelled = false;
    fetch(`/api/feedback?conversation=${cid}`)
      .then((r) => (r.ok ? r.json() : { ratings: {} }))
      .then((d) => !cancelled && setRatings(d.ratings ?? {}))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cid, streaming]);

  const resetChat = useCallback(() => {
    setCid("");
    setMessages([]);
    setRatings({});
    setInput("");
    setError("");
    setLimitReached(false);
    window.history.replaceState(null, "", "/chat");
    inputRef.current?.focus();
  }, []);

  // The address bar is changed with history.replaceState while a chat streams, so Next's router
  // still renders this same page for /chat. Anything that navigates back to plain /chat (the
  // button below or the sidebar's "Conversations") must therefore reset the chat itself.
  useEffect(() => {
    cidRef.current = cid;
  }, [cid]);

  useEffect(() => {
    if (id || pathname !== "/chat" || !cidRef.current) return;
    const t = setTimeout(resetChat, 0);
    return () => clearTimeout(t);
  }, [pathname, id, resetChat]);

  function newConversation() {
    if (streaming) return;
    setHistoryOpen(false);
    if (id) router.push("/chat");
    else resetChat();
  }

  async function copy(index: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      setTimeout(() => setCopied((c) => (c === index ? null : c)), 1500);
    } catch {
      /* clipboard unavailable (e.g. insecure page) */
    }
  }

  const rate = useCallback(
    async (index: number, value: "up" | "down") => {
      if (!cid) return;
      const next = ratings[index] === value ? null : value;
      setRatings((prev) => {
        const copy = { ...prev };
        if (next) copy[index] = next;
        else delete copy[index];
        return copy;
      });
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: cid, messageIndex: index, rating: next }),
        });
      } catch {
        /* feedback is best-effort */
      }
    },
    [cid, ratings]
  );

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

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            conversationId: cid || undefined,
            projectId: projectRef.current || undefined,
            agent: agentRef.current || undefined,
            depth,
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
        if (e instanceof DOMException && e.name === "AbortError") {
          // The user pressed Stop: keep whatever was written so far, show no error.
          setMessages((prev) =>
            prev.length && prev[prev.length - 1].role === "assistant" && !prev[prev.length - 1].content ? prev.slice(0, -1) : prev
          );
          return;
        }
        setError(e instanceof Error ? e.message : "Something went wrong.");
        // Drop the empty assistant bubble if nothing was streamed.
        setMessages((prev) =>
          prev.length && prev[prev.length - 1].role === "assistant" && !prev[prev.length - 1].content
            ? prev.slice(0, -1)
            : prev
        );
      } finally {
        abortRef.current = null;
        setStreaming(false);
        loadHistory();
        window.dispatchEvent(new Event(USAGE_EVENT));
      }
    },
    [cid, streaming, loadHistory, depth]
  );

  // Hand-off from the Command Center prompt: /chat?q=...
  useEffect(() => {
    if (id || autoSent.current) return;
    const params = new URLSearchParams(window.location.search);
    projectRef.current = params.get("project") ?? "";
    if (projectRef.current) {
      const pid = projectRef.current;
      setTimeout(() => setProjectId(pid), 0);
    }
    try {
      if (localStorage.getItem("evermind-depth") === "advanced") setTimeout(() => setDepth("advanced"), 0);
    } catch {
      /* ignore */
    }
    agentRef.current = params.get("agent") ?? "";
    const a = agentRef.current;
    if (a) setTimeout(() => setAgentId(a), 0);
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

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] px-6 py-2.5">
          <div className="flex min-w-0 items-center gap-2 text-[13px] text-white/70">
            {agent ? (
              <>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${agent.tone}`}><agent.icon size={13} /></span>
                <span className="truncate font-medium text-white">{agent.name}</span>
              </>
            ) : (
              <span className="truncate font-medium text-white">EverMind</span>
            )}
            {project && (
              <Link href={`/projects/${project.id}`} className="flex shrink-0 items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[12px] text-violet-200 hover:bg-violet-500/20">
                <FolderKanban size={12} /> {project.name}
              </Link>
            )}
            {cid && history.find((c) => c.id === cid) && (
              <span className="hidden truncate text-white/45 sm:inline">· {history.find((c) => c.id === cid)?.title}</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              aria-expanded={historyOpen}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-[13px] text-white/80 transition hover:bg-white/5"
            >
              <Clock size={14} /> History
              {history.length > 0 && <span className="text-white/40">{history.length}</span>}
              <ChevronDown size={13} className={`transition ${historyOpen ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={newConversation}
              disabled={streaming}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-60"
            >
              <Plus size={14} /> New conversation
            </button>
          </div>

          {historyOpen && (
            <>
              <button aria-label="Close history" className="fixed inset-0 z-10 cursor-default" onClick={() => setHistoryOpen(false)} />
              <div className="absolute right-6 top-full z-20 mt-1 w-[360px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-xl border border-white/10 bg-[var(--card-bg)] shadow-xl">
                <p className="px-4 pb-1 pt-3 text-[11px] uppercase tracking-wide text-white/40">Your conversations</p>
                <ul className="max-h-[60vh] overflow-y-auto p-2">
                  {history.length === 0 && <li className="px-3 py-4 text-[12px] leading-snug text-white/45">Your past conversations will be saved here.</li>}
                  {history.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/chat/${c.id}`}
                        onClick={() => setHistoryOpen(false)}
                        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[13px] ${c.id === cid ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/5"}`}
                      >
                        <span className="truncate">{c.title}</span>
                        <span className="shrink-0 text-[11px] text-white/40">{timeAgo(c.updatedAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-[760px] space-y-6">
            {loading && <p className="text-[13px] text-white/50">Loading…</p>}

            {!loading && messages.length === 0 && (
              <div className="pt-10 sm:pt-16">
                {agent ? (
                  <div className="text-center">
                    <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${agent.tone}`}>
                      <agent.icon size={30} />
                    </span>
                    <h2 className="mt-4 text-[24px] font-semibold text-white">{agent.name}</h2>
                    <p className="mx-auto mt-2 max-w-[520px] text-[14px] leading-relaxed text-white/65">{AGENT_TRAINING[agent.id]?.mission}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)] shadow-[0_0_30px_rgba(124,92,255,.6)]" />
                    <h2 className="mt-4 text-[24px] font-semibold text-white">Chat with EverMind</h2>
                    <p className="mx-auto mt-2 max-w-[520px] text-[14px] leading-relaxed text-white/65">
                      Ask anything about running your company. EverMind plans, advises and drafts the work, using what it knows about your business.
                    </p>
                  </div>
                )}

                <p className="mb-2 mt-8 text-[11px] uppercase tracking-wide text-white/40">
                  {agent ? "What I can help with — tap one to start" : "Try one of these"}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(agent
                    ? AGENT_TRAINING[agent.id]?.playbooks ?? []
                    : [
                        { name: "Plan something", ask: "Help me plan a " },
                        { name: "Solve a problem", ask: "I need to solve this problem: " },
                        { name: "Make a decision", ask: "Help me decide between " },
                        { name: "Research", ask: "Research the competitors and trends for " },
                      ]
                  ).map((pb) => (
                    <button
                      key={pb.name}
                      onClick={() => {
                        // Prompts that end mid-sentence wait for the user to finish them.
                        if (/[:\s]$/.test(pb.ask)) {
                          setInput(pb.ask);
                          inputRef.current?.focus();
                        } else {
                          void send(pb.ask);
                        }
                      }}
                      className="rounded-xl border border-white/10 px-4 py-3 text-left transition hover:border-violet-500/50 hover:bg-white/[0.04]"
                    >
                      <span className="block text-[13px] font-medium text-white">{pb.name}</span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-white/50">{pb.ask}</span>
                    </button>
                  ))}
                </div>

                <p className="mb-2 mt-8 text-[11px] uppercase tracking-wide text-white/40">
                  {agent ? "Talk to a different specialist" : "Or talk to a specialist"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {agent && (
                    <Link href="/chat" className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-white/70 hover:border-violet-500/50 hover:text-white">
                      EverMind (general)
                    </Link>
                  )}
                  {team.filter((a) => a.id !== agentId).map((a) => (
                    <Link
                      key={a.id}
                      href={`/chat?agent=${a.id}`}
                      className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-white/70 transition hover:border-violet-500/50 hover:text-white"
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-md ${a.tone}`}><a.icon size={11} /></span>
                      {a.name.replace(" Agent", "")}
                    </Link>
                  ))}
                </div>
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
                  <div className={`min-w-0 flex-1 ${PROSE}`}>
                    {m.content ? (
                      <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        {!(streaming && i === messages.length - 1) && cid && (
                          <div className="mt-1 flex items-center gap-1 text-white/35">
                            <button onClick={() => copy(i, m.content)} aria-label="Copy answer" className="flex items-center gap-1 rounded-md p-1.5 text-[12px] transition hover:bg-white/10 hover:text-white">
                              {copied === i ? <><Check size={14} className="text-emerald-400" /> Copied</> : <Copy size={14} />}
                            </button>
                            <button onClick={() => rate(i, "up")} aria-label="Good answer" aria-pressed={ratings[i] === "up"}
                              className={`rounded-md p-1.5 transition hover:bg-white/10 hover:text-white ${ratings[i] === "up" ? "text-emerald-400" : ""}`}>
                              <ThumbsUp size={14} />
                            </button>
                            <button onClick={() => rate(i, "down")} aria-label="Bad answer" aria-pressed={ratings[i] === "down"}
                              className={`rounded-md p-1.5 transition hover:bg-white/10 hover:text-white ${ratings[i] === "down" ? "text-rose-400" : ""}`}>
                              <ThumbsDown size={14} />
                            </button>
                          </div>
                        )}
                      </>
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
          <div className="mx-auto mb-2 flex max-w-[760px] items-center gap-3 text-[12px]">
            <span className="text-white/55">Answers:</span>
            <div className="inline-flex rounded-lg border border-white/10 p-0.5" role="group" aria-label="Answer depth">
              {(["basic", "advanced"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDepth(d);
                    try { localStorage.setItem("evermind-depth", d); } catch { /* ignore */ }
                  }}
                  aria-pressed={depth === d}
                  className={`rounded-md px-3 py-1 capitalize transition ${depth === d ? "bg-violet-600 text-white" : "text-white/60 hover:text-white"}`}
                >
                  {d}
                </button>
              ))}
            </div>
            <span className="hidden text-white/45 sm:inline">
              {depth === "basic" ? "Simple, short answers" : "Expert depth: numbers, trade-offs and risks"}
            </span>
          </div>
          <div className="relative mx-auto max-w-[760px] rounded-2xl border-2 border-violet-500/60 bg-[var(--card-bg)] shadow-[0_0_24px_rgba(124,92,255,.25)]">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              ref={inputRef}
              placeholder={agent ? `Ask the ${agent.name} anything…` : "Tell EverMind what you want to get done…"}
              className="w-full resize-none bg-transparent px-4 py-3 pr-16 text-[14px] text-white outline-none placeholder:text-white/40"
            />
            {streaming ? (
              <button
                onClick={() => abortRef.current?.abort()}
                aria-label="Stop generating"
                title="Stop generating"
                className="absolute bottom-2.5 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={() => void send(input)}
                disabled={!input.trim()}
                aria-label="Send"
                className="absolute bottom-2.5 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-40"
              >
                <ArrowUp size={17} />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
