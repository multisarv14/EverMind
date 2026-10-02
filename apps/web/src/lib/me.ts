import { can, type Action } from "@/constants/team";
import type { Session } from "@/lib/auth";
import { tokensUsed } from "@/lib/usage";
import { PLANS, planOf } from "@/lib/plans";
import { upgradeRequests } from "@/lib/db";
import { AGENT_IDS } from "@/constants/agentTraining";

/** Which specialist agents a company has switched on. Missing means all of them. */
export const enabledAgents = (list?: string[]) => (list ? AGENT_IDS.filter((id) => list.includes(id)) : AGENT_IDS);

/** Everything the UI needs to know about the signed-in user and their workspace. */
export async function buildMe(session: Session) {
  const plan = planOf(session.company.plan);
  const used = await tokensUsed(session.company._id);
  const pending = await (await upgradeRequests()).findOne({ companyId: session.company._id });

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
    plan: { id: plan.id, name: plan.name, seats: plan.seats },
    usage: { used, limit: plan.monthlyTokens },
    upgradeRequested: Boolean(pending),
    plans: Object.values(PLANS),
  };
}
