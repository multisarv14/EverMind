import { countOf, emailKey, emails, findById, insert, inviteKey, invites, isDuplicate, users } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { effectivePlan } from "@/lib/entitlements";
import { forbidden, json, readBody, unauthorized } from "@/lib/http";
import { appUrl, sendMail } from "@/lib/mail";
import { inviteEmail } from "@/lib/emails";
import { ROLE_LABEL } from "@/constants/team";

const ASSIGNABLE = ["admin", "member", "viewer"] as const;

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageTeam")) return forbidden();

  const body = await readBody(request);
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = String(body.role ?? "member");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return json({ error: "Please enter a valid email." }, 400);
  }
  if (!(ASSIGNABLE as readonly string[]).includes(role)) {
    return json({ error: "Invalid role." }, 400);
  }
  if (role === "admin" && session.role !== "owner") {
    return forbidden("Only the owner can invite admins.");
  }

  const companyId = session.company._id;
  const [members, pending] = await Promise.all([
    countOf(users().where("companyId", "==", companyId)),
    countOf(invites().where("companyId", "==", companyId)),
  ]);
  const plan = effectivePlan(session.company);
  if (members + pending >= plan.seats) {
    return json(
      { error: `Your ${plan.name} plan includes ${plan.seats} seats. Upgrade to add more people.`, code: "seats_full" },
      402
    );
  }

  if (await findById(emails(), emailKey(email))) {
    return json({ error: "That email already has an EverMind account." }, 409);
  }

  try {
    await insert(
      invites(),
      {
        companyId,
        email,
        role: role as (typeof ASSIGNABLE)[number],
        invitedBy: session.user._id,
        createdAt: new Date(),
      },
      inviteKey(companyId, email)
    );
  } catch (error) {
    if (isDuplicate(error)) {
      return json({ error: "That email is already invited." }, 409);
    }
    throw error;
  }

  const link = `${appUrl(request)}/signup?join=1&email=${encodeURIComponent(email)}`;
  const { sent } = await sendMail(inviteEmail(email, session.user.name, session.company.name, ROLE_LABEL[role as keyof typeof ROLE_LABEL], link));

  return json({ ok: true, emailed: sent }, 201);
}
