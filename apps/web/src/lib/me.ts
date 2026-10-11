import { can, type Action } from "@/constants/team";
import type { Session } from "@/lib/auth";
import { PACKS, PLANS } from "@/lib/plans";
import { findById, upgradeRequests } from "@/lib/db";
import { spendStatus } from "@/lib/entitlements";
import { billingConfigured } from "@/lib/billing";
import { AGENT_IDS } from "@/constants/agentTraining";

/** Which specialist agents a company has switched on. Missing means all of them. */
export const enabledAgents = (list?: string[]) => (list ? AGENT_IDS.filter((id) => list.includes(id)) : AGENT_IDS);

/** Everything the UI needs to know about the signed-in user and their workspace. */
export async function buildMe(session: Session) {
  const spend = await spendStatus(session.company);
  const { plan } = spend;
  const billing = session.company.billing;
  const pending = await findById(upgradeRequests(), session.company._id);

  const actions: Action[] = ["chat", "createProject", "manageTeam", "manageBilling"];

  return {
    user: { name: session.user.name, email: session.user.email },
    company: {
      name: session.company.name,
      teamSize: session.company.teamSize,
      industry: session.company.industry ?? "",
      about: session.company.about ?? "",
    },
    agents: enabledAgents(session.company.agents),
    needsOnboarding: session.role === "owner" && Boolean(session.company.industry) && !session.company.agents,
    role: session.role,
    can: Object.fromEntries(actions.map((a) => [a, can(session.role, a)])) as Record<Action, boolean>,
    plan: { id: plan.id, name: plan.name, seats: plan.seats, topUps: plan.topUps },
    usage: {
      used: spend.used,
      limit: spend.allowance,
      packBalance: spend.packBalance,
      resetsAt: spend.window.end.toISOString(),
    },
    billing: {
      online: billingConfigured(),
      status: billing?.status ?? null,
      interval: billing?.interval ?? null,
      periodEnd: billing?.periodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: Boolean(billing?.cancelAtPeriodEnd),
      graceUntil: billing?.status === "past_due" ? (billing.graceUntil?.toISOString() ?? null) : null,
    },
    upgradeRequested: Boolean(pending),
    plans: Object.values(PLANS),
    packs: PACKS,
  };
}
