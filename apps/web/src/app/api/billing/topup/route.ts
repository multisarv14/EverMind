import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { forbidden, json, readBody, unauthorized } from "@/lib/http";
import { effectivePlan } from "@/lib/entitlements";
import { appUrl } from "@/lib/mail";
import { BillingError, billingConfigured, createPackLink } from "@/lib/billing";

// Buys a credit pack (paid plans only) and returns the payment page to open.
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageBilling")) return forbidden("Only the owner can buy credits.");
  if (!billingConfigured()) return json({ error: "Online payment isn't set up yet.", code: "billing_not_configured" }, 503);
  if (!effectivePlan(session.company).topUps) {
    return json({ error: "Credit packs are available on paid plans. Upgrade to buy extra credits.", code: "upgrade_required" }, 402);
  }

  const body = await readBody(request);
  try {
    const link = await createPackLink(session.company, String(body.pack ?? ""), session.user.email, `${appUrl(request)}/settings?tab=plan&paid=1`);
    return json({ url: link.url }, 201);
  } catch (error) {
    if (error instanceof BillingError) return json({ error: error.message }, error.status);
    throw error;
  }
}
