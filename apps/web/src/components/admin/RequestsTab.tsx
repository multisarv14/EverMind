"use client";

import { useState } from "react";
import { api, errMsg } from "@/lib/client";
import { useApi } from "@/lib/useApi";
import { EmptyState } from "@/components/PageShell";
import { Loading, Notice, button, card, formatDate, ghostButton } from "@/components/admin/ui";

interface Request {
  id: string;
  companyId: string;
  company: string;
  currentPlan: string | null;
  plan: string;
  note: string;
  requestedBy: { name: string; email: string } | null;
  createdAt: string;
}

export default function RequestsTab() {
  const { data, error, reload } = useApi<{ requests: Request[] }>("/api/admin/upgrade-requests");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  if (!data) return <Loading error={error} />;

  async function run(r: Request, approve: boolean) {
    const question = approve ? `Move ${r.company} to ${r.plan}? No payment is taken.` : `Dismiss ${r.company}'s request? Their plan stays as it is.`;
    if (!confirm(question)) return;
    setBusy(r.id);
    setMsg(null);
    try {
      if (approve) {
        const res = await api<{ warning: string | null }>(`/api/admin/companies/${r.companyId}`, "PATCH", { plan: r.plan });
        setMsg({ kind: "ok", text: `${r.company} is now on ${r.plan}.${res.warning ? ` ${res.warning}` : ""}` });
      } else {
        await api(`/api/admin/upgrade-requests/${r.id}`, "DELETE");
        setMsg({ kind: "ok", text: `Dismissed ${r.company}'s request.` });
      }
      reload();
    } catch (e) {
      setMsg({ kind: "error", text: errMsg(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {data.requests.length === 0 ? (
        <EmptyState title="No open requests" text="When a company owner asks for Pro or Business, the request shows up here." />
      ) : (
        <ul className="space-y-3">
          {data.requests.map((r) => (
            <li key={r.id} className={`${card} flex flex-wrap items-start justify-between gap-4 p-5`}>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-white">
                  {r.company} <span className="font-normal text-white/50">wants</span> <span className="capitalize text-violet-300">{r.plan}</span>
                </p>
                <p className="mt-1 break-all text-[12px] text-white/50">
                  Now on {r.currentPlan ?? "?"} · asked by {r.requestedBy ? `${r.requestedBy.name} (${r.requestedBy.email})` : "a removed user"} · {formatDate(r.createdAt)}
                </p>
                {r.note && <p className="mt-2 whitespace-pre-wrap text-[13px] text-white/75">“{r.note}”</p>}
              </div>
              <div className="flex gap-2">
                <button disabled={busy === r.id} onClick={() => run(r, false)} className={ghostButton}>
                  Dismiss
                </button>
                <button disabled={busy === r.id} onClick={() => run(r, true)} className={button}>
                  Approve
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
