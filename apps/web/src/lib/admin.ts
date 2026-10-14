import { currentSession, type Session } from "@/lib/auth";
import type { UserDoc } from "@/lib/db";
import { json, unauthorized } from "@/lib/http";

/**
 * Platform admins are the EverMind team, not a company's own admins. It is a flag on the user's
 * record, set with scripts/admin-users.mjs. No API route writes it, so no one can grant it from the app.
 */
export const isPlatformAdmin = (user: Pick<UserDoc, "platformAdmin">) => user.platformAdmin === true;

/** The session when it belongs to a platform admin, otherwise the error response to send. */
export async function adminSession(): Promise<{ session: Session; error?: never } | { session?: never; error: Response }> {
  const session = await currentSession();
  if (!session) return { error: unauthorized() };
  // 404 rather than 403, so the admin API doesn't advertise itself.
  if (!isPlatformAdmin(session.user)) return { error: json({ error: "Not found." }, 404) };
  return { session };
}
