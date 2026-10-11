import type { Session } from "@/lib/auth";
import type { CompanyRecord, Id } from "@/lib/db";
import { recordSpend, spendBlock } from "@/lib/entitlements";
import { rateLimit } from "@/lib/ratelimit";
import { AI_NOT_CONFIGURED, aiConfig, complete, describeLlmError } from "@/lib/llm";

export class AiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

/** One non-streaming AI call, with the same plan-limit and usage accounting as chat. */
export interface AskOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
  schema?: Record<string, unknown>;
  /** Use the model saved for background jobs (learningModel) instead of the main one. */
  background?: boolean;
  /** What the call is for, recorded with its cost (e.g. "tasks", "learning"). */
  feature?: string;
  userId?: Id;
}

export const ask = (session: Session, opts: AskOptions) => askCompany(session.company, { userId: session.user._id, ...opts });

export async function askCompany(company: CompanyRecord, opts: AskOptions): Promise<string> {
  const cfg = await aiConfig();
  if (!cfg) throw new AiError(AI_NOT_CONFIGURED, 503, "ai_not_configured");

  const burst = await rateLimit(`ai:company:${company._id}`, 60, 600);
  if (!burst.ok) {
    throw new AiError("EverMind is being asked a lot right now. Please wait a minute and try again.", 429, "rate_limited");
  }

  const blocked = await spendBlock(company);
  if (blocked) throw new AiError(blocked.message, 402, "limit_reached");

  const model = opts.background ? cfg.learningModel : cfg.model;
  try {
    const response = await complete(cfg, {
      model,
      maxTokens: opts.maxTokens ?? 2000,
      system: opts.system,
      prompt: opts.prompt,
      schema: opts.schema,
    });

    await recordSpend(company, { model, usage: response.usage, feature: opts.feature ?? "action", userId: opts.userId });

    if (response.refused) {
      throw new AiError("EverMind can't help with that request.", 422, "refusal");
    }

    return response.text;
  } catch (error) {
    if (error instanceof AiError) throw error;
    console.error("ai error:", error);
    const { message, status } = describeLlmError(error);
    throw new AiError(message, status);
  }
}

export const aiErrorResponse = (error: unknown) =>
  error instanceof AiError
    ? Response.json({ error: error.message, code: error.code }, { status: error.status })
    : null;
