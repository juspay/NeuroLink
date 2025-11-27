/**
 * Token Counter Factory
 *
 * Provides intelligent provider selection and caching for token counting operations.
 * Handles graceful degradation and fallback strategies.
 */

import type {
  TokenCounter,
  TokenCountInput,
  TokenCountResult,
  AIProviderName,
} from "../../types/conversation.js";
import {
  createOpenAICounter,
  createGoogleCounter,
  createAnthropicCounter,
  createBedrockCounter,
  createMistralCounter,
  createEstimationCounter,
} from "./counters/index.js";
import {
  generateCacheKey,
  getCachedResult,
  setCachedResult,
  hashMessages,
  validateMessages,
} from "./utils/index.js";
import { logger } from "../../utils/logger.js";

/**
 * Counter instances cache (reuse counters across calls)
 */
const counterCache = new Map<AIProviderName, TokenCounter>();

/**
 * Get or create a counter for the specified provider
 */
function getCounter(provider: AIProviderName, apiKey?: string): TokenCounter {
  // Check cache first
  const cached = counterCache.get(provider);
  if (cached) {
    return cached;
  }

  // Create new counter based on provider
  let counter: TokenCounter;

  switch (provider) {
    case "openai":
    case "azure":
      counter = createOpenAICounter();
      break;

    case "google-ai":
    case "vertex":
      counter = createGoogleCounter(apiKey);
      break;

    case "anthropic":
      counter = createAnthropicCounter(apiKey);
      break;

    case "bedrock":
      counter = createBedrockCounter();
      break;

    case "mistral":
      counter = createMistralCounter();
      break;

    case "ollama":
    case "huggingface":
    case "litellm":
    case "sagemaker":
    case "openai-compatible":
    default:
      // Use estimation for unsupported providers
      counter = createEstimationCounter();
      break;
  }

  // Cache the counter
  counterCache.set(provider, counter);

  return counter;
}

/**
 * Count tokens with caching and provider selection
 */
export async function countTokens(
  provider: AIProviderName,
  input: TokenCountInput,
  apiKey?: string,
): Promise<TokenCountResult> {
  // Validate messages
  const validation = validateMessages(input.messages);
  if (!validation.valid) {
    logger.error("Invalid messages for token counting", {
      error: validation.error,
    });
    throw new Error(`Invalid messages: ${validation.error}`);
  }

  // Generate cache key
  const messagesHash = hashMessages(input.messages);
  const cacheKey = generateCacheKey(provider, input.model, messagesHash);

  // Check cache first
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult) {
    logger.debug("Token count cache hit", { provider, model: input.model });
    return cachedResult;
  }

  // Get counter for provider
  const counter = getCounter(provider, apiKey);

  try {
    // Count tokens
    const result = await counter.countTokens(input);

    // Cache the result
    setCachedResult(cacheKey, result);

    logger.debug("Token count completed", {
      provider,
      model: input.model,
      tokens: result.inputTokens,
      method: result.method,
      latency: result.latency,
    });

    return result;
  } catch (error) {
    logger.error("Token counting failed", { provider, error });

    // Fallback to estimation
    const estimationCounter = createEstimationCounter();
    const result = await estimationCounter.countTokens(input);

    logger.warn("Using estimation fallback for token counting", {
      provider,
      tokens: result.inputTokens,
    });

    return result;
  }
}

/**
 * Count tokens with automatic provider detection from model name
 */
export async function countTokensAuto(
  model: string,
  input: TokenCountInput,
  apiKey?: string,
): Promise<TokenCountResult> {
  // Detect provider from model name
  const provider = detectProviderFromModel(model);
  return countTokens(provider, input, apiKey);
}

/**
 * Detect provider from model name
 */
function detectProviderFromModel(model: string): AIProviderName {
  const lowerModel = model.toLowerCase();

  if (lowerModel.includes("gpt") || lowerModel.includes("o1")) {
    return "openai";
  }

  if (lowerModel.includes("claude")) {
    // Check if it's Bedrock (contains anthropic. prefix or arn:)
    if (
      lowerModel.includes("anthropic.") ||
      lowerModel.includes("arn:aws:bedrock")
    ) {
      return "bedrock";
    }
    // Check if it's Vertex (contains @ suffix)
    if (lowerModel.includes("@")) {
      return "vertex";
    }
    return "anthropic";
  }

  if (lowerModel.includes("gemini")) {
    // Vertex models typically have @ or version suffix
    if (lowerModel.includes("@")) {
      return "vertex";
    }
    return "google-ai";
  }

  if (lowerModel.includes("mistral")) {
    return "mistral";
  }

  if (lowerModel.includes("llama") || lowerModel.includes("ollama")) {
    return "ollama";
  }

  // Default to estimation
  return "openai-compatible";
}

/**
 * Clear all cached counters
 */
export function clearCounterCache(): void {
  counterCache.clear();
}

/**
 * Get supported providers
 */
export function getSupportedProviders(): AIProviderName[] {
  return [
    "openai",
    "azure",
    "anthropic",
    "google-ai",
    "vertex",
    "bedrock",
    "mistral",
    "ollama",
    "huggingface",
    "litellm",
    "sagemaker",
    "openai-compatible",
  ];
}
