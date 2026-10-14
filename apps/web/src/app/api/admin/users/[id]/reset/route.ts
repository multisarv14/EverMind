import { adminSession } from "@/lib/admin";
import { findById, users } from "@/lib/db";
import { docId, json } from "@/lib/http";
import { appUrl } from "@/lib/mail";
import { sendPasswordReset } from "@/lib/passwordReset";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Sends the user a password reset link. The link is also returned, so an admin can pass it on
 * when email isn't working. The admin never sees or sets the password itself.
 */
export async function POST(request: Request, ctx: Ctx) {
  const { error } = await adminSession();
  if (error) return error;

  const user = await findById(users(), docId((await ctx.params).id));
  if (!user) return json({ error: "Not found." }, 404);

  return json(await sendPasswordReset(user, appUrl(request)), 201);
}
