import type { ObjectId } from "mongodb";
import { creditGrants, usage, type CompanyDoc } from "@/lib/db";

function addMonths(date: Date, n: number) {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

export interface UsageWindow {
  key: string;
  start: Date;
  end: Date;
}

/**
 * The month that credits are counted in. Paid companies count from the day their subscription
 * started (also for yearly plans, so the allowance still resets monthly); others use the calendar month.
 */
export function usageWindow(company: Pick<CompanyDoc, "billing">, now = new Date()): UsageWindow {
  const anchor = company.billing && company.billing.status !== "cancelled" ? company.billing.periodStart : undefined;
  if (!anchor) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return { key: start.toISOString().slice(0, 7), start, end: addMonths(start, 1) };
  }
  let k = 0;
  while (addMonths(anchor, k + 1) <= now) k++;
  const start = addMonths(anchor, k);
  return { key: start.toISOString().slice(0, 10), start, end: addMonths(anchor, k + 1) };
}

export const usageKey = (companyId: ObjectId, w: UsageWindow) => `${companyId.toString()}:${w.key}`;

/** Credits used in the current window. */
export async function creditsUsed(company: Pick<CompanyDoc, "billing"> & { _id: ObjectId }): Promise<number> {
  const doc = await (await usage()).findOne({ _id: usageKey(company._id, usageWindow(company)) });
  return doc?.credits ?? 0;
}

/** Unexpired credits left from packs and grants. */
export async function packBalance(companyId: ObjectId): Promise<number> {
  const [row] = await (await creditGrants())
    .aggregate<{ total: number }>([
      { $match: { companyId, remaining: { $gt: 0 }, expiresAt: { $gt: new Date() } } },
      { $group: { _id: null, total: { $sum: "$remaining" } } },
    ])
    .toArray();
  return row?.total ?? 0;
}

/** Takes credits from packs, the ones expiring soonest first. Returns how many were taken. */
export async function drawFromPacks(companyId: ObjectId, amount: number): Promise<number> {
  const col = await creditGrants();
  const grants = await col
    .find({ companyId, remaining: { $gt: 0 }, expiresAt: { $gt: new Date() } })
    .sort({ expiresAt: 1 })
    .toArray();
  let left = amount;
  for (const g of grants) {
    if (left <= 0) break;
    const take = Math.min(left, g.remaining);
    // Only take what is still there, in case another request used it in the meantime.
    const r = await col.updateOne({ _id: g._id, remaining: { $gte: take } }, { $inc: { remaining: -take } });
    if (r.modifiedCount) left -= take;
  }
  return amount - left;
}
