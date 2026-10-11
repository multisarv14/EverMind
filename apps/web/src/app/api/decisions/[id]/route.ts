import { decisions, findById, type DecisionStatus } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, clip, forbidden, json, docId, readBody, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };
const STATUSES: DecisionStatus[] = ["proposed", "approved", "rejected"];

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = docId((await ctx.params).id);
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

  if (!(await findById(decisions(), id, { companyId: session.company._id }))) return json({ error: "Not found." }, 404);
  await decisions().doc(id).update(set);
  return json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = docId((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  if (await findById(decisions(), id, { companyId: session.company._id })) await decisions().doc(id).delete();
  return json({ ok: true });
}
