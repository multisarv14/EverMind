import { companies, findAll, payments, usageEvents, type Id } from "@/lib/db";

const USD_TO_INR = Number(process.env.USD_TO_INR ?? 88);

/** "YYYY-MM" for the current month, or the given one when it is valid. */
export function monthOf(value: string | null | undefined): string {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : new Date().toISOString().slice(0, 7);
}

function monthRange(month: string) {
  const from = new Date(`${month}-01T00:00:00Z`);
  const to = new Date(from);
  to.setUTCMonth(to.getUTCMonth() + 1);
  return { from, to };
}

export interface ReportRow {
  companyId: Id;
  company: string;
  plan: string;
  calls: number;
  credits: number;
  aiCostInr: number;
  revenueInr: number;
  marginInr: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** AI cost vs revenue per company for one calendar month (same numbers as scripts/billing-admin.mjs report). */
export async function monthReport(month: string): Promise<{ month: string; usdToInr: number; rows: ReportRow[] }> {
  const { from, to } = monthRange(month);
  const [events, paid, list] = await Promise.all([
    findAll(usageEvents().where("createdAt", ">=", from).where("createdAt", "<", to)),
    findAll(payments().where("createdAt", ">=", from).where("createdAt", "<", to)),
    findAll(companies()),
  ]);

  const byId = new Map(list.map((c) => [c._id, c]));
  const rows = new Map<Id, ReportRow>();
  const row = (companyId: Id) => {
    let r = rows.get(companyId);
    if (!r) {
      const c = byId.get(companyId);
      r = { companyId, company: c?.name ?? companyId, plan: c?.plan ?? "?", calls: 0, credits: 0, aiCostInr: 0, revenueInr: 0, marginInr: 0 };
      rows.set(companyId, r);
    }
    return r;
  };

  for (const e of events) {
    const r = row(e.companyId);
    r.calls++;
    r.credits += e.credits ?? 0;
    r.aiCostInr += ((e.costMicros ?? 0) / 1e6) * USD_TO_INR;
  }
  // Payments are in paise and include 18% GST, which is not revenue.
  for (const p of paid) if (p.status === "captured") row(p.companyId).revenueInr += p.amount / 100 / 1.18;

  const result = [...rows.values()].map((r) => ({
    ...r,
    aiCostInr: round2(r.aiCostInr),
    revenueInr: round2(r.revenueInr),
    marginInr: round2(r.revenueInr - r.aiCostInr),
  }));
  result.sort((a, b) => b.aiCostInr - a.aiCostInr);
  return { month, usdToInr: USD_TO_INR, rows: result };
}
