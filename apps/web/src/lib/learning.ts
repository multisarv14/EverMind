import { askCompany, AiError } from "@/lib/ai";
import {
  companies,
  conversations,
  feedback,
  findAll,
  insert,
  knowledge,
  learnings,
  messageId,
  messagesOf,
  readMessages,
  type CompanyRecord,
  type Id,
} from "@/lib/db";

const SCHEMA = {
  type: "object",
  properties: {
    facts: {
      type: "array",
      items: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
        additionalProperties: false,
      },
    },
  },
  required: ["facts"],
  additionalProperties: false,
};

const SYSTEM = `You are the learning module of EverMind, an AI Executive. You read recent conversations between a company's team and EverMind and extract DURABLE facts that would make future answers better.

Rules:
- Only include things the team explicitly said or clearly decided: what the company sells, who its customers are, pricing, constraints, goals, decisions, policies, preferred tone or format.
- If the team rated answers poorly, you may add a short "Preference: ..." line describing what they seem to want instead.
- Never guess or generalise. Never include passwords, keys, ID or bank numbers, health data or other personal sensitive data.
- Each fact is one clear sentence. At most 5 facts.
- Do not repeat anything already in the company knowledge or earlier suggestions.
- If there is nothing worth keeping, return an empty list.`;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** Reads recent activity for one company and stores new suggested facts for the owner to approve. */
export async function runLearning(company: CompanyRecord): Promise<{ created: number; note?: string }> {
  const since = company.lastLearningAt ?? new Date(Date.now() - 7 * 86_400_000);
  const convos = await findAll(
    conversations().where("companyId", "==", company._id).where("updatedAt", ">=", since).orderBy("updatedAt", "desc").limit(15)
  );

  const downs = await findAll(
    feedback()
      .where("companyId", "==", company._id)
      .where("rating", "==", "down")
      .where("createdAt", ">=", since)
      .orderBy("createdAt", "desc")
      .limit(5)
  );

  if (convos.length === 0) {
    await markRun(company._id);
    return { created: 0, note: "No new conversations to learn from." };
  }

  let transcript = "";
  for (const c of convos) {
    const lines = (await readMessages(c, 8)).map((m) => `${m.role === "user" ? "Team" : "EverMind"}: ${clip(m.content.replace(/\s+/g, " "), m.role === "user" ? 500 : 250)}`);
    transcript += `\n## ${clip(c.title, 80)}\n${lines.join("\n")}\n`;
    if (transcript.length > 14_000) break;
  }

  const poorly: string[] = [];
  for (const f of downs) {
    const m = (await messagesOf(f.conversationId).doc(messageId(f.messageIndex)).get()).data();
    if (m) poorly.push(`- ${clip(m.content.replace(/\s+/g, " "), 200)}`);
  }

  const known = await findAll(knowledge().where("companyId", "==", company._id).orderBy("updatedAt", "desc").limit(30));
  const earlier = await findAll(learnings().where("companyId", "==", company._id).orderBy("createdAt", "desc").limit(40));
  const existing = [
    ...known.map((k) => `${k.title}: ${clip(k.content.replace(/\s+/g, " "), 160)}`),
    ...earlier.map((l) => clip(l.text, 160)),
  ].join("\n");

  let facts: string[] = [];
  try {
    const text = await askCompany(company, {
      feature: "learning",
      system: SYSTEM,
      prompt: `Company: ${company.name}\n\nALREADY KNOWN OR SUGGESTED:\n${clip(existing, 5000) || "(nothing yet)"}\n\n${poorly.length ? `ANSWERS THE TEAM RATED POORLY:\n${poorly.join("\n")}\n\n` : ""}RECENT CONVERSATIONS:\n${transcript}`,
      maxTokens: 800,
      schema: SCHEMA,
      background: true,
    });
    facts = ((JSON.parse(text) as { facts?: { text?: string }[] }).facts ?? [])
      .map((f) => String(f.text ?? "").replace(/\s+/g, " ").trim())
      .filter((t) => t.length >= 8 && t.length <= 400)
      .slice(0, 5);
  } catch (error) {
    if (error instanceof AiError) throw error;
    return { created: 0, note: "The AI returned something unexpected; nothing was saved." };
  }

  const seen = new Set(earlier.map((l) => l.text.toLowerCase()));
  const fresh = facts.filter((f) => !seen.has(f.toLowerCase()));
  if (fresh.length) {
    const now = new Date();
    await Promise.all(fresh.map((text) => insert(learnings(), { companyId: company._id, text, status: "pending", createdAt: now })));
  }

  await markRun(company._id);
  return { created: fresh.length, note: fresh.length ? undefined : "Nothing new worth saving." };
}

async function markRun(companyId: Id) {
  await companies().doc(companyId).update({ lastLearningAt: new Date() });
}
