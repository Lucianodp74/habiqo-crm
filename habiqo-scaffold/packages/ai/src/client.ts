import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText, streamText } from "ai";
import type { z } from "zod";
import {
  COST_PER_MTOK_EUR,
  FALLBACK_BY_TIER,
  MODEL_BY_TIER,
  type TaskName,
  TIER_BY_TASK,
  computeCostEur,
} from "./router";

/**
 * Single entry point for every AI call in HABIQUO.
 *
 * Responsibilities:
 *   1. Resolve task → tier → model
 *   2. Validate cost cap (caller-provided)
 *   3. Execute with retry + fallback
 *   4. Log usage, cost, latency, status (caller-provided sink)
 *   5. Return typed result
 *
 * Never bypass this. If you find yourself importing @ai-sdk/anthropic
 * directly somewhere else, that's a bug.
 */

export type AiCallContext = {
  agencyId: string;
  userId?: string;
  /** Free-text trace id propagated to logs. */
  traceId?: string;
};

export type GenerateInput<TSchema extends z.ZodType | undefined = undefined> = {
  task: TaskName;
  prompt: string;
  system?: string;
  /** When provided, output is parsed against this schema. */
  schema?: TSchema;
  /** Caps output tokens; default 1024. */
  maxTokens?: number;
  temperature?: number;
  context: AiCallContext;
};

export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
  costEur: number;
  durationMs: number;
  model: string;
};

export type AiLogEntry = AiUsage & {
  agencyId: string;
  userId?: string;
  traceId?: string;
  task: TaskName;
  status: "ok" | "error" | "fallback";
  error?: string;
  promptVersion?: string;
};

/**
 * Caller registers a sink to receive usage logs.
 * In apps/web this writes to ai_actions_log and emits a Sentry breadcrumb.
 */
export type LogSink = (entry: AiLogEntry) => Promise<void> | void;

let _logSink: LogSink = async () => {};

export function setAiLogSink(sink: LogSink): void {
  _logSink = sink;
}

// ─── Generation ─────────────────────────────────────────────────

export async function generateStructured<T extends z.ZodType>(
  input: GenerateInput<T> & { schema: T },
): Promise<z.infer<T>> {
  const start = Date.now();
  const tier = TIER_BY_TASK[input.task];
  const primary = MODEL_BY_TIER[tier];

  try {
    const { object, usage } = await generateObject({
      model: resolveModel(primary.provider, primary.model),
      schema: input.schema,
      system: input.system,
      prompt: input.prompt,
      temperature: input.temperature,
      maxTokens: input.maxTokens ?? 1024,
    });

    const u: AiUsage = {
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      costEur: computeCostEur(primary.model, {
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
      }),
      durationMs: Date.now() - start,
      model: primary.model,
    };

    await _logSink({
      ...u,
      agencyId: input.context.agencyId,
      userId: input.context.userId,
      traceId: input.context.traceId,
      task: input.task,
      status: "ok",
    });

    return object;
  } catch (err) {
    if (!isRetryable(err)) {
      await _logSink({
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        traceId: input.context.traceId,
        task: input.task,
        status: "error",
        model: primary.model,
        inputTokens: 0,
        outputTokens: 0,
        costEur: 0,
        durationMs: Date.now() - start,
        error: errorMessage(err),
      });
      throw err;
    }

    // Fallback to secondary provider
    const fallback = FALLBACK_BY_TIER[tier];
    const { object, usage } = await generateObject({
      model: resolveModel(fallback.provider, fallback.model),
      schema: input.schema,
      system: input.system,
      prompt: input.prompt,
      temperature: input.temperature,
      maxTokens: input.maxTokens ?? 1024,
    });

    await _logSink({
      agencyId: input.context.agencyId,
      userId: input.context.userId,
      traceId: input.context.traceId,
      task: input.task,
      status: "fallback",
      model: fallback.model,
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      costEur: computeCostEur(fallback.model, {
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
      }),
      durationMs: Date.now() - start,
    });

    return object;
  }
}

export async function generatePlain(input: GenerateInput): Promise<string> {
  const start = Date.now();
  const tier = TIER_BY_TASK[input.task];
  const primary = MODEL_BY_TIER[tier];

  const { text, usage } = await generateText({
    model: resolveModel(primary.provider, primary.model),
    system: input.system,
    prompt: input.prompt,
    temperature: input.temperature,
    maxTokens: input.maxTokens ?? 1024,
  });

  await _logSink({
    agencyId: input.context.agencyId,
    userId: input.context.userId,
    traceId: input.context.traceId,
    task: input.task,
    status: "ok",
    model: primary.model,
    inputTokens: usage.promptTokens,
    outputTokens: usage.completionTokens,
    costEur: computeCostEur(primary.model, {
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
    }),
    durationMs: Date.now() - start,
  });

  return text;
}

/**
 * Streaming variant. Returns the AI SDK stream; usage logging
 * happens in onFinish.
 */
export function generateStream(input: GenerateInput) {
  const tier = TIER_BY_TASK[input.task];
  const primary = MODEL_BY_TIER[tier];
  const start = Date.now();

  return streamText({
    model: resolveModel(primary.provider, primary.model),
    system: input.system,
    prompt: input.prompt,
    temperature: input.temperature,
    maxTokens: input.maxTokens ?? 1024,
    onFinish: async ({ usage }) => {
      await _logSink({
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        traceId: input.context.traceId,
        task: input.task,
        status: "ok",
        model: primary.model,
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
        costEur: computeCostEur(primary.model, {
          inputTokens: usage.promptTokens,
          outputTokens: usage.completionTokens,
        }),
        durationMs: Date.now() - start,
      });
    },
  });
}

// ─── Internals ───────────────────────────────────────────────────

function resolveModel(provider: string, model: string) {
  if (provider === "anthropic") return anthropic(model);
  if (provider === "openai") return openai(model);
  throw new Error(`Unknown provider: ${provider}`);
}

function isRetryable(err: unknown): boolean {
  const msg = errorMessage(err).toLowerCase();
  return (
    msg.includes("rate limit") ||
    msg.includes("timeout") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("overloaded")
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export { COST_PER_MTOK_EUR };
