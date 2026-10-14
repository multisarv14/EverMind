import { adminSession } from "@/lib/admin";
import { findById, upgradeRequests } from "@/lib/db";
import { docId, json } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

/** Dismisses a request without changing the plan. (Approving is a plan change: PATCH /api/admin/companies/[id].) */
export async function DELETE(_request: Request, ctx: Ctx) {
  const { error } = await adminSession();
  if (error) return error;

  const request = await findById(upgradeRequests(), docId((await ctx.params).id));
  if (!request) return json({ error: "Not found." }, 404);

  await upgradeRequests().doc(request._id).delete();
  return json({ ok: true });
}
