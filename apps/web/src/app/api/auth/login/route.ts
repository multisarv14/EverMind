import bcrypt from "bcryptjs";
import { findFirst, users } from "@/lib/db";
import { startSession } from "@/lib/auth";
import { json, readBody } from "@/lib/http";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/ratelimit";

// Compared against when the email is unknown, so timing doesn't reveal it.
const DUMMY_HASH = bcrypt.hashSync("evermind-dummy-password", 12);

export async function POST(request: Request) {
  const body = await readBody(request);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  // Slow down password guessing: per account and per IP address.
  const ip = clientIp(request);
  const [perAccount, perIp] = await Promise.all([
    rateLimit(`login:acct:${email}`, 8, 600),
    rateLimit(`login:ip:${ip}`, 40, 600),
  ]);
  if (!perAccount.ok || !perIp.ok) return tooManyRequests(Math.max(perAccount.retryAfter, perIp.retryAfter));

  const user = await findFirst(users().where("email", "==", email));
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) {
    return json({ error: "Incorrect email or password." }, 401);
  }

  await startSession(user._id);
  return json({ user: { name: user.name, email: user.email } });
}
