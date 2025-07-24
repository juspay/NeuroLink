/**
 * Enhanced Analytics Helper for All Providers
 * Ensures consistent analytics data format across providers
 * Integrates with Universal Evaluation System
 */

import type { UnknownRecord, JsonValue } from "../types/common.js";
import type { AnalyticsData as CoreAnalyticsData } from "../core/types.js";

// Type guard for checking if an unknown value is a number
function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

// Type guard for checking if an unknown value is an object
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Extended analytics data with additional provider helper features
export interface AnalyticsData extends CoreAnalyticsData {
  // Enhanced evaluation integration
  evaluation?: {
    relevanceScore: number;
    accuracyScore: number;
    completenessScore: number;
    overall: number;
    evaluationProvider?: string;
    evaluationTime?: number;
    evaluationAttempt?: number;
  };
  // Enhanced cost tracking
  costDetails?: UnknownRecord;
}

/**
 * Create standardized analytics data from provider response
 */
export function createAnalytics(
  provider: string,
  model: string,
  result: unknown,
  responseTime: number,
  context?: Record<string, unknown>,
): AnalyticsData {
  // Handle different token usage formats across providers
  const tokenUsage = ((result as UnknownRecord)?.usage as UnknownRecord) || {};

  // Standardize token field names across providers
  const inputTokens =
    (typeof tokenUsage.promptTokens === "number"
      ? tokenUsage.promptTokens
      : 0) ||
    (typeof tokenUsage.input_tokens === "number"
      ? tokenUsage.input_tokens
      : 0) ||
    (typeof tokenUsage.inputTokens === "number" ? tokenUsage.inputTokens : 0) ||
    0;
  const outputTokens =
    (typeof tokenUsage.completionTokens === "number"
      ? tokenUsage.completionTokens
      : 0) ||
    (typeof tokenUsage.output_tokens === "number"
      ? tokenUsage.output_tokens
      : 0) ||
    (typeof tokenUsage.outputTokens === "number"
      ? tokenUsage.outputTokens
      : 0) ||
    0;
  const totalTokens =
    (typeof tokenUsage.totalTokens === "number" ? tokenUsage.totalTokens : 0) ||
    (typeof tokenUsage.total_tokens === "number"
      ? tokenUsage.total_tokens
      : 0) ||
    inputTokens + outputTokens ||
    0;

  // Simple cost estimation for synchronous use
  const estimatedCost = totalTokens > 0 ? totalTokens * 0.00001 : 0;

  return {
    provider,
    model,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
    },
    cost: estimatedCost,
    responseTime,
    timestamp: new Date().toISOString(),
    context: context as Record<string, JsonValue> | undefined,
  };
}

/**
 * Create enhanced analytics data with accurate cost calculations (async version)
 */
export async function createEnhancedAnalytics(
  provider: string,
  model: string,
  result: unknown,
  responseTime: number,
  context?: Record<string, unknown>,
): Promise<AnalyticsData> {
  // Handle different token usage formats across providers
  const tokenUsage = ((result as UnknownRecord)?.usage as UnknownRecord) || {};

  // Standardize token field names across providers
  const inputTokens =
    (typeof tokenUsage.promptTokens === "number"
      ? tokenUsage.promptTokens
      : 0) ||
    (typeof tokenUsage.input_tokens === "number"
      ? tokenUsage.input_tokens
      : 0) ||
    (typeof tokenUsage.inputTokens === "number" ? tokenUsage.inputTokens : 0) ||
    0;
  const outputTokens =
    (typeof tokenUsage.completionTokens === "number"
      ? tokenUsage.completionTokens
      : 0) ||
    (typeof tokenUsage.output_tokens === "number"
      ? tokenUsage.output_tokens
      : 0) ||
    (typeof tokenUsage.outputTokens === "number"
      ? tokenUsage.outputTokens
      : 0) ||
    0;
  const totalTokens =
    (typeof tokenUsage.totalTokens === "number" ? tokenUsage.totalTokens : 0) ||
    (typeof tokenUsage.total_tokens === "number"
      ? tokenUsage.total_tokens
      : 0) ||
    inputTokens + outputTokens ||
    0;

  // Enhanced cost calculation using provider configuration
  const { costDetails, estimatedCost } = await calculateEnhancedCost(
    provider,
    inputTokens,
    outputTokens,
  );

  return {
    provider,
    model,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
    },
    cost: estimatedCost,
    responseTime,
    timestamp: new Date().toISOString(),
    context: context as Record<string, JsonValue> | undefined,
    costDetails,
  };
}

/**
 * Calculate enhanced cost details using provider configurations
 */
export async function calculateEnhancedCost(
  provider: string,
  inputTokens: number,
  outputTokens: number,
): Promise<{ costDetails: UnknownRecord; estimatedCost: number }> {
  try {
    // Import provider configuration dynamically
    const { getProviderConfig } = await import(
      "../core/evaluation-providers.js"
    );
    const providerConfig = getProviderConfig(provider);

    if (!providerConfig?.costPerToken) {
      // Fallback to rough estimation
      const estimatedCost = (inputTokens + outputTokens) * 0.00001;
      return {
        costDetails: {
          inputCost: inputTokens * 0.00001,
          outputCost: outputTokens * 0.00001,
          totalCost: estimatedCost,
          currency: "USD",
        },
        estimatedCost,
      };
    }

    // Use accurate provider costs
    const inputCost = inputTokens * providerConfig.costPerToken.input;
    const outputCost = outputTokens * providerConfig.costPerToken.output;
    const totalCost = inputCost + outputCost;

    return {
      costDetails: {
        inputCost,
        outputCost,
        totalCost,
        currency: "USD",
      },
      estimatedCost: totalCost,
    };
  } catch (error) {
    // Fallback on error
    const estimatedCost = (inputTokens + outputTokens) * 0.00001;
    return {
      costDetails: {
        inputCost: inputTokens * 0.00001,
        outputCost: outputTokens * 0.00001,
        totalCost: estimatedCost,
        currency: "USD",
      },
      estimatedCost,
    };
  }
}

/**
 * Enhance analytics with evaluation data
 */
export function enhanceAnalyticsWithEvaluation(
  analytics: AnalyticsData,
  evaluationResult: UnknownRecord,
): AnalyticsData {
  // Helper function to safely extract number values with fallback
  const getNumberValue = (obj: UnknownRecord, ...keys: string[]): number => {
    for (const key of keys) {
      const value = obj[key];
      if (isNumber(value)) {
        return value;
      }
    }
    return 1; // Default minimum score
  };

  // Helper function to safely extract evaluation config cost
  const getEvaluationCost = (obj: UnknownRecord): number => {
    const evaluationConfig = obj.evaluationConfig;
    if (isRecord(evaluationConfig)) {
      const costEstimate = evaluationConfig.costEstimate;
      return isNumber(costEstimate) ? costEstimate : 0;
    }
    return 0;
  };

  // Helper function to safely get existing total cost
  const getExistingTotalCost = (
    costDetails: UnknownRecord | undefined,
  ): number => {
    if (!costDetails) {
      return 0;
    }
    const totalCost = costDetails.totalCost;
    return isNumber(totalCost) ? totalCost : 0;
  };

  const evaluationCost = getEvaluationCost(evaluationResult);

  return {
    ...analytics,
    evaluation: {
      relevanceScore: getNumberValue(
        evaluationResult,
        "relevance",
        "relevanceScore",
      ),
      accuracyScore: getNumberValue(
        evaluationResult,
        "accuracy",
        "accuracyScore",
      ),
      completenessScore: getNumberValue(
        evaluationResult,
        "completeness",
        "completenessScore",
      ),
      overall: getNumberValue(evaluationResult, "overall"),
      evaluationProvider:
        typeof evaluationResult.evaluationProvider === "string"
          ? evaluationResult.evaluationProvider
          : undefined,
      evaluationTime: isNumber(evaluationResult.evaluationTime)
        ? evaluationResult.evaluationTime
        : undefined,
      evaluationAttempt: isNumber(evaluationResult.evaluationAttempt)
        ? evaluationResult.evaluationAttempt
        : undefined,
    },
    // Add evaluation cost if available
    costDetails: analytics.costDetails
      ? {
          ...analytics.costDetails,
          evaluationCost,
          totalCost:
            getExistingTotalCost(analytics.costDetails) + evaluationCost,
        }
      : undefined,
  };
}
