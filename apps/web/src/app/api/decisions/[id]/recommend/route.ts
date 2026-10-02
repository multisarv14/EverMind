import { decisions, knowledge } from "@/lib/db";
import { currentSession } from "@/lib/auth";
import { ask, aiErrorResponse } from "@/lib/ai";
import { systemPromptFor } from "@/lib/persona";
import { canEdit, forbidden, json, oid, unauthorized } from "@/lib/http";

// Asks EverMind (Claude) for a recommendation on a logged decision and stores it on the record.
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await currentSession();
  if (!session) return unauthorized();
  if (!canEdit(session)) return forbidden();

  const id = oid((await ctx.params).id);
  if (!id) return json({ error: "Not found." }, 404);

  const col = await decisions();
  const decision = await col.findOne({ _id: id, companyId: session.company._id });
  if (!decision) return json({ error: "Not found." }, 404);

  const kb = await (await knowledge()).find({ companyId: session.company._id }).sort({ updatedAt: -1 }).limit(20).toArray();

  try {
    const recommendation = await ask(session, {
      system:
        systemPromptFor({
          name: session.user.name,
          companyName: session.company.name,
          knowledge: kb.map((k) => ({ title: k.title, content: k.content })),
        }) +
        "\n\nYou are now advising on a logged company decision. Reply in Markdown with: **Recommendation** (one clear choice), **Why** (2-4 bullets), **Main risk**, and **First step**. Keep it under 250 words.",
      prompt: `Decision to make: ${decision.title}\n\nContext:\n${decision.context || "(none given)"}\n\nOptions considered:\n${decision.options || "(none listed — propose sensible options yourself)"}`,
      maxTokens: 1200,
    });

    await col.updateOne({ _id: id }, { $set: { aiRecommendation: recommendation, updatedAt: new Date() } });
    return json({ recommendation });
  } catch (error) {
    return aiErrorResponse(error) ?? json({ error: "Something went wrong." }, 500);
  }
}
