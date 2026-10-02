import { invites, users } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { planOf } from "@/lib/plans";
import { json, unauthorized } from "@/lib/http";

export async function GET() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const companyId = session.company._id;
  const members = await (await users())
    .find({ companyId }, { projection: { name: 1, email: 1, role: 1, createdAt: 1 } })
    .sort({ createdAt: 1 })
    .toArray();

  const pending = can(session.role, "manageTeam")
    ? await (await invites()).find({ companyId }).sort({ createdAt: -1 }).toArray()
    : [];

  return json({
    me: session.user._id.toString(),
    members: members.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      email: m.email,
      role: m.role ?? "owner",
    })),
    invites: pending.map((i) => ({ id: i._id.toString(), email: i.email, role: i.role })),
    seats: { used: members.length + pending.length, max: planOf(session.company.plan).seats },
  });
}
