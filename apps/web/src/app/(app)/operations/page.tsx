"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Trash2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import { api, errMsg, ApiError } from "@/lib/client";
import { useApi, type Me } from "@/lib/useApi";
import { USAGE_EVENT } from "@/components/PlanMeter";

interface Task {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  due: string | null;
  projectId: string | null;
  projectName: string | null;
  assigneeName: string | null;
}

const COLUMNS: { id: Task["status"]; label: string; dot: string }[] = [
  { id: "todo", label: "To do", dot: "bg-sky-400" },
  { id: "doing", label: "In progress", dot: "bg-amber-400" },
  { id: "done", label: "Done", dot: "bg-emerald-400" },
];

const field =
  "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-violet-500/70";
const today = () => new Date().toISOString().slice(0, 10);

export default function OperationsPage() {
  const me = useApi<Me>("/api/auth/me").data;
  const board = useApi<{ tasks: Task[]; people: { id: string; name: string }[] }>("/api/tasks");
  const projects = useApi<{ projects: { id: string; name: string }[] }>("/api/projects").data?.projects ?? [];

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [due, setDue] = useState("");
  const [goal, setGoal] = useState("");
  const [goalProject, setGoalProject] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [planLink, setPlanLink] = useState(false);

  const editable = me?.can.createProject ?? false;
  const tasks = board.data?.tasks ?? [];
  const people = board.data?.people ?? [];

  async function run(action: () => Promise<unknown>, success = "") {
    setError("");
    setNotice("");
    setPlanLink(false);
    try {
      await action();
      if (success) setNotice(success);
      board.reload();
    } catch (e) {
      setError(errMsg(e));
      if (e instanceof ApiError && e.code === "limit_reached") setPlanLink(true);
    }
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      await api("/api/tasks", "POST", { title, projectId, assigneeId, due });
      setTitle("");
      setDue("");
    });
  }

  async function breakDown(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    await run(async () => {
      const r = await api<{ created: number }>("/api/tasks/generate", "POST", { goal, projectId: goalProject });
      setGoal("");
      setNotice(`EverMind added ${r.created} tasks to your board.`);
      window.dispatchEvent(new Event(USAGE_EVENT));
    });
    setBusy(false);
  }

  const move = (t: Task, dir: -1 | 1) => {
    const next = COLUMNS[COLUMNS.findIndex((c) => c.id === t.status) + dir];
    if (next) void run(() => api(`/api/tasks/${t.id}`, "PATCH", { status: next.id }));
  };

  return (
    <PageShell title="Operations" subtitle="Your company's work in one board. Move tasks from to-do to done.">
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">
          {error}
          {planLink && <Link href="/settings" className="ml-2 font-medium underline">View plans</Link>}
        </p>
      )}
      {notice && <p className="mb-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-300">{notice}</p>}

      {editable && (
        <div className="mb-6 grid gap-4 xl:grid-cols-2">
          <form onSubmit={add} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <h3 className="text-[14px] font-semibold text-white">Add a task</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <input className={`${field} min-w-[200px] flex-1`} placeholder="What needs to be done?" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
              <select className={field} value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Project">
                <option value="">No project</option>
                {projects.map((p) => <option key={p.id} value={p.id} className="bg-[var(--card-bg)]">{p.name}</option>)}
              </select>
              <select className={field} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} aria-label="Assignee">
                <option value="">Unassigned</option>
                {people.map((p) => <option key={p.id} value={p.id} className="bg-[var(--card-bg)]">{p.name}</option>)}
              </select>
              <input className={field} type="date" value={due} min={today()} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
              <button className="rounded-lg bg-violet-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-violet-500">Add</button>
            </div>
          </form>

          <form onSubmit={breakDown} className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-4">
            <h3 className="flex items-center gap-2 text-[14px] font-semibold text-white">
              <Sparkles size={15} className="text-violet-300" /> Let EverMind plan it
            </h3>
            <p className="mt-1 text-[12px] text-white/55">Describe a goal and EverMind breaks it into tasks.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input className={`${field} min-w-[200px] flex-1`} placeholder="e.g. Launch our beta to 50 clinics" value={goal} onChange={(e) => setGoal(e.target.value)} required minLength={5} maxLength={1000} />
              <select className={field} value={goalProject} onChange={(e) => setGoalProject(e.target.value)} aria-label="Project for generated tasks">
                <option value="">No project</option>
                {projects.map((p) => <option key={p.id} value={p.id} className="bg-[var(--card-bg)]">{p.name}</option>)}
              </select>
              <button disabled={busy} className="rounded-lg bg-violet-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-60">
                {busy ? "Planning…" : "Break it down"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.id);
          return (
            <section key={col.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
              <h3 className="flex items-center gap-2 px-1 pb-3 pt-1 text-[13px] font-semibold text-white">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} /> {col.label}
                <span className="font-normal text-white/40">{items.length}</span>
              </h3>
              <ul className="space-y-2">
                {items.length === 0 && <li className="px-1 py-4 text-[12px] text-white/40">Nothing here.</li>}
                {items.map((t) => {
                  const overdue = t.due && t.status !== "done" && t.due < today();
                  return (
                    <li key={t.id} className="rounded-xl border border-white/[0.07] bg-[var(--card-bg)] p-3">
                      <p className="text-[13px] text-white">{t.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                        {t.projectName && <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-300">{t.projectName}</span>}
                        {t.assigneeName && <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">{t.assigneeName}</span>}
                        {t.due && <span className={`rounded-full px-2 py-0.5 ${overdue ? "bg-rose-500/15 text-rose-300" : "bg-white/10 text-white/60"}`}>{overdue ? "Overdue · " : "Due "}{t.due}</span>}
                      </div>
                      {editable && (
                        <div className="mt-2 flex items-center justify-between text-white/45">
                          <div className="flex gap-1">
                            <button aria-label="Move back" disabled={col.id === "todo"} onClick={() => move(t, -1)} className="rounded p-1 hover:bg-white/10 disabled:opacity-25"><ChevronLeft size={15} /></button>
                            <button aria-label="Move forward" disabled={col.id === "done"} onClick={() => move(t, 1)} className="rounded p-1 hover:bg-white/10 disabled:opacity-25"><ChevronRight size={15} /></button>
                          </div>
                          <button aria-label="Delete task" onClick={() => run(() => api(`/api/tasks/${t.id}`, "DELETE"))} className="rounded p-1 hover:text-rose-300"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
