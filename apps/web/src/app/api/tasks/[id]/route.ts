import { tasks, users, type TaskStatus } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { canEdit, clip, forbidden, json, oid, readBody, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };
const STATUSES: TaskStatus[] = ["todo", "doing", "done"];

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = oid((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  const body = await readBody(request);
  const set: Record<string, unknown> = { updatedAt: new Date() };
  const unset: Record<string, ""> = {};

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
    if (due === "") unset.due = "";
    else if (/^\d{4}-\d{2}-\d{2}$/.test(due)) set.due = due;
    else return json({ error: "Invalid date." }, 400);
  }
  if (body.assigneeId !== undefined) {
    const assignee = oid(body.assigneeId);
    if (!assignee) unset.assigneeId = "";
    else if (await (await users()).findOne({ _id: assignee, companyId: session.company._id })) set.assigneeId = assignee;
    else return json({ error: "Teammate not found." }, 404);
  }

  const result = await (await tasks()).updateOne(
    { _id: id, companyId: session.company._id },
    { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }
  );
  if (result.matchedCount === 0) return json({ error: "Not found." }, 404);
  return json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = oid((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  await (await tasks()).deleteOne({ _id: id, companyId: session.company._id });
  return json({ ok: true });
}
