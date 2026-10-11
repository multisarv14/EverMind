import { conversations, feedback, findAll, findById, key, messageId, messagesOf } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { json, docId, readBody, unauthorized } from "@/lib/http";

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const conversationId = docId(new URL(request.url).searchParams.get("conversation"));
  if (!conversationId) return json({ ratings: {} });

  const list = await findAll(feedback().where("userId", "==", session.user._id).where("conversationId", "==", conversationId));
  return json({ ratings: Object.fromEntries(list.map((f) => [f.messageIndex, f.rating])) });
}

// Thumbs up / down on one assistant message. rating: "up" | "down" | null (clear).
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const body = await readBody(request);
  const conversationId = docId(body.conversationId);
  const index = Number(body.messageIndex);
  const rating = body.rating;

  if (!conversationId || !Number.isInteger(index) || index < 0) return json({ error: "Invalid request." }, 400);
  if (rating !== "up" && rating !== "down" && rating !== null) return json({ error: "Invalid rating." }, 400);

  const convo = await findById(conversations(), conversationId, { userId: session.user._id });
  const message = convo && (await messagesOf(convo._id).doc(messageId(index)).get()).data();
  if (!convo || message?.role !== "assistant") return json({ error: "Not found." }, 404);

  const ref = feedback().doc(key(session.user._id, conversationId, index));

  if (rating === null) {
    await ref.delete();
  } else {
    await ref.set({
      _id: ref.id,
      userId: session.user._id,
      conversationId,
      messageIndex: index,
      rating,
      companyId: session.company._id,
      ...(convo.agent ? { agent: convo.agent } : {}),
      createdAt: new Date(),
    });
  }
  return json({ ok: true });
}
