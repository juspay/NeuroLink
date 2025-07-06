/**
 * NeuroLink Analytics System
 *
 * Provides lightweight analytics tracking for AI provider usage,
 * including tokens, costs, performance metrics, and custom context.
 */

import { logger } from "../utils/logger.js";

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
  context?: Record<string, any>;
  timestamp: string;
}

/**
 * Create analytics data structure from AI response
 */
export function createAnalytics(
  provider: string,
  model: string,
  result: any,
  responseTime: number,
  context?: Record<string, any>,
): AnalyticsData {
  const functionTag = "createAnalytics";

  try {
    // Extract token usage from different result formats
    const tokens = extractTokenUsage(result);

    // Estimate cost based on provider and tokens
    const cost = estimateCost(provider, model, tokens);

    const analytics: AnalyticsData = {
      provider,
      model,
      tokens,
      cost,
      responseTime,
      context,
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
      context,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Extract token usage from various AI result formats
 */
function extractTokenUsage(result: any): {
  input: number;
  output: number;
  total: number;
} {
  // Handle different response formats
  if (result.usage) {
    const usage = result.usage;

    // Standard format
    if (
      usage.promptTokens !== undefined &&
      usage.completionTokens !== undefined
    ) {
      return {
        input: usage.promptTokens || 0,
        output: usage.completionTokens || 0,
        total: usage.totalTokens || usage.promptTokens + usage.completionTokens,
      };
    }

    // Alternative formats
    if (usage.input_tokens !== undefined && usage.output_tokens !== undefined) {
      return {
        input: usage.input_tokens || 0,
        output: usage.output_tokens || 0,
        total: usage.total_tokens || usage.input_tokens + usage.output_tokens,
      };
    }

    // Generic tokens field
    if (typeof usage.tokens === "number") {
      return {
        input: 0,
        output: 0,
        total: usage.tokens,
      };
    }
  }

  // Fallback: estimate from text length
  const textLength = result.text?.length || result.content?.length || 0;
  const estimatedTokens = Math.ceil(textLength / 4); // ~4 chars per token

  return {
    input: 0,
    output: estimatedTokens,
    total: estimatedTokens,
  };
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
