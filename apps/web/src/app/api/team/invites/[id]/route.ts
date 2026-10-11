import { findById, invites } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { docId, forbidden, json, unauthorized } from "@/lib/http";

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageTeam")) return forbidden();

  const id = docId((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  if (await findById(invites(), id, { companyId: session.company._id })) await invites().doc(id).delete();
  return json({ ok: true });
}
