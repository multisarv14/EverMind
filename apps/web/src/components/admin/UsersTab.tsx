"use client";

import { useState } from "react";
import { api, errMsg } from "@/lib/client";
import { useApi, type Role } from "@/lib/useApi";
import { ROLE_LABEL } from "@/constants/team";
import { Loading, Notice, Table, formatDate, ghostButton, input } from "@/components/admin/ui";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role | null;
  company: string | null;
  platformAdmin: boolean;
  createdAt: string;
  passwordChangedAt: string | null;
}

export default function UsersTab() {
  const { data, error } = useApi<{ users: User[]; truncated: boolean }>("/api/admin/users");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string; link?: string } | null>(null);

  if (!data) return <Loading error={error} />;

  const needle = q.trim().toLowerCase();
  const rows = needle
    ? data.users.filter((u) => [u.name, u.email, u.company ?? ""].some((v) => v.toLowerCase().includes(needle)))
    : data.users;

  async function reset(u: User) {
    if (!confirm(`Send a password reset link to ${u.email}?`)) return;
    setBusy(u.id);
    setMsg(null);
    try {
      const r = await api<{ link: string; emailed: boolean }>(`/api/admin/users/${u.id}/reset`, "POST");
      setMsg(
        r.emailed
          ? { kind: "ok", text: `Reset link emailed to ${u.email}. It works once, for 1 hour.` }
          : { kind: "error", text: `Email isn't working, so nothing was sent. Share this link with ${u.email} yourself (works once, for 1 hour):`, link: r.link }
      );
    } catch (e) {
      setMsg({ kind: "error", text: errMsg(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {msg && (
        <Notice kind={msg.kind}>
          {msg.text}
          {msg.link && (
            <>
              <br />
              <code className="mt-2 block select-all break-all rounded bg-black/30 px-2 py-1 text-[12px] text-white/85">{msg.link}</code>
            </>
          )}
        </Notice>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or company" className={`${input} w-full sm:w-80`} />
        <p className="text-[12px] text-white/50">
          {rows.length} of {data.users.length} users{data.truncated ? " (newest 1000 shown)" : ""}
        </p>
      </div>

      <Table head={["Name", "Email", "Company", "Role", "Joined", "Password changed", ""]}>
        {rows.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3 font-medium text-white">
              {u.name}
              {u.platformAdmin && <span className="ml-2 rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-200">Admin</span>}
            </td>
            <td className="px-4 py-3 break-all">{u.email}</td>
            <td className="px-4 py-3">{u.company ?? "—"}</td>
            <td className="px-4 py-3">{u.role ? ROLE_LABEL[u.role] : "—"}</td>
            <td className="px-4 py-3 whitespace-nowrap">{formatDate(u.createdAt)}</td>
            <td className="px-4 py-3 whitespace-nowrap">{formatDate(u.passwordChangedAt)}</td>
            <td className="px-4 py-3 text-right">
              <button onClick={() => reset(u)} disabled={busy === u.id} className={`${ghostButton} whitespace-nowrap`}>
                {busy === u.id ? "Sending…" : "Send reset link"}
              </button>
            </td>
          </tr>
        ))}
      </Table>
      {rows.length === 0 && <p className="py-8 text-center text-[13px] text-white/50">No users match.</p>}
    </div>
  );
}
