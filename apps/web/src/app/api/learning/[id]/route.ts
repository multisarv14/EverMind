import { knowledge, learnings } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, clip, forbidden, json, oid, readBody, unauthorized } from "@/lib/http";

// Approve (optionally after editing the wording) or dismiss a suggested fact.
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = oid((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  const body = await readBody(request);
  const col = await learnings();
  const item = await col.findOne({ _id: id, companyId: session.company._id, status: "pending" });
  if (!item) return json({ error: "Not found." }, 404);

  if (body.action === "dismiss") {
    await col.updateOne({ _id: id }, { $set: { status: "dismissed" } });
    return json({ ok: true });
  }

  if (body.action === "approve") {
    const text = clip(body.text ?? item.text, 400);
    if (text.length < 8) return json({ error: "That's too short to save." }, 400);

    const now = new Date();
    await (await knowledge()).insertOne({
      companyId: session.company._id,
      title: `Learned: ${clip(text, 60)}`,
      content: text,
      createdBy: session.user._id,
      createdAt: now,
      updatedAt: now,
    });
    await col.updateOne({ _id: id }, { $set: { status: "approved", text } });
    return json({ ok: true });
  }

  return json({ error: "Invalid action." }, 400);
}
