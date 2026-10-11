import { findAll, findById, insert, tasks, users, projects } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, clip, forbidden, json, docId, readBody, unauthorized } from "@/lib/http";

const DUE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();

  let query = tasks().where("companyId", "==", session.company._id);
  const project = docId(new URL(request.url).searchParams.get("project"));
  if (project) query = query.where("projectId", "==", project);

  const [list, people, projectList] = await Promise.all([
    findAll(query.orderBy("updatedAt", "desc").limit(500)),
    findAll(users().where("companyId", "==", session.company._id)),
    findAll(projects().where("companyId", "==", session.company._id)),
  ]);
  const names = new Map(people.map((p) => [p._id, p.name]));
  const projectNames = new Map(projectList.map((p) => [p._id, p.name]));

  return json({
    tasks: list.map((t) => ({
      id: t._id,
      title: t.title,
      status: t.status,
      due: t.due ?? null,
      projectId: t.projectId ?? null,
      projectName: t.projectId ? projectNames.get(t.projectId) ?? null : null,
      assigneeId: t.assigneeId ?? null,
      assigneeName: t.assigneeId ? names.get(t.assigneeId) ?? null : null,
    })),
    people: people.map((p) => ({ id: p._id, name: p.name })),
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
  const projectId = docId(body.projectId);
  const assigneeId = docId(body.assigneeId);

  if (projectId && !(await findById(projects(), projectId, { companyId: session.company._id }))) {
    return json({ error: "Project not found." }, 404);
  }
  if (assigneeId && !(await findById(users(), assigneeId, { companyId: session.company._id }))) {
    return json({ error: "Teammate not found." }, 404);
  }

  const now = new Date();
  const id = await insert(tasks(), {
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

  return json({ id }, 201);
}
