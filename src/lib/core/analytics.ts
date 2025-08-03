/**
 * NeuroLink Analytics System
 *
 * Provides lightweight analytics tracking for AI provider usage,
 * including tokens, costs, performance metrics, and custom context.
 */

import { logger } from "../utils/logger.js";
import type { JsonValue, UnknownRecord } from "../types/common.js";

export interface AnalyticsData {
  provider: string;
  model: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost?: number;
  responseTime: number;
  context?: Record<string, JsonValue>;
  timestamp: string;
  // Extended fields from analytics-helper consolidation
  evaluation?: {
    relevanceScore: number;
    accuracyScore: number;
    completenessScore: number;
    overall: number;
    evaluationProvider?: string;
    evaluationTime?: number;
    evaluationAttempt?: number;
  };
  costDetails?: UnknownRecord;
}

/**
 * Create analytics data structure from AI response
 */
export function createAnalytics(
  provider: string,
  model: string,
  result: unknown,
  responseTime: number,
  context?: Record<string, unknown>,
): AnalyticsData {
  const functionTag = "createAnalytics";

  try {
    // Extract token usage from different result formats
    const tokens = extractTokenUsage(result as UnknownRecord);

    // Estimate cost based on provider and tokens
    const cost = estimateCost(provider, model, tokens);

    const analytics: AnalyticsData = {
      provider,
      model,
      tokens,
      cost,
      responseTime,
      context: context as Record<string, JsonValue> | undefined,
      timestamp: new Date().toISOString(),
    };

    logger.debug(`[${functionTag}] Analytics created`, {
      provider,
      model,
      tokens: tokens.total,
      responseTime,
      cost,
    });

    return analytics;
  } catch (error) {
    logger.error(`[${functionTag}] Failed to create analytics`, { error });

    // Return minimal analytics on error
    return {
      provider,
      model,
      tokens: { input: 0, output: 0, total: 0 },
      responseTime,
      context: context as Record<string, JsonValue> | undefined,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Extract token usage from various AI result formats
 */
function extractTokenUsage(result: UnknownRecord): {
  input: number;
  output: number;
  total: number;
} {
  // Use properly typed usage object from BaseProvider or direct AI SDK
  if (
    result.usage &&
    typeof result.usage === "object" &&
    result.usage !== null
  ) {
    const usage = result.usage as Record<string, unknown>;

    // Try BaseProvider normalized format first (inputTokens/outputTokens)
    if (
      typeof usage.inputTokens === "number" ||
      typeof usage.outputTokens === "number"
    ) {
      const input =
        typeof usage.inputTokens === "number" ? usage.inputTokens : 0;
      const output =
        typeof usage.outputTokens === "number" ? usage.outputTokens : 0;
      const total =
        typeof usage.totalTokens === "number"
          ? usage.totalTokens
          : input + output;
      return { input, output, total };
    }

    // Try OpenAI/Mistral format (promptTokens/completionTokens)
    if (
      typeof usage.promptTokens === "number" ||
      typeof usage.completionTokens === "number"
    ) {
      const input =
        typeof usage.promptTokens === "number" ? usage.promptTokens : 0;
      const output =
        typeof usage.completionTokens === "number" ? usage.completionTokens : 0;
      const total =
        typeof usage.totalTokens === "number"
          ? usage.totalTokens
          : input + output;
      return { input, output, total };
    }

    // Handle total-only case
    if (typeof usage.totalTokens === "number") {
      return { input: 0, output: 0, total: usage.totalTokens };
    }
  }

  // Fallback for edge cases
  logger.debug("Token extraction failed: unknown usage format", { result });
  return { input: 0, output: 0, total: 0 };
}

/**
 * Estimate cost based on provider, model, and token usage
 */
function estimateCost(
  provider: string,
  model: string,
  tokens: { input: number; output: number; total: number },
): number | undefined {
  try {
    // Cost per 1K tokens (USD) - approximate rates as of 2024
    const costMap: Record<
      string,
      Record<string, { input: number; output: number }>
    > = {
      openai: {
        "gpt-4": { input: 0.03, output: 0.06 },
        "gpt-4-turbo": { input: 0.01, output: 0.03 },
        "gpt-3.5-turbo": { input: 0.0015, output: 0.002 },
      },
      anthropic: {
        "claude-3-opus": { input: 0.015, output: 0.075 },
        "claude-3-sonnet": { input: 0.003, output: 0.015 },
        "claude-3-haiku": { input: 0.00025, output: 0.00125 },
      },
      "google-ai": {
        "gemini-pro": { input: 0.00035, output: 0.00105 },
        "gemini-2.5-flash": { input: 0.000075, output: 0.0003 },
      },
    };

    const providerCosts = costMap[provider.toLowerCase()];
    if (!providerCosts) {
      return undefined;
    }

    // Find best matching model
    const modelKey = Object.keys(providerCosts).find(
      (key) =>
        model.toLowerCase().includes(key) || key.includes(model.toLowerCase()),
    );

    if (!modelKey) {
      return undefined;
    }

    const rates = providerCosts[modelKey];
    const inputCost = (tokens.input / 1000) * rates.input;
    const outputCost = (tokens.output / 1000) * rates.output;

    return Math.round((inputCost + outputCost) * 100000) / 100000; // Round to 5 decimal places
  } catch (error) {
    logger.debug("Cost estimation failed", { provider, model, error });
    return undefined;
  }
}
