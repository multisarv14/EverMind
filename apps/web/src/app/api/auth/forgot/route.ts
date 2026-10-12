import { createHash, randomBytes } from "node:crypto";
import { deleteAll, findFirst, insert, passwordResets, users } from "@/lib/db";
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
  if (!perEmail.ok) {
    console.warn(`[auth/forgot] Rate limit exceeded for "${email}" (limit: 3 per hour). Request ignored.`);
    return ok;
  }

  const user = await findFirst(users().where("email", "==", email));
  if (!user) {
    console.warn(`[auth/forgot] No account found for "${email}". Check registered email in database.`);
    return ok;
  }

  const token = randomBytes(32).toString("base64url");
  const col = passwordResets();
  await deleteAll(col.where("userId", "==", user._id));
  await insert(col, { userId: user._id, expiresAt: new Date(Date.now() + HOUR * 1000) }, createHash("sha256").update(token).digest("hex"));

  const { sent } = await sendMail(resetEmail(email, user.name, `${appUrl(request)}/reset?token=${token}`));
  if (!sent) {
    console.error(`[auth/forgot] Email could not be sent to "${email}". See mail error above.`);
  }
  return ok;
}
