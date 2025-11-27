/**
 * Mistral Token Counter
 *
 * Uses js-tiktoken approximation for Mistral models.
 * Provides fast client-side counting with ~90% accuracy.
 */

import { Tiktoken } from "js-tiktoken/lite";
import cl100k_base from "js-tiktoken/ranks/cl100k_base";
import type {
  TokenCounter,
  TokenCountInput,
  TokenCountResult,
  AIProviderName,
} from "../../../types/conversation.js";
import { messagesToText } from "../utils/messageNormalizer.js";

/**
 * Mistral token counter using tiktoken approximation
 * Mistral's tokenizer is similar to OpenAI's but not identical
 */
export class MistralTokenCounter implements TokenCounter {
  private encoding: Tiktoken;

  constructor() {
    // Use cl100k_base as approximation
    this.encoding = new Tiktoken(cl100k_base);
  }

  supportsAsync(): boolean {
    return false; // Client-side, synchronous operation
  }

  supportedProviders(): AIProviderName[] {
    return ["mistral"];
  }

  async countTokens(input: TokenCountInput): Promise<TokenCountResult> {
    const startTime = Date.now();

    try {
      let totalTokens = 0;

      // Count tokens for each message
      for (const message of input.messages) {
        // Add tokens for message structure
        totalTokens += 3; // Approximate overhead for Mistral

        // Count role tokens
        const roleTokens = this.encoding.encode(message.role).length;
        totalTokens += roleTokens;

        // Count content tokens
        if (typeof message.content === "string") {
          const contentTokens = this.encoding.encode(message.content).length;
          totalTokens += contentTokens;
        } else if (Array.isArray(message.content)) {
          for (const part of message.content) {
            const partObj = part as {
              type?: string;
              text?: string;
              [key: string]: unknown;
            };
            if (partObj.text) {
              const textTokens = this.encoding.encode(partObj.text).length;
              totalTokens += textTokens;
            }
          }
        }
      }

      // Add tokens for system prompt if provided
      if (input.systemPrompt) {
        totalTokens += 3; // Message structure
        const systemTokens = this.encoding.encode(input.systemPrompt).length;
        totalTokens += systemTokens;
      }

      // Add tokens for tools if provided
      if (input.tools && input.tools.length > 0) {
        const toolsText = JSON.stringify(input.tools);
        const toolTokens = this.encoding.encode(toolsText).length;
        totalTokens += toolTokens;
      }

      // Add small buffer for Mistral-specific formatting differences
      const adjustedTokens = Math.ceil(totalTokens * 1.05);

      const latency = Date.now() - startTime;

      return {
        inputTokens: adjustedTokens,
        method: "client",
        accuracy: "medium", // ~90% accuracy due to approximation
        cached: false,
        latency,
      };
    } catch {
      // Fallback to character estimation
      const messageText = messagesToText(input.messages);
      const totalText = input.systemPrompt
        ? `${input.systemPrompt}\n${messageText}`
        : messageText;

      const estimatedTokens = Math.ceil(totalText.length / 4);
      const latency = Date.now() - startTime;

      return {
        inputTokens: estimatedTokens,
        method: "estimation",
        accuracy: "low",
        cached: false,
        latency,
      };
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Note: Tiktoken instances from js-tiktoken/lite don't have a free() method
    // Memory will be automatically cleaned up by JavaScript GC
  }
}

/**
 * Create Mistral token counter instance
 */
export function createMistralCounter(): TokenCounter {
  return new MistralTokenCounter();
}
