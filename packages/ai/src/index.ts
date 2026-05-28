export {
  generateStructured,
  generatePlain,
  generateStream,
  setAiLogSink,
  type AiCallContext,
  type AiLogEntry,
  type AiUsage,
  type GenerateInput,
  type LogSink,
} from "./client";

export {
  TIER_BY_TASK,
  MODEL_BY_TIER,
  FALLBACK_BY_TIER,
  COST_PER_MTOK_EUR,
  computeCostEur,
  type TaskName,
  type Tier,
  type Provider,
} from "./router";

export * as leadInsightsPrompt from "./prompts/lead-insights";
