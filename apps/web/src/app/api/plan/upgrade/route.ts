import { upgradeRequests } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { forbidden, json, readBody, unauthorized } from "@/lib/http";

// There is no payment system yet: an upgrade is recorded as a request that
// the EverMind team follows up on.
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageBilling")) return forbidden("Only the owner can request a plan change.");

  const body = await readBody(request);
  const plan = String(body.plan ?? "");
  const note = String(body.note ?? "").trim().slice(0, 500);

  if (plan !== "pro" && plan !== "business") return json({ error: "Please choose a plan." }, 400);

  const col = await upgradeRequests();
  await col.deleteMany({ companyId: session.company._id });
  await col.insertOne({
    companyId: session.company._id,
    userId: session.user._id,
    plan,
    note,
    createdAt: new Date(),
  });

  return json({ ok: true }, 201);
}
