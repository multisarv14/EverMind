import { companies } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { can } from "@/constants/team";
import { AGENT_IDS } from "@/constants/agentTraining";
import { forbidden, json, readBody, unauthorized } from "@/lib/http";

// Choose which specialist agents the company uses (owner or admin).
export async function PATCH(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!can(session.role, "manageTeam")) return forbidden("Only an owner or admin can change the AI team.");

  const body = await readBody(request);
  const list = Array.isArray(body.agents) ? body.agents.map(String) : [];
  const agents = AGENT_IDS.filter((id) => list.includes(id));
  if (agents.length === 0) return json({ error: "Choose at least one agent." }, 400);

  await companies().doc(session.company._id).update({ agents });
  return json({ agents });
}
