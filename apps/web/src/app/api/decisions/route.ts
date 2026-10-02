import { decisions } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, clip, forbidden, json, readBody, unauthorized } from "@/lib/http";

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const list = await (await decisions()).find({ companyId: session.company._id }).sort({ updatedAt: -1 }).limit(300).toArray();

  return json({
    decisions: list.map((d) => ({
      id: d._id.toString(),
      title: d.title,
      context: d.context,
      options: d.options,
      decision: d.decision,
      status: d.status,
      aiRecommendation: d.aiRecommendation ?? "",
      updatedAt: d.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const body = await readBody(request);
  const title = clip(body.title, 200);
  if (title.length < 3) return json({ error: "Please enter the decision to be made." }, 400);

  const now = new Date();
  const created = await (await decisions()).insertOne({
    companyId: session.company._id,
    title,
    context: clip(body.context, 3000),
    options: clip(body.options, 2000),
    decision: "",
    status: "proposed",
    createdBy: session.user._id,
    createdAt: now,
    updatedAt: now,
  });

  return json({ id: created.insertedId.toString() }, 201);
}
