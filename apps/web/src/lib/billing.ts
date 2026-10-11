import { createHmac, timingSafeEqual } from "node:crypto";
import {
  billingEvents,
  companies,
  creditGrants,
  findById,
  findFirst,
  insert,
  isDuplicate,
  key,
  payments,
  users,
  type CompanyRecord,
} from "@/lib/db";
import { docId } from "@/lib/http";
import { GRACE_DAYS, PACKS, PACK_VALID_DAYS, PLANS, isPaidPlan, type Interval, type PlanId } from "@/lib/plans";
import { withGst } from "@/lib/pricing";
import { sendMail } from "@/lib/mail";
import { paymentFailedEmail, receiptEmail } from "@/lib/emails";

/*
 * Payments through Razorpay (India: cards, UPI Autopay, net banking).
 *
 * Subscriptions use plans created once in the Razorpay dashboard; their ids go in
 * RAZORPAY_PLAN_<PLAN>_<INTERVAL>. Their amounts must equal the prices in lib/plans.ts plus GST.
 * Credit packs are one-off payment links. Only the signed webhook changes a plan or adds credits.
 */

const API = () => process.env.RAZORPAY_API_URL ?? "https://api.razorpay.com/v1";

export const billingConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET);

export const gatewayPlanId = (plan: PlanId, interval: Interval) =>
  process.env[`RAZORPAY_PLAN_${plan.toUpperCase()}_${interval.toUpperCase()}`] ?? "";

export class BillingError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

async function razorpay<T>(path: string, body: unknown): Promise<T> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  let res: Response;
  try {
    res = await fetch(`${API()}${path}`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("razorpay unreachable:", error);
    throw new BillingError("The payment service can't be reached right now. Please try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("razorpay error:", res.status, JSON.stringify(data));
    throw new BillingError("The payment service refused the request. Please try again or contact us.");
  }
  return data as T;
}

/** Starts a subscription and returns the Razorpay page where the owner pays. */
export async function createSubscription(company: CompanyRecord, plan: Exclude<PlanId, "free">, interval: Interval, email: string) {
  const planId = gatewayPlanId(plan, interval);
  if (!planId) throw new BillingError(`The ${PLANS[plan].name} ${interval} plan isn't set up for online payment yet.`, 503);
  const sub = await razorpay<{ id: string; short_url: string }>("/subscriptions", {
    plan_id: planId,
    // Razorpay needs an end; this is 10 years either way and is cancelled whenever the owner chooses.
    total_count: interval === "monthly" ? 120 : 10,
    customer_notify: 1,
    notes: { companyId: company._id, plan, interval, email },
  });
  return { id: sub.id, url: sub.short_url };
}

/** A one-off payment page for a credit pack. */
export async function createPackLink(company: CompanyRecord, packId: string, email: string, returnUrl: string) {
  const pack = PACKS.find((p) => p.id === packId);
  if (!pack) throw new BillingError("Please choose a credit pack.", 400);
  const link = await razorpay<{ id: string; short_url: string }>("/payment_links", {
    amount: Math.round(withGst(pack.priceInr) * 100),
    currency: "INR",
    description: `EverMind: ${pack.credits.toLocaleString("en-IN")} AI credits for ${company.name}`,
    customer: { email },
    notify: { email: true },
    notes: { companyId: company._id, packId: pack.id },
    callback_url: returnUrl,
    callback_method: "get",
  });
  return { id: link.id, url: link.short_url };
}

/** Stops renewal; the plan stays until the end of the paid period. `now` ends it immediately. */
export async function cancelSubscription(subscriptionId: string, now = false) {
  await razorpay(`/subscriptions/${subscriptionId}/cancel`, { cancel_at_cycle_end: now ? 0 : 1 });
}

export function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// ---- Webhook handling ----

interface SubscriptionEntity {
  id: string;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
  notes?: Record<string, string>;
}

interface PaymentEntity {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface WebhookEvent {
  event: string;
  payload: {
    subscription?: { entity: SubscriptionEntity };
    payment?: { entity: PaymentEntity };
    payment_link?: { entity: { id: string; notes?: Record<string, string> } };
  };
}

const date = (unix?: number | null) => (unix ? new Date(unix * 1000) : undefined);

async function companyFromNotes(notes?: Record<string, string>) {
  return findById(companies(), docId(notes?.companyId));
}

async function ownerOf(company: CompanyRecord) {
  return findFirst(users().where("companyId", "==", company._id).where("role", "==", "owner"));
}

/** Stores a captured payment once; returns false if it was already recorded. */
async function recordPayment(company: CompanyRecord, p: PaymentEntity, extra: { kind: "subscription" | "pack"; plan?: string; packId?: string }) {
  try {
    await insert(
      payments(),
      {
        companyId: company._id,
        ...extra,
        amount: p.amount,
        currency: p.currency,
        status: p.status === "captured" ? "captured" : "failed",
        gatewayPaymentId: p.id,
        createdAt: new Date(),
      },
      key(p.id)
    );
    return true;
  } catch (error) {
    if (isDuplicate(error)) return false;
    throw error;
  }
}

/**
 * Applies one webhook event. Returns false when the event was already handled
 * (Razorpay retries deliveries, so every change here must be safe to repeat).
 */
export async function handleWebhook(eventId: string, ev: WebhookEvent): Promise<boolean> {
  try {
    await insert(billingEvents(), { type: ev.event, createdAt: new Date() }, key(eventId));
  } catch (error) {
    if (isDuplicate(error)) return false;
    throw error;
  }

  try {
    await apply(ev);
  } catch (error) {
    // Let Razorpay deliver it again.
    await billingEvents().doc(key(eventId)).delete();
    throw error;
  }
  return true;
}

async function apply(ev: WebhookEvent) {
  const col = companies();

  if (ev.event === "payment_link.paid") {
    const notes = ev.payload.payment_link?.entity.notes;
    const payment = ev.payload.payment?.entity;
    const company = await companyFromNotes(notes);
    const pack = PACKS.find((p) => p.id === notes?.packId);
    if (!company || !pack || !payment) return;
    if (!(await recordPayment(company, payment, { kind: "pack", packId: pack.id }))) return;
    const now = new Date();
    await insert(
      creditGrants(),
      {
        companyId: company._id,
        source: "pack",
        packId: pack.id,
        paymentId: payment.id,
        credits: pack.credits,
        remaining: pack.credits,
        createdAt: now,
        expiresAt: new Date(now.getTime() + PACK_VALID_DAYS * 86_400_000),
      },
      key("pack", payment.id)
    );
    const owner = await ownerOf(company);
    if (owner) await sendMail(receiptEmail(owner.email, owner.name, company.name, `${pack.credits.toLocaleString("en-IN")} AI credits`, payment.amount, payment.currency));
    return;
  }

  const sub = ev.payload.subscription?.entity;
  if (!sub) return;
  const company = await companyFromNotes(sub.notes);
  if (!company) return;
  const plan = sub.notes?.plan ?? "";
  const interval: Interval = sub.notes?.interval === "yearly" ? "yearly" : "monthly";
  const current = company.billing?.subscriptionId === sub.id;

  switch (ev.event) {
    case "subscription.activated":
    case "subscription.charged":
    case "subscription.resumed": {
      if (!isPaidPlan(plan)) return;
      // A new subscription replaces the old one (switching plan): stop the old one now.
      const previous = company.billing?.subscriptionId;
      if (previous && previous !== sub.id && company.billing?.status !== "cancelled") {
        await cancelSubscription(previous, true).catch((e) => console.error("could not cancel replaced subscription:", e));
      }
      await col.doc(company._id).update({
        plan,
        billing: {
          status: "active",
          interval,
          subscriptionId: sub.id,
          periodStart: date(sub.current_start) ?? new Date(),
          ...(sub.current_end ? { periodEnd: date(sub.current_end) } : {}),
          cancelAtPeriodEnd: current ? Boolean(company.billing?.cancelAtPeriodEnd) : false,
        },
      });
      const payment = ev.payload.payment?.entity;
      if (payment && (await recordPayment(company, payment, { kind: "subscription", plan }))) {
        const owner = await ownerOf(company);
        if (owner) await sendMail(receiptEmail(owner.email, owner.name, company.name, `the ${PLANS[plan].name} plan (${interval})`, payment.amount, payment.currency));
      }
      return;
    }

    case "subscription.pending":
    case "subscription.halted": {
      if (!current || company.billing?.status === "past_due") return;
      const graceUntil = new Date(Date.now() + GRACE_DAYS * 86_400_000);
      await col.doc(company._id).update({ "billing.status": "past_due", "billing.graceUntil": graceUntil });
      const owner = await ownerOf(company);
      if (owner) await sendMail(paymentFailedEmail(owner.email, owner.name, company.name, PLANS[isPaidPlan(plan) ? plan : "pro"], graceUntil));
      return;
    }

    case "subscription.cancelled":
    case "subscription.completed": {
      // Ignore the end of a subscription that was already replaced by a newer one.
      if (!current) return;
      await col.doc(company._id).update({ plan: "free", "billing.status": "cancelled" });
      return;
    }
  }
}
