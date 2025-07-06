import type { EvaluationConfig } from "./types.js";
import {
  getAvailableProviders,
  sortProvidersByPreference,
  getProviderConfig,
} from "./evaluation-providers.js";
import { logger } from "../utils/logger.js";

/**
 * Parse evaluation configuration from environment variables
 */
export function parseEvaluationConfig(): EvaluationConfig {
  return {
    provider: process.env.NEUROLINK_EVALUATION_PROVIDER || "google-ai",
    model: process.env.NEUROLINK_EVALUATION_MODEL || "gemini-2.5-flash",
    mode: (process.env.NEUROLINK_EVALUATION_MODE as any) || "fast",
    fallbackEnabled:
      process.env.NEUROLINK_EVALUATION_FALLBACK_ENABLED !== "false",
    fallbackProviders: (
      process.env.NEUROLINK_EVALUATION_FALLBACK_PROVIDERS ||
      "openai,anthropic,vertex,bedrock"
    ).split(","),
    timeout: parseInt(process.env.NEUROLINK_EVALUATION_TIMEOUT || "10000"),
    maxTokens: parseInt(process.env.NEUROLINK_EVALUATION_MAX_TOKENS || "500"),
    temperature: parseFloat(
      process.env.NEUROLINK_EVALUATION_TEMPERATURE || "0.1",
    ),
    preferCheap: process.env.NEUROLINK_EVALUATION_PREFER_CHEAP !== "false",
    maxCostPerEval: parseFloat(
      process.env.NEUROLINK_EVALUATION_MAX_COST_PER_EVAL || "0.01",
    ),
    retryAttempts: parseInt(
      process.env.NEUROLINK_EVALUATION_RETRY_ATTEMPTS || "2",
    ),
  };
}

/**
 * Get intelligent provider fallback order
 */
export function getProviderFallbackOrder(config: EvaluationConfig): string[] {
  const available = getAvailableProviders();
  const sorted = sortProvidersByPreference(available, config.preferCheap);

  // Start with user's preferred provider
  const fallbackOrder = [config.provider];

  // Add configured fallbacks
  config.fallbackProviders.forEach((provider) => {
    if (!fallbackOrder.includes(provider)) {
      fallbackOrder.push(provider);
    }
  });

  // Add remaining available providers
  sorted.forEach((providerConfig) => {
    if (!fallbackOrder.includes(providerConfig.provider)) {
      fallbackOrder.push(providerConfig.provider);
    }
  });

  logger.debug("[EvaluationConfig] Provider fallback order:", fallbackOrder);
  return fallbackOrder;
}

/**
 * Estimate evaluation cost
 */
export function estimateEvaluationCost(
  providerName: string,
  mode: string,
  promptLength: number,
  expectedResponseLength: number = 200,
): number {
  const config = getProviderConfig(providerName);
  if (!config || !config.costPerToken) {
    return 0;
  }

  const inputTokens = Math.ceil(promptLength / 4); // Rough token estimation
  const outputTokens = expectedResponseLength / 4;

  return (
    inputTokens * config.costPerToken.input +
    outputTokens * config.costPerToken.output
  );
}

/**
 * Validate evaluation configuration
 */
export function validateEvaluationConfig(config: EvaluationConfig): string[] {
  const errors: string[] = [];

  // Validate provider
  if (!getProviderConfig(config.provider)) {
    errors.push(`Invalid provider: ${config.provider}`);
  }

  // Validate mode
  if (!["fast", "balanced", "quality"].includes(config.mode)) {
    errors.push(
      `Invalid mode: ${config.mode}. Must be 'fast', 'balanced', or 'quality'`,
    );
  }

  // Validate timeout
  if (config.timeout <= 0 || config.timeout > 60000) {
    errors.push(
      `Invalid timeout: ${config.timeout}. Must be between 1 and 60000ms`,
    );
  }

  // Validate max tokens
  if (config.maxTokens <= 0 || config.maxTokens > 4000) {
    errors.push(
      `Invalid maxTokens: ${config.maxTokens}. Must be between 1 and 4000`,
    );
  }

  // Validate temperature
  if (config.temperature < 0 || config.temperature > 2) {
    errors.push(
      `Invalid temperature: ${config.temperature}. Must be between 0 and 2`,
    );
  }

  // Validate max cost
  if (config.maxCostPerEval <= 0) {
    errors.push(
      `Invalid maxCostPerEval: ${config.maxCostPerEval}. Must be greater than 0`,
    );
  }

  // Validate retry attempts
  if (config.retryAttempts < 0 || config.retryAttempts > 5) {
    errors.push(
      `Invalid retryAttempts: ${config.retryAttempts}. Must be between 0 and 5`,
    );
  }

  return errors;
}

/**
 * Get configuration with validation and defaults
 */
export function getValidatedEvaluationConfig(): EvaluationConfig {
  const config = parseEvaluationConfig();
  const errors = validateEvaluationConfig(config);

  if (errors.length > 0) {
    logger.warn("[EvaluationConfig] Configuration validation errors:", errors);
    // Return default configuration if validation fails
    return {
      provider: "google-ai",
      model: "gemini-2.5-flash",
      mode: "fast",
      fallbackEnabled: true,
      fallbackProviders: ["openai", "anthropic"],
      timeout: 10000,
      maxTokens: 500,
      temperature: 0.1,
      preferCheap: true,
      maxCostPerEval: 0.01,
      retryAttempts: 2,
    };
  }

  return config;
}

/**
 * Check if evaluation is enabled for the current configuration
 */
export function isEvaluationEnabled(): boolean {
  // Check if at least one provider is available
  const available = getAvailableProviders();
  return available.length > 0;
}

/**
 * Get cost-optimized provider based on configuration
 */
export function getCostOptimizedProvider(
  config: EvaluationConfig,
): string | null {
  const available = getAvailableProviders();
  if (available.length === 0) {
    return null;
  }

  const sorted = sortProvidersByPreference(available, true); // Always prefer cheap for cost optimization

  // Find the cheapest provider that meets cost requirements
  for (const providerConfig of sorted) {
    const estimatedCost = estimateEvaluationCost(
      providerConfig.provider,
      config.mode,
      1000,
    );
    if (estimatedCost <= config.maxCostPerEval) {
      return providerConfig.provider;
    }
  }

  // If no provider meets cost requirements, return the cheapest one
  return sorted[0].provider;
}
