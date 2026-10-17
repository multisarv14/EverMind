import { adminSession, isPlatformAdmin } from "@/lib/admin";
import { findById, users } from "@/lib/db";
import { docId, forbidden, json } from "@/lib/http";
import { appUrl } from "@/lib/mail";
import { sendPasswordReset } from "@/lib/passwordReset";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Sends the user a password reset link. The link is also returned, so an admin can pass it on
 * when email isn't working. The admin never sees or sets the password itself.
 * A MultiSarv panel admin can't do this for a platform admin: the link would hand them that account,
 * and with it more access than the panel gave them.
 */
export async function POST(request: Request, ctx: Ctx) {
  const { actor, error } = await adminSession(request, "users");
  if (error) return error;

  const user = await findById(users(), docId((await ctx.params).id));
  if (!user) return json({ error: "Not found." }, 404);
  if (actor.via === "panel" && isPlatformAdmin(user)) {
    return forbidden("EverMind platform admins reset their password from EverMind itself.");
  }

  return json(await sendPasswordReset(user, appUrl(request)), 201);
}
