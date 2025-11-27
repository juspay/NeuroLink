/**
 * Estimation Token Counter
 *
 * Fallback counter that uses character-based estimation
 * when provider-specific counting is not available.
 */

import type {
  TokenCounter,
  TokenCountInput,
  TokenCountResult,
  AIProviderName,
} from "../../../types/conversation.js";
import { messagesToText } from "../utils/messageNormalizer.js";
import { TokenUtils } from "../../../constants/tokens.js";

/**
 * Estimation-based token counter
 * Uses character-based estimation as a fallback
 */
export class EstimationTokenCounter implements TokenCounter {
  supportsAsync(): boolean {
    return false; // Synchronous operation
  }

  supportedProviders(): AIProviderName[] {
    // Supports all providers as fallback
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

  async countTokens(input: TokenCountInput): Promise<TokenCountResult> {
    const startTime = Date.now();

    // Extract all text from messages
    const messageText = messagesToText(input.messages);

    // Add system prompt if provided
    let totalText = messageText;
    if (input.systemPrompt) {
      totalText = `${input.systemPrompt}\n${messageText}`;
    }

    // Estimate tokens using existing utility
    const inputTokens = TokenUtils.estimateTokenCount(totalText, false);

    // Estimate output tokens (roughly 20% of input as a heuristic)
    const estimatedOutputTokens = Math.ceil(inputTokens * 0.2);

    const latency = Date.now() - startTime;

    return {
      inputTokens,
      estimatedOutputTokens,
      method: "estimation",
      accuracy: "low",
      cached: false,
      latency,
    };
  }
}

/**
 * Create estimation token counter instance
 */
export function createEstimationCounter(): TokenCounter {
  return new EstimationTokenCounter();
}
