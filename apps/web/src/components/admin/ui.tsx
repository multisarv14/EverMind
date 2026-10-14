"use client";

import type { ReactNode } from "react";

export const card = "rounded-2xl border border-white/[0.07] bg-white/[0.025]";
export const input =
  "rounded-lg border border-white/10 bg-[var(--card-bg)] px-2.5 py-1.5 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-violet-500/70";
export const button =
  "rounded-lg bg-violet-600 px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-violet-500 disabled:opacity-50";
export const ghostButton =
  "rounded-lg border border-white/10 px-3 py-1.5 text-[13px] text-white/80 transition hover:bg-white/5 disabled:opacity-50";

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className={`${card} px-5 py-4`}>
      <p className="text-[12px] uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1.5 text-[24px] font-semibold text-white">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-white/50">{hint}</p>}
    </div>
  );
}

/** A horizontally scrollable table, so wide rows never push the page sideways on phones. */
export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className={`${card} overflow-x-auto`}>
      <table className="w-full min-w-[720px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-white/[0.07] text-[12px] uppercase tracking-wide text-white/45">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05] text-white/80">{children}</tbody>
      </table>
    </div>
  );
}

export function Notice({ kind, children }: { kind: "error" | "ok"; children: ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`mb-4 break-words rounded-xl px-4 py-3 text-[13px] ${kind === "error" ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300"}`}
    >
      {children}
    </p>
  );
}

export function Loading({ error }: { error: boolean }) {
  return <p className="py-10 text-center text-[13px] text-white/50">{error ? "Couldn't load this. Try reloading the page." : "Loading…"}</p>;
}
