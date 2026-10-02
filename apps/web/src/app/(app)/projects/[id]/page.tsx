"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, MessageSquarePlus, Trash2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import { useApi, timeAgo, type Me } from "@/lib/useApi";

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  instructions: string;
  editable: boolean;
  conversations: { id: string; title: string; updatedAt: string }[];
}

const input =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-violet-500/70";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const me = useApi<Me>("/api/auth/me").data;
  const { data: project, error, reload } = useApi<ProjectDetail>(`/api/projects/${id}`);
  const [draft, setDraft] = useState<{ name: string; description: string; instructions: string } | null>(null);
  const [message, setMessage] = useState("");

  if (error) {
    return (
      <PageShell title="Project not found" subtitle="It may have been deleted.">
        <Link href="/projects" className="text-[13px] text-violet-300 hover:underline">← Back to projects</Link>
      </PageShell>
    );
  }
  if (!project) {
    return (
      <PageShell title="Project" subtitle="">
        <p className="text-[13px] text-white/60">Loading…</p>
      </PageShell>
    );
  }

  const form = draft ?? { name: project.name, description: project.description, instructions: project.instructions };
  const dirty = draft !== null;
  const canChat = me?.can.chat ?? false;

  async function save() {
    setMessage("");
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMessage(data.error ?? "Something went wrong.");
    setDraft(null);
    setMessage("Saved.");
    reload();
  }

  async function remove() {
    if (!window.confirm("Delete this project? Its conversations are kept but removed from the project.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/projects");
  }

  return (
    <PageShell title={project.name} subtitle={project.description || "Project"}>
      <Link href="/projects" className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-white/55 hover:text-white">
        <ArrowLeft size={14} /> All projects
      </Link>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-white">Conversations</h3>
            {canChat && (
              <Link
                href={`/chat?project=${project.id}`}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-violet-500"
              >
                <MessageSquarePlus size={15} /> New chat
              </Link>
            )}
          </div>
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {project.conversations.length === 0 && (
              <li className="py-4 text-[13px] text-white/50">No conversations in this project yet.</li>
            )}
            {project.conversations.map((c) => (
              <li key={c.id}>
                <Link href={`/chat/${c.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                  <span className="truncate text-[13px] text-white">{c.title}</span>
                  <span className="shrink-0 text-[11px] text-white/45">{timeAgo(c.updatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <h3 className="text-[15px] font-semibold text-white">Project settings</h3>
          <div className="mt-3 space-y-3">
            <input className={input} value={form.name} disabled={!project.editable} maxLength={80}
              onChange={(e) => setDraft({ ...form, name: e.target.value })} aria-label="Project name" />
            <input className={input} value={form.description} disabled={!project.editable} maxLength={500} placeholder="Description"
              onChange={(e) => setDraft({ ...form, description: e.target.value })} aria-label="Description" />
            <textarea className={`${input} resize-none`} rows={6} value={form.instructions} disabled={!project.editable} maxLength={4000}
              placeholder="Instructions EverMind follows in every conversation in this project…"
              onChange={(e) => setDraft({ ...form, instructions: e.target.value })} aria-label="Instructions" />
            {message && <p className="text-[12px] text-white/60">{message}</p>}
            {project.editable && (
              <div className="flex items-center justify-between">
                <button onClick={save} disabled={!dirty}
                  className="rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-40">
                  Save changes
                </button>
                <button onClick={remove} className="flex items-center gap-1.5 text-[13px] text-white/45 hover:text-rose-300">
                  <Trash2 size={15} /> Delete project
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
