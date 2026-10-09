import { currentSession } from "@/lib/auth";
import { ask, aiErrorResponse } from "@/lib/ai";
import { AGENT_IDS, AGENT_TRAINING } from "@/constants/agentTraining";
import { industryById } from "@/constants/industries";
import { json, unauthorized } from "@/lib/http";

const SCHEMA = {
  type: "object",
  properties: {
    agents: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string", enum: AGENT_IDS }, reason: { type: "string" } },
        required: ["id", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["agents"],
  additionalProperties: false,
};

// EverMind reads what the company does and recommends which specialists it needs.
export async function POST() {
  const session = await currentSession();
  if (!session) return unauthorized();

  const { company } = session;
  const industry = industryById(company.industry)?.label ?? "not specified";
  const catalogue = AGENT_IDS.map((id) => `- ${id}: ${AGENT_TRAINING[id].name} — ${AGENT_TRAINING[id].mission}`).join("\n");

  try {
    const text = await ask(session, {
      feature: "agents",
      system:
        "You help a company choose which of EverMind's specialist agents to switch on. Pick 4 to 8 agents that matter most for this specific business, most important first. For each, give a reason (max 16 words) specific to what the company does, not generic. Only use the agent ids provided. Reply only with JSON matching the schema.",
      prompt: `Company: ${company.name}\nIndustry: ${industry}\nTeam size: ${company.teamSize}\nWhat the company does: ${company.about || "(not described)"}\n\nAvailable agents:\n${catalogue}`,
      maxTokens: 900,
      schema: SCHEMA,
    });

    const parsed = JSON.parse(text) as { agents?: { id?: string; reason?: string }[] };
    const seen = new Set<string>();
    const picks = (parsed.agents ?? []).flatMap((a) => {
      const id = String(a.id ?? "");
      if (!AGENT_IDS.includes(id) || seen.has(id)) return [];
      seen.add(id);
      return [{ id, reason: String(a.reason ?? "").slice(0, 160) }];
    });

    if (picks.length === 0) return json({ error: "EverMind couldn't decide. Try describing your business in a bit more detail." }, 422);
    return json({ picks });
  } catch (error) {
    return aiErrorResponse(error) ?? json({ error: "EverMind returned something unexpected. Please try again." }, 502);
  }
}
