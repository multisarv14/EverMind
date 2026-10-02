"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, FolderKanban, ListChecks, MessageSquare, Plus, Sparkles } from "lucide-react";
import PageShell from "@/components/PageShell";
import { PROJECT_TEMPLATES } from "@/constants/projectTemplates";
import { api, errMsg } from "@/lib/client";
import { useApi, timeAgo, type Me } from "@/lib/useApi";

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  openTasks: number;
  doneTasks: number;
}

const field =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-violet-500/70";
const label = "mb-1.5 block text-[13px] font-medium text-white/75";
const hint = "mt-1 text-[12px] text-white/45";

export default function ProjectsPage() {
  const router = useRouter();
  const me = useApi<Me>("/api/auth/me").data;
  const list = useApi<{ projects: ProjectItem[] }>("/api/projects");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWelcome(new URLSearchParams(window.location.search).has("welcome")), 0);
    return () => clearTimeout(t);
  }, []);

  const canCreate = me?.can.createProject ?? false;
  const projects = list.data?.projects ?? [];
  const empty = list.data !== null && projects.length === 0;
  const showForm = open || (empty && canCreate);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await api<{ id: string }>("/api/projects", "POST", { name, description, instructions });
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <PageShell title="Projects" subtitle="A project is a workspace for one goal, like a launch, a fundraise or a hiring plan.">
      {welcome && me && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/[0.08] p-5">
          <Sparkles className="mt-0.5 shrink-0 text-violet-300" size={20} />
          <div>
            <p className="text-[15px] font-semibold text-white">Welcome to EverMind, {me.user.name.split(" ")[0]}!</p>
            <p className="mt-1 text-[13px] text-white/65">Start by creating your first project below. Pick a ready-made one or start from scratch.</p>
          </div>
        </div>
      )}

      {/* What a project is */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: MessageSquare, title: "Chats with context", text: "Every chat in a project follows the instructions you write for it." },
          { icon: ListChecks, title: "Tasks in one place", text: "Add tasks to a project and see how much is done." },
          { icon: Sparkles, title: "EverMind remembers", text: "No need to explain the goal again in every conversation." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><Icon size={17} /></span>
            <div>
              <p className="text-[13px] font-semibold text-white">{title}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-white/55">{text}</p>
            </div>
          </div>
        ))}
      </div>

      {canCreate && !showForm && (
        <button onClick={() => setOpen(true)} className="mb-5 flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500">
          <Plus size={16} /> New project
        </button>
      )}

      {showForm && (
        <form onSubmit={create} className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <h3 className="text-[16px] font-semibold text-white">Create a project</h3>

          <p className="mb-2 mt-4 text-[12px] uppercase tracking-wide text-white/40">Start from</p>
          <div className="flex flex-wrap gap-2">
            {PROJECT_TEMPLATES.map((t) => (
              <button
                type="button"
                key={t.label}
                onClick={() => { setName(t.name); setDescription(t.description); setInstructions(t.instructions); }}
                className="rounded-full border border-white/10 px-3.5 py-1.5 text-[13px] text-white/75 transition hover:border-violet-500/50 hover:text-white"
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="pname" className={label}>Project name</label>
              <input id="pname" className={field} placeholder="e.g. Q4 product launch" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
            </div>
            <div>
              <label htmlFor="pdesc" className={label}>What is it about? <span className="text-white/40">(optional)</span></label>
              <input id="pdesc" className={field} placeholder="One line so your team knows what this project is" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </div>
            <div>
              <label htmlFor="pins" className={label}>Instructions for EverMind <span className="text-white/40">(optional)</span></label>
              <textarea id="pins" className={`${field} resize-none`} rows={5} maxLength={4000} placeholder="Goal, audience, tone, things to avoid…" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
              <p className={hint}>EverMind follows these in every chat inside this project. You can change them anytime.</p>
            </div>
          </div>

          {error && <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-[13px] text-rose-300">{error}</p>}
          <div className="mt-5 flex gap-2">
            <button disabled={busy} className="rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-60">{busy ? "Creating…" : "Create project"}</button>
            {!empty && <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-white/10 px-5 py-2.5 text-[13px] text-white/75 hover:bg-white/5">Cancel</button>}
          </div>
        </form>
      )}

      {empty && !canCreate && <p className="text-[13px] text-white/60">No projects yet. Ask an admin to create one.</p>}

      {projects.length > 0 && <h3 className="mb-3 text-[14px] font-semibold text-white">Your projects</h3>}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => {
          const total = p.openTasks + p.doneTasks;
          const pct = total ? Math.round((p.doneTasks / total) * 100) : 0;
          return (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`} className="block h-full rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-violet-500/40">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><FolderKanban size={18} /></span>
                <p className="mt-3 truncate text-[15px] font-semibold text-white">{p.name}</p>
                <p className="mt-1 line-clamp-2 min-h-[2.4em] text-[12px] text-white/55">{p.description || "No description yet"}</p>
                <div className="mt-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/45">
                    <CheckCircle2 size={12} />
                    {total === 0 ? "No tasks yet" : `${p.doneTasks} of ${total} tasks done`}
                    <span className="ml-auto">Updated {timeAgo(p.updatedAt)}</span>
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
