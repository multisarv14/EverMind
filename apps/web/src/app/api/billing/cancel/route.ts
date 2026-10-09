import { companies } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { forbidden, json, unauthorized } from "@/lib/http";
import { BillingError, cancelSubscription } from "@/lib/billing";

// Stops renewal. The plan keeps working until the end of the period already paid for.
export async function POST() {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageBilling")) return forbidden("Only the owner can cancel the plan.");

  const b = session.company.billing;
  if (!b || b.status === "cancelled") return json({ error: "There is no subscription to cancel." }, 400);
  if (b.cancelAtPeriodEnd) return json({ ok: true });

  try {
    await cancelSubscription(b.subscriptionId);
  } catch (error) {
    if (error instanceof BillingError) return json({ error: error.message }, error.status);
    throw error;
  }
  await (await companies()).updateOne({ _id: session.company._id }, { $set: { "billing.cancelAtPeriodEnd": true } });
  return json({ ok: true });
}
