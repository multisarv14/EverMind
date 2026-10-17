import { adminSession } from "@/lib/admin";
import { companies, findAll, upgradeRequests, users } from "@/lib/db";
import { effectivePlan } from "@/lib/entitlements";
import { json } from "@/lib/http";
import { creditsUsed, packBalance } from "@/lib/usage";

const LIMIT = 500;

export async function GET(request: Request) {
  const { error } = await adminSession(request, "companies");
  if (error) return error;

  const [list, people, requests] = await Promise.all([
    findAll(companies().orderBy("createdAt", "desc").limit(LIMIT)),
    findAll(users()),
    findAll(upgradeRequests()),
  ]);

  const members = new Map<string, number>();
  const owners = new Map<string, string>();
  for (const u of people) {
    if (!u.companyId) continue;
    members.set(u.companyId, (members.get(u.companyId) ?? 0) + 1);
    if (u.role === "owner") owners.set(u.companyId, u.email);
  }
  const requested = new Map(requests.map((r) => [r.companyId, r.plan]));

  const rows = await Promise.all(
    list.map(async (c) => {
      const plan = effectivePlan(c);
      const [used, packs] = await Promise.all([creditsUsed(c), packBalance(c._id)]);
      return {
        id: c._id,
        name: c.name,
        owner: owners.get(c._id) ?? null,
        industry: c.industry ?? null,
        teamSize: c.teamSize,
        plan: c.plan,
        effectivePlan: plan.id,
        members: members.get(c._id) ?? 0,
        seats: plan.seats,
        creditsUsed: used,
        allowance: plan.monthlyCredits,
        packBalance: packs,
        billingStatus: c.billing?.status ?? null,
        requestedPlan: requested.get(c._id) ?? null,
        createdAt: c.createdAt,
      };
    })
  );

  return json({ companies: rows, truncated: list.length === LIMIT });
}
