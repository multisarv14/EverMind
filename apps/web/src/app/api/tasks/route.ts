import { tasks, users, projects } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, clip, forbidden, json, oid, readBody, unauthorized } from "@/lib/http";

const DUE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const filter: Record<string, unknown> = { companyId: session.company._id };
  const project = oid(new URL(request.url).searchParams.get("project"));
  if (project) filter.projectId = project;

  const list = await (await tasks()).find(filter).sort({ updatedAt: -1 }).limit(500).toArray();
  const people = await (await users())
    .find({ companyId: session.company._id }, { projection: { name: 1 } })
    .toArray();
  const projectList = await (await projects()).find({ companyId: session.company._id }, { projection: { name: 1 } }).toArray();
  const names = new Map(people.map((p) => [p._id.toString(), p.name]));
  const projectNames = new Map(projectList.map((p) => [p._id.toString(), p.name]));

  return json({
    tasks: list.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      status: t.status,
      due: t.due ?? null,
      projectId: t.projectId?.toString() ?? null,
      projectName: t.projectId ? projectNames.get(t.projectId.toString()) ?? null : null,
      assigneeId: t.assigneeId?.toString() ?? null,
      assigneeName: t.assigneeId ? names.get(t.assigneeId.toString()) ?? null : null,
    })),
    people: people.map((p) => ({ id: p._id.toString(), name: p.name })),
  });
}

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const body = await readBody(request);
  const title = clip(body.title, 200);
  if (title.length < 2) return json({ error: "Please enter a task title." }, 400);

  const due = clip(body.due, 10);
  const projectId = oid(body.projectId);
  const assigneeId = oid(body.assigneeId);

  if (projectId && !(await (await projects()).findOne({ _id: projectId, companyId: session.company._id }))) {
    return json({ error: "Project not found." }, 404);
  }
  if (assigneeId && !(await (await users()).findOne({ _id: assigneeId, companyId: session.company._id }))) {
    return json({ error: "Teammate not found." }, 404);
  }

  const now = new Date();
  const created = await (await tasks()).insertOne({
    companyId: session.company._id,
    title,
    status: "todo",
    ...(DUE.test(due) ? { due } : {}),
    ...(projectId ? { projectId } : {}),
    ...(assigneeId ? { assigneeId } : {}),
    createdBy: session.user._id,
    createdAt: now,
    updatedAt: now,
  });

  return json({ id: created.insertedId.toString() }, 201);
}
