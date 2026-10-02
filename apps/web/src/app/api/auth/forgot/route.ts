import { createHash, randomBytes } from "node:crypto";
import { passwordResets, users } from "@/lib/db";
import { json, readBody } from "@/lib/http";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/ratelimit";
import { appUrl, sendMail } from "@/lib/mail";
import { resetEmail } from "@/lib/emails";

const HOUR = 3600;

// Always answers the same way, so nobody can use this to find out which emails have accounts.
export async function POST(request: Request) {
  const email = String((await readBody(request)).email ?? "").trim().toLowerCase();
  const ok = json({ ok: true });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return ok;

  const [perIp, perEmail] = await Promise.all([
    rateLimit(`forgot:ip:${clientIp(request)}`, 10, HOUR),
    rateLimit(`forgot:email:${email}`, 3, HOUR),
  ]);
  if (!perIp.ok) return tooManyRequests(perIp.retryAfter);
  if (!perEmail.ok) return ok;

  const user = await (await users()).findOne({ email });
  if (!user) return ok;

  const token = randomBytes(32).toString("base64url");
  const col = await passwordResets();
  await col.deleteMany({ userId: user._id });
  await col.insertOne({
    _id: createHash("sha256").update(token).digest("hex"),
    userId: user._id,
    expiresAt: new Date(Date.now() + HOUR * 1000),
  });

  await sendMail(resetEmail(email, user.name, `${appUrl(request)}/reset?token=${token}`));
  return ok;
}
