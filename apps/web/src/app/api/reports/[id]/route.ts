import { reports } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, forbidden, json, oid, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const id = oid((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  const report = await (await reports()).findOne({ _id: id, companyId: session.company._id });
  if (!report) return json({ error: "Not found." }, 404);

  return json({ id: report._id.toString(), title: report.title, body: report.body, createdAt: report.createdAt });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = oid((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  await (await reports()).deleteOne({ _id: id, companyId: session.company._id });
  return json({ ok: true });
}
