import { ObjectId } from "mongodb";
import { invites } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { forbidden, json, unauthorized } from "@/lib/http";

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageTeam")) return forbidden();

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return json({ error: "Not found." }, 404);

  await (await invites()).deleteOne({ _id: new ObjectId(id), companyId: session.company._id });
  return json({ ok: true });
}
