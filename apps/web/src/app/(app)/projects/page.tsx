"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { FolderKanban, Plus, Sparkles } from "lucide-react";
import PageShell from "@/components/PageShell";
import { useApi, timeAgo, type Me } from "@/lib/useApi";

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
}

const input =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-violet-500/70";

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
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, instructions }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <PageShell title="Projects" subtitle="Organise your company's work. Each project can give EverMind its own instructions.">
      {welcome && me && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/[0.08] p-5">
          <Sparkles className="mt-0.5 shrink-0 text-violet-300" size={20} />
          <div>
            <p className="text-[15px] font-semibold text-white">Welcome to EverMind, {me.user.name.split(" ")[0]}!</p>
            <p className="mt-1 text-[13px] text-white/65">
              Start by creating your first project — for example a product launch, a fundraise or a hiring plan.
              EverMind will work inside it and remember the context.
            </p>
          </div>
        </div>
      )}

      {canCreate && !showForm && (
        <button
          onClick={() => setOpen(true)}
          className="mb-5 flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500"
        >
          <Plus size={16} /> New project
        </button>
      )}

      {showForm && (
        <form onSubmit={create} className="mb-6 space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <h3 className="text-[15px] font-semibold text-white">Create a project</h3>
          <input className={input} placeholder="Project name (e.g. Q4 product launch)" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
          <input className={input} placeholder="Short description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          <textarea
            className={`${input} resize-none`}
            rows={3}
            maxLength={4000}
            placeholder="Instructions for EverMind (optional) — goals, audience, tone, constraints…"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
          {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-[13px] text-rose-300">{error}</p>}
          <div className="flex gap-2">
            <button disabled={busy} className="rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-60">
              {busy ? "Creating…" : "Create project"}
            </button>
            {!empty && (
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-white/10 px-5 py-2.5 text-[13px] text-white/75 hover:bg-white/5">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {empty && !canCreate && (
        <p className="text-[13px] text-white/60">No projects yet. Ask an admin to create one.</p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/projects/${p.id}`}
              className="block h-full rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-violet-500/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                <FolderKanban size={18} />
              </span>
              <p className="mt-3 truncate text-[15px] font-semibold text-white">{p.name}</p>
              <p className="mt-1 line-clamp-2 text-[12px] text-white/55">{p.description || "No description"}</p>
              <p className="mt-3 text-[11px] text-white/40">Updated {timeAgo(p.updatedAt)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
