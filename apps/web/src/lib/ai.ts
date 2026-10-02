import Anthropic from "@anthropic-ai/sdk";
import type { Session } from "@/lib/auth";
import type { CompanyRecord } from "@/lib/db";
import { planOf } from "@/lib/plans";
import { addTokens, tokensUsed } from "@/lib/usage";
import { rateLimit } from "@/lib/ratelimit";

export class AiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

/** One non-streaming Claude call, with the same plan-limit and usage accounting as chat. */
export interface AskOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
  schema?: Record<string, unknown>;
  /** Override the model (e.g. a cheaper one for background jobs). */
  model?: string;
}

export const ask = (session: Session, opts: AskOptions) => askCompany(session.company, opts);

export async function askCompany(company: CompanyRecord, opts: AskOptions): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiError(
      "The AI is not configured yet. Add ANTHROPIC_API_KEY to apps/web/.env.local and restart.",
      503,
      "ai_not_configured"
    );
  }

  const burst = await rateLimit(`ai:company:${company._id.toString()}`, 60, 600);
  if (!burst.ok) {
    throw new AiError("EverMind is being asked a lot right now. Please wait a minute and try again.", 429, "rate_limited");
  }

  const plan = planOf(company.plan);
  if ((await tokensUsed(company._id)) >= plan.monthlyTokens) {
    throw new AiError(
      `Your company has used all ${plan.monthlyTokens.toLocaleString()} tokens on the ${plan.name} plan this month. Upgrade to keep going.`,
      402,
      "limit_reached"
    );
  }

  try {
    const response = await new Anthropic().messages.create({
      model: opts.model ?? process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5",
      max_tokens: opts.maxTokens ?? 2000,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
      ...(opts.schema ? { output_config: { format: { type: "json_schema", schema: opts.schema } } } : {}),
    } as Anthropic.MessageCreateParamsNonStreaming);

    await addTokens(company._id, response.usage.input_tokens + response.usage.output_tokens);

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
