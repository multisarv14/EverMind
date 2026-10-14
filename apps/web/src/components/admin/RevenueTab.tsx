"use client";

import { useState } from "react";
import { formatInr, useApi } from "@/lib/useApi";
import { Loading, Stat, Table, input } from "@/components/admin/ui";

interface Report {
  month: string;
  usdToInr: number;
  rows: { companyId: string; company: string; plan: string; calls: number; credits: number; aiCostInr: number; revenueInr: number; marginInr: number }[];
}

export default function RevenueTab() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { data, error } = useApi<Report>(`/api/admin/report?month=${month}`);

  const total = (k: "aiCostInr" | "revenueInr" | "marginInr") => Math.round((data?.rows ?? []).reduce((s, r) => s + r[k], 0) * 100) / 100;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-[13px] text-white/60" htmlFor="report-month">
          Month
        </label>
        <input id="report-month" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className={input} />
        {data && <p className="text-[12px] text-white/45">1 USD = ₹{data.usdToInr} · revenue excludes GST</p>}
      </div>

      {!data || data.month !== month ? (
        <Loading error={error} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Revenue" value={formatInr(total("revenueInr"))} />
            <Stat label="AI cost" value={formatInr(total("aiCostInr"))} hint="Compare with the AI provider's bill" />
            <Stat label="Margin" value={formatInr(total("marginInr"))} />
          </div>

          {data.rows.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-white/50">No AI use or payments in {month}.</p>
          ) : (
            <Table head={["Company", "Plan", "AI calls", "Credits", "AI cost", "Revenue", "Margin"]}>
              {data.rows.map((r) => (
                <tr key={r.companyId}>
                  <td className="px-4 py-3 font-medium text-white">{r.company}</td>
                  <td className="px-4 py-3 capitalize">{r.plan}</td>
                  <td className="px-4 py-3">{r.calls.toLocaleString()}</td>
                  <td className="px-4 py-3">{r.credits.toLocaleString()}</td>
                  <td className="px-4 py-3">{formatInr(r.aiCostInr)}</td>
                  <td className="px-4 py-3">{formatInr(r.revenueInr)}</td>
                  <td className={`px-4 py-3 ${r.marginInr < 0 ? "text-rose-300" : "text-emerald-300"}`}>{formatInr(r.marginInr)}</td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  );
}
