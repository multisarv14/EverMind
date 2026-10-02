import { knowledge } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, clip, forbidden, json, oid, readBody, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = oid((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  const body = await readBody(request);
  const title = clip(body.title, 120);
  const content = clip(body.content, 8000);
  if (title.length < 2 || content.length < 2) return json({ error: "Title and content are required." }, 400);

  const result = await (await knowledge()).updateOne(
    { _id: id, companyId: session.company._id },
    { $set: { title, content, updatedAt: new Date() } }
  );
  if (result.matchedCount === 0) return json({ error: "Not found." }, 404);
  return json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = oid((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  await (await knowledge()).deleteOne({ _id: id, companyId: session.company._id });
  return json({ ok: true });
}
