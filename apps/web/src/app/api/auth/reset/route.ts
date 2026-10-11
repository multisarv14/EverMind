import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { deleteAll, findById, passwordResets, users } from "@/lib/db";
import { json, readBody } from "@/lib/http";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/ratelimit";

export async function POST(request: Request) {
  const limited = await rateLimit(`reset:ip:${clientIp(request)}`, 20, 3600);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);

  const body = await readBody(request);
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");

  if (password.length < 8 || password.length > 200) return json({ error: "Password must be at least 8 characters." }, 400);

  const col = passwordResets();
  const record = await findById(col, createHash("sha256").update(token).digest("hex"));
  if (!record || record.expiresAt < new Date()) {
    return json({ error: "This link has expired or was already used. Please request a new one." }, 400);
  }

  const now = new Date(Math.floor(Date.now() / 1000) * 1000); // whole seconds, like session tokens
  await users().doc(record.userId).update({ passwordHash: await bcrypt.hash(password, 12), passwordChangedAt: now });
  await deleteAll(col.where("userId", "==", record.userId));
  return json({ ok: true });
}
