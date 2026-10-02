import { ObjectId } from "mongodb";
import { conversations, users } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { forbidden, json, readBody, unauthorized } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };
const ASSIGNABLE = ["admin", "member", "viewer"];

async function target(session: NonNullable<Awaited<ReturnType<typeof currentSession>>>, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return null;
  return (await users()).findOne({ _id: new ObjectId(id), companyId: session.company._id });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageTeam")) return forbidden();

  const member = await target(session, ctx);
  if (!member) return json({ error: "Not found." }, 404);
  if (member.role === "owner") return forbidden("The owner's role can't be changed.");
  if (member._id.equals(session.user._id)) return forbidden("You can't change your own role.");

  const role = String((await readBody(request)).role ?? "");
  if (!ASSIGNABLE.includes(role)) return json({ error: "Invalid role." }, 400);
  if ((role === "admin" || member.role === "admin") && session.role !== "owner") {
    return forbidden("Only the owner can change admin access.");
  }

  await (await users()).updateOne({ _id: member._id }, { $set: { role: role as "admin" | "member" | "viewer" } });
  return json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageTeam")) return forbidden();

  const member = await target(session, ctx);
  if (!member) return json({ error: "Not found." }, 404);
  if (member.role === "owner") return forbidden("The owner can't be removed.");
  if (member._id.equals(session.user._id)) return forbidden("You can't remove yourself.");
  if (member.role === "admin" && session.role !== "owner") return forbidden("Only the owner can remove admins.");

  await (await conversations()).deleteMany({ userId: member._id });
  await (await users()).deleteOne({ _id: member._id });
  return json({ ok: true });
}
