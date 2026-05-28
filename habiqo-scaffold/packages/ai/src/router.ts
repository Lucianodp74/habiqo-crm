/**
 * Tier routing — controls cost and latency by mapping each task
 * to the cheapest model that can do it well.
 *
 * Rules:
 *   - "fast"     → simple classification, extraction, short rewrites
 *   - "balanced" → conversational generation, structured output, tone-aware
 *   - "deep"     → multi-step reasoning, complex matching, agentic
 *
 * Never call deep when balanced will do. Never call balanced when fast will do.
 */

export type Tier = "fast" | "balanced" | "deep";
export type Provider = "anthropic" | "openai";

export const MODEL_BY_TIER: Record<Tier, { provider: Provider; model: string }> = {
  fast: { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
  balanced: { provider: "anthropic", model: "claude-sonnet-4-6" },
  deep: { provider: "anthropic", model: "claude-opus-4-7" },
};

/**
 * Fallback model used when the primary provider returns an error
 * that's classified as transient (rate limit, 5xx, timeout).
 */
export const FALLBACK_BY_TIER: Record<Tier, { provider: Provider; model: string }> = {
  fast: { provider: "openai", model: "gpt-4o-mini" },
  balanced: { provider: "openai", model: "gpt-4o" },
  deep: { provider: "openai", model: "gpt-4o" },
};

export type TaskName =
  | "classify_intent"
  | "extract_call_summary"
  | "extract_document_data"
  | "draft_whatsapp"
  | "draft_email"
  | "draft_listing_copy"
  | "generate_lead_insights"
  | "generate_valuation_narrative"
  | "match_properties"
  | "reason_about_pipeline";

export const TIER_BY_TASK: Record<TaskName, Tier> = {
  classify_intent: "fast",
  extract_call_summary: "fast",
  extract_document_data: "fast",
  draft_whatsapp: "balanced",
  draft_email: "balanced",
  draft_listing_copy: "balanced",
  generate_lead_insights: "balanced",
  generate_valuation_narrative: "balanced",
  match_properties: "deep",
  reason_about_pipeline: "deep",
};

/**
 * Per-1M-token costs in EUR. Update quarterly.
 * Used for cost attribution to agencies and budget caps.
 */
export const COST_PER_MTOK_EUR: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 0.7, output: 3.5 },
  "claude-sonnet-4-6": { input: 2.8, output: 14.0 },
  "claude-opus-4-7": { input: 14.0, output: 70.0 },
  "gpt-4o-mini": { input: 0.14, output: 0.56 },
  "gpt-4o": { input: 2.3, output: 9.3 },
};

export function computeCostEur(
  model: string,
  usage: { inputTokens: number; outputTokens: number },
): number {
  const rate = COST_PER_MTOK_EUR[model];
  if (!rate) return 0;
  return (
    (usage.inputTokens / 1_000_000) * rate.input +
    (usage.outputTokens / 1_000_000) * rate.output
  );
}
