import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { forbidden, json, readBody, unauthorized } from "@/lib/http";
import { isPaidPlan } from "@/lib/plans";
import { BillingError, billingConfigured, createSubscription } from "@/lib/billing";

// Starts a subscription (or a switch to another plan) and returns the payment page to open.
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageBilling")) return forbidden("Only the owner can change the plan.");
  if (!billingConfigured()) return json({ error: "Online payment isn't set up yet.", code: "billing_not_configured" }, 503);

  const body = await readBody(request);
  const plan = String(body.plan ?? "");
  const interval = body.interval === "yearly" ? "yearly" : "monthly";
  if (!isPaidPlan(plan)) return json({ error: "Please choose a plan." }, 400);

  const b = session.company.billing;
  if (b && b.status !== "cancelled" && session.company.plan === plan && b.interval === interval) {
    return json({ error: "Your company is already on this plan." }, 409);
  }

  try {
    const sub = await createSubscription(session.company, plan, interval, session.user.email);
    return json({ url: sub.url }, 201);
  } catch (error) {
    if (error instanceof BillingError) return json({ error: error.message }, error.status);
    throw error;
  }
}
