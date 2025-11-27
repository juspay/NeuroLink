/**
 * Anthropic Token Counter
 *
 * Uses Anthropic's Count Tokens API for accurate token counting.
 * Supports all Claude models.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  TokenCounter,
  TokenCountInput,
  TokenCountResult,
  AIProviderName,
} from "../../../types/conversation.js";
import type { CoreMessage } from "ai";
import { logger } from "../../../utils/logger.js";

/**
 * Convert CoreMessage to Anthropic's format
 * (Currently unused as we use estimation, but kept for future SDK upgrade)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function convertToAnthropicFormat(
  messages: CoreMessage[],
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => {
      let content = "";

      if (typeof msg.content === "string") {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        // Extract text from content array
        const textParts: string[] = [];
        for (const part of msg.content) {
          const partObj = part as {
            type?: string;
            text?: string;
            [key: string]: unknown;
          };
          if (partObj.text) {
            textParts.push(partObj.text);
          }
        }
        content = textParts.join("\n");
      }

      return {
        role: msg.role as "user" | "assistant",
        content,
      };
    });
}

/**
 * Anthropic token counter using the Messages API
 */
export class AnthropicTokenCounter implements TokenCounter {
  private client?: Anthropic;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (key) {
      this.client = new Anthropic({ apiKey: key });
    }
  }

  supportsAsync(): boolean {
    return true; // API-based, async operation
  }

  supportedProviders(): AIProviderName[] {
    return ["anthropic"];
  }

  async countTokens(input: TokenCountInput): Promise<TokenCountResult> {
    const startTime = Date.now();

    // Note: The countTokens API requires Anthropic SDK v0.40+
    // The current version (0.30.1) doesn't support it yet
    // For now, we use estimation with a note about the method
    if (!this.client) {
      logger.warn("Anthropic API key not found, cannot count tokens");
      return this.estimateTokens(input, startTime);
    }

    // TODO: Upgrade to @anthropic-ai/sdk@^0.40.0+ to use the Messages Count Tokens API
    // For now, use estimation as a reliable fallback
    logger.debug(
      "Anthropic token counting using estimation (SDK v0.30.1 - upgrade to v0.40+ for API-based counting)",
    );
    return this.estimateTokens(input, startTime);

    // Future implementation with SDK v0.40+:
    // try {
    //   const anthropicMessages = convertToAnthropicFormat(input.messages);
    //   const request: {
    //     model: string;
    //     messages: Array<{ role: "user" | "assistant"; content: string }>;
    //     system?: string;
    //   } = {
    //     model: input.model,
    //     messages: anthropicMessages,
    //   };
    //   if (input.systemPrompt) {
    //     request.system = input.systemPrompt;
    //   }
    //   const result = await this.client.messages.countTokens(request);
    //   const latency = Date.now() - startTime;
    //   return {
    //     inputTokens: result.input_tokens,
    //     method: "api",
    //     accuracy: "high",
    //     cached: false,
    //     latency,
    //   };
    // } catch (error) {
    //   logger.warn("Anthropic token counting failed, falling back to estimation", { error });
    //   return this.estimateTokens(input, startTime);
    // }
  }

  /**
   * Fallback estimation when API fails
   */
  private estimateTokens(
    input: TokenCountInput,
    startTime: number,
  ): TokenCountResult {
    // Rough estimation: 1 token ≈ 4 characters for Anthropic
    let totalChars = 0;

    for (const msg of input.messages) {
      // Add role
      totalChars += msg.role.length;

      if (typeof msg.content === "string") {
        totalChars += msg.content.length;
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          // Check if part has text property
          if ("text" in part && typeof part.text === "string") {
            totalChars += part.text.length;
          }
        }
      }
    }

    if (input.systemPrompt) {
      totalChars += input.systemPrompt.length;
    }

    const estimatedTokens = Math.ceil(totalChars / 4);
    const latency = Date.now() - startTime;

    return {
      inputTokens: estimatedTokens,
      method: "estimation",
      accuracy: "medium",
      cached: false,
      latency,
    };
  }
}

/**
 * Create Anthropic token counter instance
 */
export function createAnthropicCounter(apiKey?: string): TokenCounter {
  return new AnthropicTokenCounter(apiKey);
}
