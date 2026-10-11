import { findAll, payments } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { json, unauthorized } from "@/lib/http";

// Payment history for the Plan & billing screen (owner only; everything else is in /api/auth/me).
export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageBilling")) return json({ payments: [] });

  const list = await findAll(payments().where("companyId", "==", session.company._id).orderBy("createdAt", "desc").limit(24));
  return json({
    payments: list.map((p) => ({
      id: p._id,
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
