import { findFirst, users } from "@/lib/db";
import { json, readBody } from "@/lib/http";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/ratelimit";
import { appUrl } from "@/lib/mail";
import { sendPasswordReset } from "@/lib/passwordReset";

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

  const user = await findFirst(users().where("email", "==", email));
  if (!user) return ok;

  await sendPasswordReset(user, appUrl(request));
  return ok;
}
