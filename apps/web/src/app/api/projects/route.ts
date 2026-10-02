import { projects, tasks } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { forbidden, json, readBody, unauthorized } from "@/lib/http";

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const list = await (await projects())
    .find({ companyId: session.company._id })
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray();

  const taskDocs = await (await tasks())
    .find({ companyId: session.company._id, projectId: { $exists: true } }, { projection: { projectId: 1, status: 1 } })
    .toArray();
  const counts = new Map<string, { open: number; done: number }>();
  for (const t of taskDocs) {
    const key = t.projectId!.toString();
    const c = counts.get(key) ?? { open: 0, done: 0 };
    if (t.status === "done") c.done++;
    else c.open++;
    counts.set(key, c);
  }

  return json({
    projects: list.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      updatedAt: p.updatedAt,
      openTasks: counts.get(p._id.toString())?.open ?? 0,
      doneTasks: counts.get(p._id.toString())?.done ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "createProject")) return forbidden();

  const body = await readBody(request);
  const name = String(body.name ?? "").trim().replace(/\s+/g, " ");
  const description = String(body.description ?? "").trim();
  const instructions = String(body.instructions ?? "").trim();

  if (name.length < 2 || name.length > 80) return json({ error: "Please enter a project name." }, 400);
  if (description.length > 500) return json({ error: "Description is too long." }, 400);
  if (instructions.length > 4000) return json({ error: "Instructions are too long." }, 400);

  const now = new Date();
  const created = await (await projects()).insertOne({
    companyId: session.company._id,
    name,
    description,
    instructions,
    createdBy: session.user._id,
    createdAt: now,
    updatedAt: now,
  });

  return json({ id: created.insertedId.toString() }, 201);
}
