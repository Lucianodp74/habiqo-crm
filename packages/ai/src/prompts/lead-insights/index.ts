/**
 * Current version of the lead-insights prompt. To roll out a new
 * version, create v2.ts and switch the export below.
 *
 * VERSION is logged into ai_actions_log so we can correlate prompt
 * changes with quality and cost shifts.
 */

export {
  VERSION,
  SYSTEM_PROMPT,
  buildPrompt,
  leadInsightsSchema,
  type LeadInsightsInput,
  type LeadInsightsOutput,
} from "./v1";
