"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, Circle, FolderKanban, MessageSquare, MessageSquarePlus, Trash2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import { agents } from "@/constants/agents";
import { api, errMsg } from "@/lib/client";
import { useApi, timeAgo, type Me } from "@/lib/useApi";

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  instructions: string;
  editable: boolean;
  conversations: { id: string; title: string; updatedAt: string }[];
}

interface Task {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  due: string | null;
}

const STARTERS = [
  "Make a step-by-step plan for this project",
  "What are the biggest risks, and how do we reduce them?",
  "Write a short status update I can share with the team",
  "What should we focus on this week?",
];

const field =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-violet-500/70 disabled:opacity-60";
const label = "mb-1.5 block text-[13px] font-medium text-white/75";
const card = "rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const me = useApi<Me>("/api/auth/me").data;
  const { data: project, error, reload } = useApi<ProjectDetail>(`/api/projects/${id}`);
  const board = useApi<{ tasks: Task[] }>(`/api/tasks?project=${id}`);
  const [draft, setDraft] = useState<{ name: string; description: string; instructions: string } | null>(null);
  const [message, setMessage] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskError, setTaskError] = useState("");

  if (error) {
    return (
      <PageShell title="Project not found" subtitle="It may have been deleted.">
        <Link href="/projects" className="text-[13px] text-violet-300 hover:underline">← Back to projects</Link>
      </PageShell>
    );
  }
  if (!project) return <PageShell title="Project" subtitle=""><p className="text-[13px] text-white/60">Loading…</p></PageShell>;

  const form = draft ?? { name: project.name, description: project.description, instructions: project.instructions };
  const canChat = me?.can.chat ?? false;
  const canEditWork = me?.can.createProject ?? false;
  const team = me ? agents.filter((a) => me.agents.includes(a.id)) : agents;
  const tasks = board.data?.tasks ?? [];
  const done = tasks.filter((t) => t.status === "done").length;
  const open = tasks.length - done;

  async function save() {
    setMessage("");
    try {
      await api(`/api/projects/${id}`, "PATCH", form);
      setDraft(null);
      setMessage("Saved.");
      reload();
    } catch (e) {
      setMessage(errMsg(e));
    }
  }

  async function remove() {
    if (!window.confirm("Delete this project? Its conversations are kept but removed from the project.")) return;
    await api(`/api/projects/${id}`, "DELETE");
    router.push("/projects");
  }

  async function addTask(e: FormEvent) {
    e.preventDefault();
    setTaskError("");
    try {
      await api("/api/tasks", "POST", { title: taskTitle, projectId: id });
      setTaskTitle("");
      board.reload();
    } catch (err) {
      setTaskError(errMsg(err));
    }
  }

  const toggle = async (t: Task) => {
    try {
      await api(`/api/tasks/${t.id}`, "PATCH", { status: t.status === "done" ? "todo" : "done" });
      board.reload();
    } catch (err) {
      setTaskError(errMsg(err));
    }
  };

  return (
    <PageShell title={project.name} subtitle={project.description || "A project workspace"}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-[13px] text-white/55 hover:text-white"><ArrowLeft size={14} /> All projects</Link>
        {canChat && (
          <Link href={`/chat?project=${project.id}`} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500">
            <MessageSquarePlus size={15} /> New chat in this project
          </Link>
        )}
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "Open tasks", value: open },
          { label: "Tasks done", value: done },
          { label: "Your chats", value: project.conversations.length },
        ].map((s) => (
          <div key={s.label} className={card}>
            <p className="text-[24px] font-semibold leading-tight text-white">{s.value}</p>
            <p className="text-[12px] text-white/50">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          {canChat && (
            <section className={card}>
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white"><MessageSquare size={16} className="text-violet-300" /> Work on this project</h3>
              <p className="mt-1 text-[12px] text-white/50">Start a chat. EverMind already knows this project&apos;s goal and instructions.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {STARTERS.map((q) => (
                  <Link key={q} href={`/chat?project=${project.id}&q=${encodeURIComponent(q)}`}
                    className="rounded-xl border border-white/10 px-3.5 py-2.5 text-[13px] text-white/80 transition hover:border-violet-500/50 hover:bg-white/[0.04]">
                    {q}
                  </Link>
                ))}
              </div>
              <p className="mb-2 mt-4 text-[11px] uppercase tracking-wide text-white/40">Or ask a specialist</p>
              <div className="flex flex-wrap gap-2">
                {team.map((a) => (
                  <Link key={a.id} href={`/chat?project=${project.id}&agent=${a.id}`}
                    className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-white/70 transition hover:border-violet-500/50 hover:text-white">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md ${a.tone}`}><a.icon size={11} /></span>
                    {a.name.replace(" Agent", "")}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className={card}>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-white">Tasks</h3>
              <Link href="/operations" className="text-[12px] text-violet-300 hover:underline">Open the full board →</Link>
            </div>
            {canEditWork && (
              <form onSubmit={addTask} className="mt-3 flex gap-2">
                <input className={field} placeholder="Add a task to this project…" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required minLength={2} maxLength={200} aria-label="New task" />
                <button className="shrink-0 rounded-xl bg-violet-600 px-4 text-[13px] font-medium text-white hover:bg-violet-500">Add</button>
              </form>
            )}
            {taskError && <p role="alert" className="mt-2 text-[12px] text-rose-300">{taskError}</p>}
            <ul className="mt-3 divide-y divide-white/[0.06]">
              {board.data && tasks.length === 0 && <li className="py-3 text-[13px] text-white/45">No tasks yet. Add the first step above.</li>}
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <button onClick={() => canEditWork && toggle(t)} disabled={!canEditWork} aria-label={t.status === "done" ? "Mark as not done" : "Mark as done"}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${t.status === "done" ? "bg-emerald-500/20 text-emerald-400" : "text-white/30 hover:text-white/60"}`}>
                    {t.status === "done" ? <Check size={13} /> : <Circle size={15} />}
                  </button>
                  <span className={`flex-1 text-[13px] ${t.status === "done" ? "text-white/40 line-through" : "text-white"}`}>{t.title}</span>
                  {t.status === "doing" && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-400">In progress</span>}
                  {t.due && t.status !== "done" && <span className="text-[11px] text-white/40">Due {t.due}</span>}
                </li>
              ))}
            </ul>
          </section>

          <section className={card}>
            <h3 className="text-[15px] font-semibold text-white">Your conversations in this project</h3>
            <ul className="mt-2 divide-y divide-white/[0.06]">
              {project.conversations.length === 0 && <li className="py-3 text-[13px] text-white/45">No conversations yet. Use “Work on this project” above to start one.</li>}
              {project.conversations.map((c) => (
                <li key={c.id}>
                  <Link href={`/chat/${c.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80">
                    <span className="truncate text-[13px] text-white">{c.title}</span>
                    <span className="shrink-0 text-[11px] text-white/45">{timeAgo(c.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className={`${card} h-fit`}>
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white"><FolderKanban size={16} className="text-violet-300" /> Project details</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="n" className={label}>Project name</label>
              <input id="n" className={field} value={form.name} disabled={!project.editable} maxLength={80} onChange={(e) => setDraft({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="d" className={label}>What is it about?</label>
              <input id="d" className={field} value={form.description} disabled={!project.editable} maxLength={500} placeholder="One line description" onChange={(e) => setDraft({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label htmlFor="i" className={label}>Instructions for EverMind</label>
              <textarea id="i" className={`${field} resize-none`} rows={7} value={form.instructions} disabled={!project.editable} maxLength={4000}
                placeholder="Goal, audience, tone, things to avoid…" onChange={(e) => setDraft({ ...form, instructions: e.target.value })} />
              <p className="mt-1 text-[12px] text-white/45">EverMind follows these in every chat inside this project.</p>
            </div>
            {message && <p className="text-[12px] text-white/60">{message}</p>}
            {project.editable && (
              <div className="flex items-center justify-between">
                <button onClick={save} disabled={draft === null} className="rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-40">Save changes</button>
                <button onClick={remove} className="flex items-center gap-1.5 text-[13px] text-white/45 hover:text-rose-300"><Trash2 size={15} /> Delete project</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
