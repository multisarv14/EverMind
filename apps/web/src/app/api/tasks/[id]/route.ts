import { FieldValue } from "firebase-admin/firestore";
import { findById, tasks, users, type TaskStatus } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, clip, forbidden, json, docId, readBody, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };
const STATUSES: TaskStatus[] = ["todo", "doing", "done"];

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = docId((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  const body = await readBody(request);
  const set: Record<string, unknown> = { updatedAt: new Date() };

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as TaskStatus)) return json({ error: "Invalid status." }, 400);
    set.status = body.status;
  }
  if (body.title !== undefined) {
    const title = clip(body.title, 200);
    if (title.length < 2) return json({ error: "Please enter a task title." }, 400);
    set.title = title;
  }
  if (body.due !== undefined) {
    const due = clip(body.due, 10);
    if (due === "") set.due = FieldValue.delete();
    else if (/^\d{4}-\d{2}-\d{2}$/.test(due)) set.due = due;
    else return json({ error: "Invalid date." }, 400);
  }
  if (body.assigneeId !== undefined) {
    const assignee = docId(body.assigneeId);
    if (!assignee) set.assigneeId = FieldValue.delete();
    else if (await findById(users(), assignee, { companyId: session.company._id })) set.assigneeId = assignee;
    else return json({ error: "Teammate not found." }, 404);
  }

  if (!(await findById(tasks(), id, { companyId: session.company._id }))) return json({ error: "Not found." }, 404);
  await tasks().doc(id).update(set);
  return json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = docId((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  if (await findById(tasks(), id, { companyId: session.company._id })) await tasks().doc(id).delete();
  return json({ ok: true });
}
