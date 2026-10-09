import { payments } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { json, unauthorized } from "@/lib/http";

// Payment history for the Plan & billing screen (owner only; everything else is in /api/auth/me).
export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageBilling")) return json({ payments: [] });

  const list = await (await payments()).find({ companyId: session.company._id }).sort({ createdAt: -1 }).limit(24).toArray();
  return json({
    payments: list.map((p) => ({
      id: p._id.toString(),
      kind: p.kind,
      plan: p.plan ?? null,
      packId: p.packId ?? null,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      reference: p.gatewayPaymentId,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
