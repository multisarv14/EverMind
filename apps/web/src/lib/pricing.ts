/**
 * What EverMind pays Anthropic for each model, and how that becomes "credits".
 *
 * Rates are US dollars per 1M tokens, which is the same number as micro-dollars per token.
 * Keep this table in step with Anthropic's price list; it is the only place model prices live.
 */
export interface ModelRates {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

export const MODEL_RATES: Record<string, ModelRates> = {
  "claude-fable-5-1": { input: 10, output: 50, cacheWrite: 12.5, cacheRead: 0.25 },
  "claude-opus-5-5": { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
};

// Unknown models are charged like the default model, so a typo never makes AI free.
const FALLBACK = MODEL_RATES["claude-opus-5-5"];

/**
 * One credit is the cost of one Opus token at a typical mix (85% input, 15% output):
 * 0.85 × $4 + 0.15 × $20 = $6.40 per 1M tokens. Cheaper models use fewer credits for the same work.
 */
export const MICROS_PER_CREDIT = 6.4;

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export const ratesFor = (model: string) => MODEL_RATES[model] ?? FALLBACK;

/** Cost of one call in micro-dollars (1,000,000 = $1). */
export function costMicros(model: string, u: TokenUsage) {
  const r = ratesFor(model);
  return (
    u.input_tokens * r.input +
    u.output_tokens * r.output +
    (u.cache_creation_input_tokens ?? 0) * r.cacheWrite +
    (u.cache_read_input_tokens ?? 0) * r.cacheRead
  );
}

export const creditsFor = (micros: number) => Math.ceil(micros / MICROS_PER_CREDIT);

/** GST added on top of every price shown in INR. */
export const GST_RATE = 0.18;

export const withGst = (inr: number) => Math.round(inr * (1 + GST_RATE) * 100) / 100;
