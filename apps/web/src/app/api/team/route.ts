import { findAll, invites, users } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { effectivePlan } from "@/lib/entitlements";
import { json, unauthorized } from "@/lib/http";

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const companyId = session.company._id;
  const members = await findAll(users().where("companyId", "==", companyId).orderBy("createdAt"));

  const pending = can(session.role, "manageTeam")
    ? await findAll(invites().where("companyId", "==", companyId).orderBy("createdAt", "desc"))
    : [];

  return json({
    me: session.user._id,
    members: members.map((m) => ({
      id: m._id,
      name: m.name,
      email: m.email,
      role: m.role ?? "owner",
    })),
    invites: pending.map((i) => ({ id: i._id, email: i.email, role: i.role })),
    seats: { used: members.length + pending.length, max: effectivePlan(session.company).seats },
  });
}
