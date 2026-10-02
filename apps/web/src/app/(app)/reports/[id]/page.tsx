"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import Markdown from "@/components/Markdown";
import { api } from "@/lib/client";
import { useApi, type Me } from "@/lib/useApi";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const me = useApi<Me>("/api/auth/me").data;
  const { data: report, error } = useApi<{ title: string; body: string }>(`/api/reports/${id}`);

  if (error) {
    return (
      <PageShell title="Report not found" subtitle="It may have been deleted.">
        <Link href="/reports" className="text-[13px] text-violet-300 hover:underline">← All reports</Link>
      </PageShell>
    );
  }
  if (!report) return <PageShell title="Report" subtitle=""><p className="text-[13px] text-white/60">Loading…</p></PageShell>;

  function download() {
    const url = URL.createObjectURL(new Blob([report!.body], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report!.title.replace(/[^\w-]+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell title="Report" subtitle={report.title}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/reports" className="inline-flex items-center gap-1.5 text-[13px] text-white/55 hover:text-white"><ArrowLeft size={14} /> All reports</Link>
        <div className="flex items-center gap-2">
          <button onClick={download} className="flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-[13px] text-white/80 hover:bg-white/5"><Download size={15} /> Download</button>
          {me?.can.createProject && (
            <button onClick={async () => { await api(`/api/reports/${id}`, "DELETE"); router.push("/reports"); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-white/45 hover:text-rose-300"><Trash2 size={15} /> Delete</button>
          )}
        </div>
      </div>
      <article className="max-w-[820px] rounded-2xl border border-white/[0.07] bg-white/[0.025] p-7">
        <Markdown>{report.body}</Markdown>
      </article>
    </PageShell>
  );
}
