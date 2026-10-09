"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useApi, formatTokens, type Me } from "@/lib/useApi";

export const USAGE_EVENT = "evermind:usage-changed";

export default function PlanMeter() {
  const { data, reload } = useApi<Me>("/api/auth/me");

  useEffect(() => {
    window.addEventListener(USAGE_EVENT, reload);
    return () => window.removeEventListener(USAGE_EVENT, reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return <div className="mt-3 h-[74px] rounded-2xl border border-white/[0.08] bg-white/[0.03]" />;

  const { used, limit, packBalance } = data.usage;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const full = used >= limit;
  const stopped = full && packBalance <= 0;

  return (
    <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-white">{data.plan.name} plan</span>
        <span className={stopped ? "text-rose-300" : "text-white/55"}>
          {formatTokens(used)} / {formatTokens(limit)} credits
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${full ? "bg-rose-400" : pct > 80 ? "bg-amber-400" : "bg-violet-500"}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      {packBalance > 0 && <p className="mt-1.5 text-[11px] text-white/50">+ {formatTokens(packBalance)} pack credits</p>}
      {(data.plan.id === "free" || stopped || pct > 80) && (
        <Link href="/settings?tab=plan" className="mt-2 block text-[12px] font-medium text-violet-300 hover:underline">
          {stopped ? (data.plan.topUps ? "Credits used up — buy more" : "Limit reached — upgrade") : data.plan.topUps ? "Buy extra credits" : "Upgrade for more"}
        </Link>
      )}
    </div>
  );
}
