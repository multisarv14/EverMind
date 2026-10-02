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

  const { used, limit } = data.usage;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const full = used >= limit;

  return (
    <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-white">{data.plan.name} plan</span>
        <span className={full ? "text-rose-300" : "text-white/55"}>
          {formatTokens(used)} / {formatTokens(limit)} tokens
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${full ? "bg-rose-400" : pct > 80 ? "bg-amber-400" : "bg-violet-500"}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      {data.plan.id === "free" && (
        <Link href="/settings" className="mt-2 block text-[12px] font-medium text-violet-300 hover:underline">
          {full ? "Limit reached — upgrade" : "Upgrade for more"}
        </Link>
      )}
    </div>
  );
}
