"use client";

import { useState, type FormEvent } from "react";
import { Check, Minus, Trash2, UserPlus, X } from "lucide-react";
import PageShell from "@/components/PageShell";
import { useApi, type Me, type Role } from "@/lib/useApi";
import { PERMISSION_ROWS, ROLE_LABEL, can } from "@/constants/team";

interface Team {
  me: string;
  members: { id: string; name: string; email: string; role: Role }[];
  invites: { id: string; email: string; role: Exclude<Role, "owner"> }[];
  seats: { used: number; max: number };
}

const card = "rounded-2xl border border-white/[0.07] bg-white/[0.025]";
const select =
  "rounded-lg border border-white/10 bg-[var(--card-bg)] px-2.5 py-1.5 text-[13px] text-white outline-none focus:border-violet-500/70";

export default function PeoplePage() {
  const me = useApi<Me>("/api/auth/me").data;
  const team = useApi<Team>("/api/team");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const manage = me?.can.manageTeam ?? false;
  const isOwner = me?.role === "owner";

  async function call(url: string, init: RequestInit) {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
    return data;
  }

  async function invite(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await call("/api/team/invites", { method: "POST", body: JSON.stringify({ email, role }) });
      setNotice(`${email} can now sign up with this email to join your company.`);
      setEmail("");
      team.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function act(run: () => Promise<unknown>) {
    setError("");
    setNotice("");
    try {
      await run();
      team.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const t = team.data;
  const assignable: Exclude<Role, "owner">[] = isOwner ? ["admin", "member", "viewer"] : ["member", "viewer"];

  return (
    <PageShell title="People" subtitle="Your team and what each person can do">
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">
          {error}
        </p>
      )}
      {notice && <p className="mb-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-300">{notice}</p>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          {manage && (
            <form onSubmit={invite} className={`${card} p-5`}>
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-white">Invite a teammate</h3>
                {t && (
                  <span className="text-[12px] text-white/50">
                    {t.seats.used} of {t.seats.max} seats used
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-violet-500/70"
                />
                <select value={role} onChange={(e) => setRole(e.target.value)} className={select} aria-label="Role">
                  {assignable.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
                <button
                  disabled={busy}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-violet-500 disabled:opacity-60"
                >
                  <UserPlus size={15} /> Invite
                </button>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-white/45">
                We don&apos;t send emails yet. Tell your teammate to open EverMind, choose{" "}
                <span className="text-white/70">&ldquo;Join with your email&rdquo;</span> on the sign-up page and use this exact email.
              </p>
            </form>
          )}

          <div className={`${card} p-5`}>
            <h3 className="text-[15px] font-semibold text-white">Members</h3>
            <ul className="mt-3 divide-y divide-white/[0.06]">
              {!t && <li className="py-3 text-[13px] text-white/50">Loading…</li>}
              {t?.members.map((m) => {
                const self = m.id === t.me;
                const locked = !manage || m.role === "owner" || self || (m.role === "admin" && !isOwner);
                return (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600/30 text-[14px] font-semibold text-white">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-white">
                        {m.name} {self && <span className="text-white/40">(you)</span>}
                      </p>
                      <p className="truncate text-[12px] text-white/50">{m.email}</p>
                    </div>
                    {locked ? (
                      <span className="rounded-full bg-white/[0.07] px-3 py-1 text-[12px] text-white/75">{ROLE_LABEL[m.role]}</span>
                    ) : (
                      <>
                        <select
                          value={m.role}
                          aria-label={`Role for ${m.name}`}
                          onChange={(e) =>
                            act(() => call(`/api/team/members/${m.id}`, { method: "PATCH", body: JSON.stringify({ role: e.target.value }) }))
                          }
                          className={select}
                        >
                          {assignable.map((r) => (
                            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                          ))}
                        </select>
                        <button
                          aria-label={`Remove ${m.name}`}
                          title="Remove from company"
                          onClick={() => {
                            if (window.confirm(`Remove ${m.name}? Their account and conversations will be deleted.`)) {
                              void act(() => call(`/api/team/members/${m.id}`, { method: "DELETE" }));
                            }
                          }}
                          className="text-white/40 hover:text-rose-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {manage && t && t.invites.length > 0 && (
            <div className={`${card} p-5`}>
              <h3 className="text-[15px] font-semibold text-white">Pending invitations</h3>
              <ul className="mt-3 divide-y divide-white/[0.06]">
                {t.invites.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-3">
                    <p className="min-w-0 flex-1 truncate text-[13px] text-white">{i.email}</p>
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[12px] text-amber-300">
                      Invited as {ROLE_LABEL[i.role]}
                    </span>
                    <button
                      aria-label={`Cancel invite for ${i.email}`}
                      onClick={() => act(() => call(`/api/team/invites/${i.id}`, { method: "DELETE" }))}
                      className="text-white/40 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={`${card} h-fit overflow-hidden`}>
          <div className="px-5 pt-5">
            <h3 className="text-[15px] font-semibold text-white">Permissions</h3>
            <p className="mt-1 text-[12px] text-white/50">What each role can do</p>
          </div>
          <table className="mt-4 w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.07] text-white/45">
                <th className="px-5 py-2 font-medium" />
                {(["owner", "admin", "member", "viewer"] as Role[]).map((r) => (
                  <th key={r} className="px-2 py-2 text-center font-medium">{ROLE_LABEL[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_ROWS.map((row) => (
                <tr key={row.action} className="border-b border-white/[0.05] last:border-b-0">
                  <td className="px-5 py-2.5 text-white/80">{row.label}</td>
                  {(["owner", "admin", "member", "viewer"] as Role[]).map((r) => (
                    <td key={r} className="px-2 py-2.5 text-center">
                      {can(r, row.action) ? (
                        <Check size={15} className="mx-auto text-emerald-400" />
                      ) : (
                        <Minus size={15} className="mx-auto text-white/25" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-5 py-4 text-[11px] leading-relaxed text-white/40">
            Viewers are read-only. Only the owner can grant admin access or change the plan.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
