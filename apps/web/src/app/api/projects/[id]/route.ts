import { ObjectId } from "mongodb";
import { conversations, projects, type ProjectRecord } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { forbidden, json, readBody, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

async function load(companyId: ObjectId, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return null;
  return (await projects()).findOne({ _id: new ObjectId(id), companyId });
}

function canEdit(session: { role: Parameters<typeof can>[0]; user: { _id: ObjectId } }, project: ProjectRecord) {
  return can(session.role, "manageTeam") || (can(session.role, "createProject") && project.createdBy.equals(session.user._id));
}

export async function GET(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const project = await load(session.company._id, ctx);
  if (!project) return json({ error: "Not found." }, 404);

  const chats = await (await conversations())
    .find({ userId: session.user._id, projectId: project._id }, { projection: { title: 1, updatedAt: 1 } })
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();

  return json({
    id: project._id.toString(),
    name: project.name,
    description: project.description,
    instructions: project.instructions,
    editable: canEdit(session, project),
    conversations: chats.map((c) => ({ id: c._id.toString(), title: c.title, updatedAt: c.updatedAt })),
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const project = await load(session.company._id, ctx);
  if (!project) return json({ error: "Not found." }, 404);
  if (!canEdit(session, project)) return forbidden();

  const body = await readBody(request);
  const name = String(body.name ?? project.name).trim().replace(/\s+/g, " ");
  const description = String(body.description ?? project.description).trim();
  const instructions = String(body.instructions ?? project.instructions).trim();

  if (name.length < 2 || name.length > 80) return json({ error: "Please enter a project name." }, 400);
  if (description.length > 500 || instructions.length > 4000) return json({ error: "Text is too long." }, 400);

  await (await projects()).updateOne({ _id: project._id }, { $set: { name, description, instructions, updatedAt: new Date() } });
  return json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const project = await load(session.company._id, ctx);
  if (!project) return json({ error: "Not found." }, 404);
  if (!canEdit(session, project)) return forbidden();

  await (await conversations()).updateMany({ projectId: project._id }, { $unset: { projectId: "" } });
  await (await projects()).deleteOne({ _id: project._id });
  return json({ ok: true });
}
