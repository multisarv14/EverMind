import bcrypt from "bcryptjs";
import { users } from "@/lib/db";
import { startSession } from "@/lib/auth";
import { json, readBody } from "@/lib/http";

// Compared against when the email is unknown, so timing doesn't reveal it.
const DUMMY_HASH = bcrypt.hashSync("evermind-dummy-password", 12);

export async function POST(request: Request) {
  const body = await readBody(request);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const user = await (await users()).findOne({ email });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) {
    return json({ error: "Incorrect email or password." }, 401);
  }

  await startSession(user._id.toString());
  return json({ user: { name: user.name, email: user.email } });
}
