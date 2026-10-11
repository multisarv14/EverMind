import { conversations, findById, firestore, readMessages } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { docId, json, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const convo = await findById(conversations(), docId((await ctx.params).id), { userId: session.user._id });
  if (!convo) return json({ error: "Not found." }, 404);

  return json({
    id: convo._id,
    title: convo.title,
    projectId: convo.projectId ?? null,
    agent: convo.agent ?? null,
    depth: convo.depth ?? "basic",
    messages: (await readMessages(convo)).map(({ role, content }) => ({ role, content })),
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const convo = await findById(conversations(), docId((await ctx.params).id), { userId: session.user._id });
  // Also deletes its messages.
  if (convo) await firestore().recursiveDelete(conversations().doc(convo._id));
  return json({ ok: true });
}
