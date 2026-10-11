import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { aiSettings, findById, type AiSettingsDoc } from "@/lib/db";
import { open } from "@/lib/secretBox";
import type { TokenUsage } from "@/lib/pricing";

/**
 * The one place that talks to an AI provider. The connection comes from the database (saved, encrypted, by
 * scripts/set-ai-key.mjs); without one it falls back to ANTHROPIC_API_KEY in the environment.
 * Groq, Gemini and OpenRouter all speak the OpenAI chat format, so one client covers them.
 */

export type Provider = AiSettingsDoc["provider"];

export interface AiConfig {
  provider: Provider;
  apiKey: string;
  model: string;
  learningModel: string;
}

const BASE_URLS: Record<Exclude<Provider, "anthropic">, string> = {
  groq: "https://api.groq.com/openai/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/",
  openrouter: "https://openrouter.ai/api/v1",
};

export const AI_NOT_CONFIGURED =
  "The AI is not configured yet. Connect it with: node --env-file=.env.local scripts/set-ai-key.mjs";

// Re-read the saved connection at most this often, so a new key is picked up without a restart.
const CACHE_MS = 30_000;
const g = globalThis as { __aiConfig?: { at: number; value: AiConfig | null } };

export async function aiConfig(): Promise<AiConfig | null> {
  if (g.__aiConfig && Date.now() - g.__aiConfig.at < CACHE_MS) return g.__aiConfig.value;

  let value: AiConfig | null = null;
  const saved = await findById(aiSettings(), "ai");
  if (saved) {
    try {
      value = { provider: saved.provider, apiKey: open(saved.key), model: saved.model, learningModel: saved.learningModel || saved.model };
    } catch (error) {
      console.error("The saved AI key could not be decrypted (is AI_KEY_SECRET the one it was saved with?):", error instanceof Error ? error.message : error);
    }
  } else if (process.env.ANTHROPIC_API_KEY) {
    const model = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
    value = { provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY, model, learningModel: process.env.ANTHROPIC_LEARNING_MODEL || model };
  }

  g.__aiConfig = { at: Date.now(), value };
  return value;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface LlmResult {
  text: string;
  usage: TokenUsage;
  refused: boolean;
}

interface CallInput {
  model: string;
  system: string;
  maxTokens: number;
  signal?: AbortSignal;
}

// Reasoning models (e.g. gpt-oss on Groq) think inside the output budget; leave them room so answers are not cut short.
const REASONING_ROOM = 2000;

const openaiClient = (cfg: AiConfig) =>
  new OpenAI({ apiKey: cfg.apiKey, baseURL: BASE_URLS[cfg.provider as Exclude<Provider, "anthropic">] });

const openaiUsage = (u: OpenAI.CompletionUsage | null | undefined, inChars: number, outChars: number): TokenUsage =>
  // Charge an estimate (about 4 characters per token) if a provider leaves usage out, so AI is never free by accident.
  u ? { input_tokens: u.prompt_tokens, output_tokens: u.completion_tokens } : { input_tokens: Math.ceil(inChars / 4), output_tokens: Math.ceil(outChars / 4) };

/** One answer to one prompt; with a schema the answer is JSON in that shape. */
export async function complete(
  cfg: AiConfig,
  input: CallInput & { prompt: string; schema?: Record<string, unknown> }
): Promise<LlmResult> {
  if (cfg.provider === "anthropic") {
    const response = await new Anthropic({ apiKey: cfg.apiKey }).messages.create(
      {
        model: input.model,
        max_tokens: input.maxTokens,
        system: input.system,
        messages: [{ role: "user", content: input.prompt }],
        ...(input.schema ? { output_config: { format: { type: "json_schema", schema: input.schema } } } : {}),
      } as Anthropic.MessageCreateParamsNonStreaming,
      { signal: input.signal }
    );
    return {
      text: response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim(),
      usage: response.usage,
      refused: response.stop_reason === "refusal",
    };
  }

  const response = await openaiClient(cfg).chat.completions.create(
    {
      model: input.model,
      max_tokens: input.maxTokens + REASONING_ROOM,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.prompt },
      ],
      ...(input.schema
        ? { response_format: { type: "json_schema" as const, json_schema: { name: "output", schema: input.schema, strict: true } } }
        : {}),
    },
    { signal: input.signal }
  );
  const choice = response.choices[0];
  const text = (choice?.message?.content ?? "").trim();
  return {
    text,
    usage: openaiUsage(response.usage, input.system.length + input.prompt.length, text.length),
    refused: choice?.finish_reason === "content_filter" || Boolean(choice?.message?.refusal),
  };
}

/** A chat reply, streamed: onText gets each piece as it arrives. */
export async function streamChat(
  cfg: AiConfig,
  input: CallInput & { messages: ChatTurn[]; onText: (delta: string) => void }
): Promise<Omit<LlmResult, "text">> {
  if (cfg.provider === "anthropic") {
    const response = new Anthropic({ apiKey: cfg.apiKey }).messages.stream(
      { model: input.model, max_tokens: input.maxTokens, system: input.system, messages: input.messages },
      { signal: input.signal }
    );
    response.on("text", input.onText);
    const final = await response.finalMessage();
    return { usage: final.usage, refused: final.stop_reason === "refusal" };
  }

  const stream = await openaiClient(cfg).chat.completions.create(
    {
      model: input.model,
      max_tokens: input.maxTokens + REASONING_ROOM,
      stream: true,
      stream_options: { include_usage: true },
      messages: [{ role: "system", content: input.system }, ...input.messages],
    },
    { signal: input.signal }
  );
  let usage: OpenAI.CompletionUsage | undefined;
  let refused = false;
  let outChars = 0;
  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    const delta = choice?.delta?.content;
    if (delta) {
      outChars += delta.length;
      input.onText(delta);
    }
    if (choice?.finish_reason === "content_filter") refused = true;
    if (chunk.usage) usage = chunk.usage;
  }
  const inChars = input.system.length + input.messages.reduce((n, m) => n + m.content.length, 0);
  return { usage: openaiUsage(usage, inChars, outChars), refused };
}

/** A message for the person and an HTTP status for a failed AI call. */
export function describeLlmError(error: unknown): { message: string; status: number } {
  if (error instanceof Anthropic.AuthenticationError || error instanceof OpenAI.AuthenticationError) {
    return { message: "The AI provider rejected the API key. Save a new one with scripts/set-ai-key.mjs.", status: 502 };
  }
  if (error instanceof Anthropic.RateLimitError || error instanceof OpenAI.RateLimitError) {
    return { message: "Too many requests right now. Please try again in a moment.", status: 429 };
  }
  if (error instanceof Anthropic.APIError || error instanceof OpenAI.APIError) {
    return { message: `The AI service returned an error (${error.status}).`, status: 502 };
  }
  return { message: "Something went wrong while contacting the AI.", status: 502 };
}
