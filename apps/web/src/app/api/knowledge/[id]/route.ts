import { findById, knowledge } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, clip, forbidden, json, docId, readBody, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = docId((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  const body = await readBody(request);
  const title = clip(body.title, 120);
  const content = clip(body.content, 8000);
  if (title.length < 2 || content.length < 2) return json({ error: "Title and content are required." }, 400);

  if (!(await findById(knowledge(), id, { companyId: session.company._id }))) return json({ error: "Not found." }, 404);
  await knowledge().doc(id).update({ title, content, updatedAt: new Date() });
  return json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = docId((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  if (await findById(knowledge(), id, { companyId: session.company._id })) await knowledge().doc(id).delete();
  return json({ ok: true });
}
