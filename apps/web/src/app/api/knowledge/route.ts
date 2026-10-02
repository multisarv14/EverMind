import { knowledge } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, clip, forbidden, json, readBody, unauthorized } from "@/lib/http";

const MAX_ITEMS = 100;

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const list = await (await knowledge()).find({ companyId: session.company._id }).sort({ updatedAt: -1 }).limit(MAX_ITEMS).toArray();

  return json({
    items: list.map((k) => ({ id: k._id.toString(), title: k.title, content: k.content, updatedAt: k.updatedAt })),
  });
}

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const body = await readBody(request);
  const title = clip(body.title, 120);
  const content = clip(body.content, 8000);
  if (title.length < 2) return json({ error: "Please enter a title." }, 400);
  if (content.length < 2) return json({ error: "Please add some content." }, 400);

  const col = await knowledge();
  if ((await col.countDocuments({ companyId: session.company._id })) >= MAX_ITEMS) {
    return json({ error: `You can keep up to ${MAX_ITEMS} knowledge items. Delete one to add another.` }, 400);
  }

  const now = new Date();
  const created = await col.insertOne({
    companyId: session.company._id,
    title,
    content,
    createdBy: session.user._id,
    createdAt: now,
    updatedAt: now,
  });
  return json({ id: created.insertedId.toString() }, 201);
}
