"use client";

import { useEffect, useState } from "react";

/** Fetches JSON from our own API once on mount. `data` is null until loaded or on failure. */
export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: T) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [url, tick]);

  return { data, error, loading: data === null && !error, reload: () => setTick((t) => t + 1) };
}

export type Role = "owner" | "admin" | "member" | "viewer";

export interface PlanInfo {
  id: string;
  name: string;
  monthlyTokens: number;
  seats: number;
  blurb: string;
}

export interface Me {
  user: { name: string; email: string };
  company: { name: string; teamSize: string };
  role: Role;
  can: { chat: boolean; createProject: boolean; manageTeam: boolean; manageBilling: boolean };
  plan: { id: string; name: string; seats: number };
  usage: { used: number; limit: number };
  upgradeRequested: boolean;
  plans: PlanInfo[];
}

export const formatTokens = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);

export interface ConversationSummary {
  id: string;
  agent?: string | null;
  projectId?: string | null;
  title: string;
  updatedAt: string;
  preview: string;
}

export function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
