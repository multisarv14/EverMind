import { FieldValue } from "firebase-admin/firestore";
import { conversations, findAll, findById, firestore, projects, type Id, type ProjectRecord } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { docId, forbidden, json, readBody, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

async function load(companyId: Id, ctx: Ctx) {
  return findById(projects(), docId((await ctx.params).id), { companyId });
}

function canEdit(session: { role: Parameters<typeof can>[0]; user: { _id: Id } }, project: ProjectRecord) {
  return can(session.role, "manageTeam") || (can(session.role, "createProject") && project.createdBy === session.user._id);
}

export async function GET(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const project = await load(session.company._id, ctx);
  if (!project) return json({ error: "Not found." }, 404);

  const chats = await findAll(
    conversations()
      .where("userId", "==", session.user._id)
      .where("projectId", "==", project._id)
      .orderBy("updatedAt", "desc")
      .limit(100)
  );

  return json({
    id: project._id,
    name: project.name,
    description: project.description,
    instructions: project.instructions,
    editable: canEdit(session, project),
    conversations: chats.map((c) => ({ id: c._id, title: c.title, updatedAt: c.updatedAt })),
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

  await projects().doc(project._id).update({ name, description, instructions, updatedAt: new Date() });
  return json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const project = await load(session.company._id, ctx);
  if (!project) return json({ error: "Not found." }, 404);
  if (!canEdit(session, project)) return forbidden();

  // Its conversations stay, no longer in a project.
  const writer = firestore().bulkWriter();
  const linked = await conversations().where("projectId", "==", project._id).get();
  for (const c of linked.docs) void writer.update(c.ref, { projectId: FieldValue.delete() });
  void writer.delete(projects().doc(project._id));
  await writer.close();
  return json({ ok: true });
}
