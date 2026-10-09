import type { ObjectId } from "mongodb";
import { dailyUsage, usage, usageEvents, users, type CompanyRecord } from "@/lib/db";
import { PLANS, planOf, type Plan } from "@/lib/plans";
import { costMicros, creditsFor, type TokenUsage } from "@/lib/pricing";
import { creditsUsed, drawFromPacks, packBalance, usageKey, usageWindow, type UsageWindow } from "@/lib/usage";
import { sendMail } from "@/lib/mail";
import { usageEmail } from "@/lib/emails";

/** The plan that applies right now: a paid plan falls back to Free once the grace period after a failed payment is over. */
export function effectivePlan(company: CompanyRecord): Plan {
  const b = company.billing;
  if (b?.status === "past_due" && b.graceUntil && b.graceUntil < new Date()) return PLANS.free;
  return planOf(company.plan);
}

export interface SpendStatus {
  plan: Plan;
  window: UsageWindow;
  used: number;
  allowance: number;
  packBalance: number;
  /** Allowance left plus pack credits. */
  remaining: number;
  blocked: boolean;
}

export async function spendStatus(company: CompanyRecord): Promise<SpendStatus> {
  const plan = effectivePlan(company);
  const [used, packs] = await Promise.all([creditsUsed(company), packBalance(company._id)]);
  const left = Math.max(0, plan.monthlyCredits - used);
  return {
    plan,
    window: usageWindow(company),
    used,
    allowance: plan.monthlyCredits,
    packBalance: packs,
    remaining: left + packs,
    blocked: left + packs <= 0,
  };
}

export function limitMessage(plan: Plan) {
  return plan.topUps
    ? `Your company has used this month's ${plan.monthlyCredits.toLocaleString()} credits on the ${plan.name} plan. Buy a credit pack or upgrade to keep going.`
    : `Your company has used all ${plan.monthlyCredits.toLocaleString()} free credits this month. Upgrade to keep going.`;
}

/** null when the company may use AI, otherwise the reason it may not. */
export async function spendBlock(company: CompanyRecord): Promise<{ message: string; status: SpendStatus } | null> {
  const status = await spendStatus(company);
  return status.blocked ? { message: limitMessage(status.plan), status } : null;
}

export interface SpendInput {
  model: string;
  usage: TokenUsage;
  feature: string;
  userId?: ObjectId;
  estimated?: boolean;
}

/**
 * Records one AI call: the monthly allowance is used first, then pack credits.
 * The cost is only known after the call, so the last call of a month may go slightly over.
 */
export async function recordSpend(company: CompanyRecord, input: SpendInput) {
  const micros = costMicros(input.model, input.usage);
  const credits = creditsFor(micros);
  if (!(credits > 0)) return { credits: 0 };

  const plan = effectivePlan(company);
  const w = usageWindow(company);
  const tokens = input.usage.input_tokens + input.usage.output_tokens;

  const doc = await (await usage()).findOneAndUpdate(
    { _id: usageKey(company._id, w) },
    { $inc: { credits, costMicros: micros, tokens }, $setOnInsert: { companyId: company._id, month: w.key } },
    { upsert: true, returnDocument: "after" }
  );
  const after = doc?.credits ?? credits;
  const before = after - credits;

  // Only the part above the allowance comes out of packs.
  const overflow = Math.max(0, after - Math.max(before, plan.monthlyCredits));
  if (overflow > 0) await drawFromPacks(company._id, overflow);

  const day = new Date().toISOString().slice(0, 10);
  await Promise.all([
    (await dailyUsage()).updateOne(
      { _id: `${company._id.toString()}:${day}` },
      { $inc: { tokens, credits, costMicros: micros }, $setOnInsert: { companyId: company._id, day } },
      { upsert: true }
    ),
    (await usageEvents()).insertOne({
      companyId: company._id,
      ...(input.userId ? { userId: input.userId } : {}),
      feature: input.feature,
      model: input.model,
      inputTokens: input.usage.input_tokens,
      outputTokens: input.usage.output_tokens,
      cacheWriteTokens: input.usage.cache_creation_input_tokens ?? 0,
      cacheReadTokens: input.usage.cache_read_input_tokens ?? 0,
      costMicros: micros,
      credits,
      ...(input.estimated ? { estimated: true } : {}),
      createdAt: new Date(),
    }),
  ]);

  await notifyThresholds(company, plan, w, after).catch((e) => console.error("usage email failed:", e));
  return { credits, used: after };
}

/** Emails the owner once per month at 80% and at 100% of the allowance. */
async function notifyThresholds(company: CompanyRecord, plan: Plan, w: UsageWindow, used: number) {
  const level = used >= plan.monthlyCredits ? "warned100" : used >= plan.monthlyCredits * 0.8 ? "warned80" : null;
  if (!level) return;

  const marked = await (await usage()).updateOne(
    { _id: usageKey(company._id, w), [level]: { $ne: true } },
    { $set: level === "warned100" ? { warned100: true, warned80: true } : { warned80: true } }
  );
  if (!marked.modifiedCount) return;

  const owner = await (await users()).findOne({ companyId: company._id, role: "owner" });
  if (!owner) return;
  const packs = level === "warned100" ? await packBalance(company._id) : 0;
  await sendMail(usageEmail(owner.email, owner.name, company.name, plan, level === "warned100" ? "full" : "high", packs, w.end));
}
