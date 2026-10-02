import { decisions, type DecisionStatus } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, clip, forbidden, json, oid, readBody, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };
const STATUSES: DecisionStatus[] = ["proposed", "approved", "rejected"];

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = oid((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  const body = await readBody(request);
  const set: Record<string, unknown> = { updatedAt: new Date() };

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as DecisionStatus)) return json({ error: "Invalid status." }, 400);
    set.status = body.status;
  }
  if (body.decision !== undefined) set.decision = clip(body.decision, 3000);
  if (body.title !== undefined) {
    const title = clip(body.title, 200);
    if (title.length < 3) return json({ error: "Please enter the decision to be made." }, 400);
    set.title = title;
  }
  if (body.context !== undefined) set.context = clip(body.context, 3000);
  if (body.options !== undefined) set.options = clip(body.options, 2000);

  const result = await (await decisions()).updateOne({ _id: id, companyId: session.company._id }, { $set: set });
  if (result.matchedCount === 0) return json({ error: "Not found." }, 404);
  return json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = oid((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  await (await decisions()).deleteOne({ _id: id, companyId: session.company._id });
  return json({ ok: true });
}
