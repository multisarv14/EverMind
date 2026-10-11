import { findById, reports } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, forbidden, json, docId, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const id = docId((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  const report = await findById(reports(), id, { companyId: session.company._id });
  if (!report) return json({ error: "Not found." }, 404);

  return json({ id: report._id, title: report.title, body: report.body, createdAt: report.createdAt });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = docId((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  if (await findById(reports(), id, { companyId: session.company._id })) await reports().doc(id).delete();
  return json({ ok: true });
}
