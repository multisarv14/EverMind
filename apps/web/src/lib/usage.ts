import { creditGrants, findAll, findById, firestore, key, usage, type CompanyDoc, type Id } from "@/lib/db";

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

export const usageKey = (companyId: Id, w: UsageWindow) => key(companyId, w.key);

/** Credits used in the current window. */
export async function creditsUsed(company: Pick<CompanyDoc, "billing"> & { _id: Id }): Promise<number> {
  const doc = await findById(usage(), usageKey(company._id, usageWindow(company)));
  return doc?.credits ?? 0;
}

/** A company's unexpired grants, the ones expiring soonest first. Few per company, so `remaining > 0` is checked here. */
const liveGrants = (companyId: Id) =>
  creditGrants().where("companyId", "==", companyId).where("expiresAt", ">", new Date()).orderBy("expiresAt");

/** Unexpired credits left from packs and grants. */
export async function packBalance(companyId: Id): Promise<number> {
  const grants = await findAll(liveGrants(companyId));
  return grants.reduce((total, g) => total + Math.max(0, g.remaining), 0);
}

/** Takes credits from packs, the ones expiring soonest first. Returns how many were taken. */
export async function drawFromPacks(companyId: Id, amount: number): Promise<number> {
  // One transaction, so two requests drawing at once can't both take the same credits.
  return firestore().runTransaction(async (tx) => {
    const grants = (await tx.get(liveGrants(companyId))).docs;
    let left = amount;
    for (const g of grants) {
      if (left <= 0) break;
      const take = Math.min(left, g.data().remaining);
      if (take <= 0) continue;
      tx.update(g.ref, { remaining: g.data().remaining - take });
      left -= take;
    }
    return amount - left;
  });
}
