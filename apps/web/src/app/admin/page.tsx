"use client";

import { useState } from "react";
import PageShell from "@/components/PageShell";
import OverviewTab from "@/components/admin/OverviewTab";
import CompaniesTab from "@/components/admin/CompaniesTab";
import UsersTab from "@/components/admin/UsersTab";
import RequestsTab from "@/components/admin/RequestsTab";
import RevenueTab from "@/components/admin/RevenueTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "companies", label: "Companies" },
  { id: "users", label: "Users" },
  { id: "requests", label: "Upgrade requests" },
  { id: "revenue", label: "Revenue" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <PageShell title="Admin" subtitle="Every company and user on EverMind. Only the EverMind team can see this page.">
      <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto border-b border-white/[0.07]">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-[14px] transition ${
              tab === t.id ? "border-violet-400 text-white" : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab onOpenRequests={() => setTab("requests")} />}
      {tab === "companies" && <CompaniesTab />}
      {tab === "users" && <UsersTab />}
      {tab === "requests" && <RequestsTab />}
      {tab === "revenue" && <RevenueTab />}
    </PageShell>
  );
}
