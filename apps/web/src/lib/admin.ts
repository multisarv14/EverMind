import { getAuth } from "firebase-admin/auth";
import { currentSession } from "@/lib/auth";
import { firebaseApp, type UserDoc } from "@/lib/db";
import { forbidden, json, unauthorized } from "@/lib/http";

/**
 * Platform admins are the EverMind team, not a company's own admins. It is a flag on the user's
 * record, set with scripts/admin-users.mjs. No API route writes it, so no one can grant it from the app.
 */
export const isPlatformAdmin = (user: Pick<UserDoc, "platformAdmin">) => user.platformAdmin === true;

/**
 * Sections of the MultiSarv admin panel (core.multisarv.com). Its admins get a Firebase ID token for this
 * project from MultiSarv core, with the sections they may open in the `menus` claim.
 * Keep in sync with EVERMIND_MENUS in MultiSarv core (core/functions/src/projects.ts).
 */
export type PanelMenu = "dashboard" | "companies" | "users" | "upgrades";

/** Who is acting: a platform admin signed in to EverMind, or a MultiSarv panel admin. */
export interface AdminActor {
  email: string;
  name: string;
  via: "app" | "panel";
}

type AdminResult = { actor: AdminActor; error?: never } | { actor?: never; error: Response };

const bearer = (request?: Request) => {
  const header = request?.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
};

/**
 * A MultiSarv panel token: signed by Firebase for this project and issued by core with `panel` and
 * `admin` claims. Revocation isn't checked (that costs an Auth API call per request); core revokes the
 * refresh token when access changes, so an old token stops working within the hour.
 */
async function panelActor(token: string, menus: PanelMenu[]): Promise<AdminResult> {
  let claims: Record<string, unknown>;
  try {
    claims = await getAuth(firebaseApp()).verifyIdToken(token);
  } catch {
    return { error: unauthorized() };
  }
  if (claims.panel !== true || claims.admin !== true) return { error: forbidden() };
  const granted = Array.isArray(claims.menus) ? claims.menus : [];
  if (!granted.includes("*") && !menus.some((m) => granted.includes(m))) {
    return { error: forbidden("You don't have access to this section.") };
  }
  return { actor: { email: String(claims.adminEmail ?? ""), name: String(claims.adminName ?? ""), via: "panel" } };
}

/**
 * The admin making this request, otherwise the error response to send. A request with a bearer token
 * comes from the MultiSarv panel and needs one of `menus`; without one, the EverMind session must be a
 * platform admin's.
 */
export async function adminSession(request?: Request, ...menus: PanelMenu[]): Promise<AdminResult> {
  const token = bearer(request);
  if (token) return panelActor(token, menus);

  const session = await currentSession();
  if (!session) return { error: unauthorized() };
  // 404 rather than 403, so the admin API doesn't advertise itself.
  if (!isPlatformAdmin(session.user)) return { error: json({ error: "Not found." }, 404) };
  return { actor: { email: session.user.email, name: session.user.name, via: "app" } };
}
