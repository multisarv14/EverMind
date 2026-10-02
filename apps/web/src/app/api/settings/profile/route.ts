import bcrypt from "bcryptjs";
import { users } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { clip, json, readBody, unauthorized } from "@/lib/http";

export async function PATCH(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();

  const body = await readBody(request);
  const set: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = clip(body.name, 80);
    if (name.length < 2) return json({ error: "Please enter your name." }, 400);
    set.name = name;
  }

  if (body.newPassword) {
    const current = String(body.currentPassword ?? "");
    const next = String(body.newPassword);
    if (next.length < 8 || next.length > 200) return json({ error: "New password must be at least 8 characters." }, 400);
    if (!(await bcrypt.compare(current, session.user.passwordHash))) {
      return json({ error: "Your current password is incorrect." }, 400);
    }
    set.passwordHash = await bcrypt.hash(next, 12);
  }

  if (Object.keys(set).length === 0) return json({ error: "Nothing to update." }, 400);

  await (await users()).updateOne({ _id: session.user._id }, { $set: set });
  return json({ ok: true });
}
