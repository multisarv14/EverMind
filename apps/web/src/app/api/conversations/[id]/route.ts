import { ObjectId } from "mongodb";
import { conversations } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return json({ error: "Not found." }, 404);

  const convo = await (await conversations()).findOne({
    _id: new ObjectId(id),
    userId: session.user._id,
  });
  if (!convo) return json({ error: "Not found." }, 404);

  return json({
    id: convo._id.toString(),
    title: convo.title,
    projectId: convo.projectId?.toString() ?? null,
    messages: convo.messages.map(({ role, content }) => ({ role, content })),
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return json({ error: "Not found." }, 404);

  await (await conversations()).deleteOne({ _id: new ObjectId(id), userId: session.user._id });
  return json({ ok: true });
}
