"use client";

import { formatInr, useApi } from "@/lib/useApi";
import { Loading, Stat } from "@/components/admin/ui";

interface Overview {
  companies: number;
  users: number;
  plans: { free: number; pro: number; business: number };
  upgradeRequests: number;
  month: { month: string; calls: number; credits: number; aiCostInr: number; revenueInr: number };
}

export default function OverviewTab({ onOpenRequests }: { onOpenRequests: () => void }) {
  const { data, error } = useApi<Overview>("/api/admin/overview");
  if (!data) return <Loading error={error} />;

  const m = data.month;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Companies" value={data.companies.toLocaleString()} hint={`${data.plans.pro} Pro · ${data.plans.business} Business · ${data.plans.free} Free`} />
        <Stat label="Users" value={data.users.toLocaleString()} />
        <Stat label="Upgrade requests" value={data.upgradeRequests} hint={data.upgradeRequests ? "Waiting for a reply" : "None open"} />
        <Stat label="AI calls this month" value={m.calls.toLocaleString()} hint={`${m.credits.toLocaleString()} credits used`} />
      </div>

      <div>
        <h2 className="mb-3 text-[15px] font-semibold text-white">This month ({m.month})</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Revenue" value={formatInr(m.revenueInr)} hint="Captured payments, excluding GST" />
          <Stat label="AI cost" value={formatInr(m.aiCostInr)} hint="Our cost from the AI provider" />
          <Stat label="Margin" value={formatInr(Math.round((m.revenueInr - m.aiCostInr) * 100) / 100)} />
        </div>
      </div>

      {data.upgradeRequests > 0 && (
        <button onClick={onOpenRequests} className="text-[13px] text-violet-300 hover:text-violet-200">
          Review {data.upgradeRequests} upgrade request{data.upgradeRequests === 1 ? "" : "s"} →
        </button>
      )}
    </div>
  );
}
