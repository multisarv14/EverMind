import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { companies, findById, insert, users, type CompanyRecord, type Id, type UserRecord } from "@/lib/db";
import { docId } from "@/lib/http";
import type { Role } from "@/constants/team";

export const SESSION_COOKIE = "evermind_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short (min 32 chars).");
  }
  return new TextEncoder().encode(value);
}

export async function startSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export interface Session {
  user: UserRecord & { companyId: Id; role: Role };
  company: CompanyRecord;
  role: Role;
}

/** Signed-in user + their company workspace + role, or null. Verifies the token. */
export async function currentSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    let user = await findById(users(), docId(payload.sub));
    if (!user) return null;

    // A password change/reset signs out every session that was issued before it.
    if (user.passwordChangedAt && (payload.iat ?? 0) * 1000 < user.passwordChangedAt.getTime()) return null;

    // Accounts created before workspaces existed get their own company, as owner.
    if (!user.companyId || !user.role) {
      const companyId = await insert(companies(), {
        name: user.companyName?.trim() || `${user.name}'s company`,
        teamSize: "Just me",
        plan: "free",
        lastLearningAt: null,
        createdAt: new Date(),
      });
      await users().doc(user._id).update({ companyId, role: "owner" });
      user = { ...user, companyId, role: "owner" };
    }

    const company = await findById(companies(), user.companyId);
    if (!company) return null;

    return {
      user: user as Session["user"],
      company,
      role: user.role as Role,
    };
  } catch {
    return null;
  }
}
