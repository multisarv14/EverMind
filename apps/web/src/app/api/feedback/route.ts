import { conversations, feedback } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { json, oid, readBody, unauthorized } from "@/lib/http";

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const conversationId = oid(new URL(request.url).searchParams.get("conversation"));
  if (!conversationId) return json({ ratings: {} });

  const list = await (await feedback()).find({ userId: session.user._id, conversationId }).toArray();
  return json({ ratings: Object.fromEntries(list.map((f) => [f.messageIndex, f.rating])) });
}

// Thumbs up / down on one assistant message. rating: "up" | "down" | null (clear).
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const body = await readBody(request);
  const conversationId = oid(body.conversationId);
  const index = Number(body.messageIndex);
  const rating = body.rating;

  if (!conversationId || !Number.isInteger(index) || index < 0) return json({ error: "Invalid request." }, 400);
  if (rating !== "up" && rating !== "down" && rating !== null) return json({ error: "Invalid rating." }, 400);

  const convo = await (await conversations()).findOne({ _id: conversationId, userId: session.user._id });
  if (!convo || convo.messages[index]?.role !== "assistant") return json({ error: "Not found." }, 404);

  const col = await feedback();
  const key = { userId: session.user._id, conversationId, messageIndex: index };

  if (rating === null) {
    await col.deleteOne(key);
  } else {
    await col.updateOne(
      key,
      { $set: { rating, companyId: session.company._id, ...(convo.agent ? { agent: convo.agent } : {}), createdAt: new Date() } },
      { upsert: true }
    );
  }
  return json({ ok: true });
}
