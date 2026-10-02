import Anthropic from "@anthropic-ai/sdk";
import type { Session } from "@/lib/auth";
import { planOf } from "@/lib/plans";
import { addTokens, tokensUsed } from "@/lib/usage";

export class AiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

/** One non-streaming Claude call, with the same plan-limit and usage accounting as chat. */
export async function ask(
  session: Session,
  opts: { system: string; prompt: string; maxTokens?: number; schema?: Record<string, unknown> }
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiError(
      "The AI is not configured yet. Add ANTHROPIC_API_KEY to apps/web/.env.local and restart.",
      503,
      "ai_not_configured"
    );
  }

  const plan = planOf(session.company.plan);
  if ((await tokensUsed(session.company._id)) >= plan.monthlyTokens) {
    throw new AiError(
      `Your company has used all ${plan.monthlyTokens.toLocaleString()} tokens on the ${plan.name} plan this month. Upgrade to keep going.`,
      402,
      "limit_reached"
    );
  }

  try {
    const response = await new Anthropic().messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5",
      max_tokens: opts.maxTokens ?? 2000,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
      ...(opts.schema ? { output_config: { format: { type: "json_schema", schema: opts.schema } } } : {}),
    } as Anthropic.MessageCreateParamsNonStreaming);

    await addTokens(session.company._id, response.usage.input_tokens + response.usage.output_tokens);

    if (response.stop_reason === "refusal") {
      throw new AiError("EverMind can't help with that request.", 422, "refusal");
    }

    return response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
  } catch (error) {
    if (error instanceof AiError) throw error;
    console.error("ai error:", error);
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AiError("The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.", 502);
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new AiError("Too many requests right now. Please try again in a moment.", 429);
    }
    if (error instanceof Anthropic.APIError) {
      throw new AiError(`The AI service returned an error (${error.status}).`, 502);
    }
    throw new AiError("Something went wrong while contacting the AI.", 502);
  }
}

export const aiErrorResponse = (error: unknown) =>
  error instanceof AiError
    ? Response.json({ error: error.message, code: error.code }, { status: error.status })
    : null;
