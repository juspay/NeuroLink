/**
 * OpenAI Token Counter
 *
 * Uses js-tiktoken for client-side token counting for OpenAI and Azure OpenAI models.
 * Provides fast, accurate counting with <10ms latency.
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
 * OpenAI token counter using js-tiktoken
 */
export class OpenAITokenCounter implements TokenCounter {
  private encoding: Tiktoken;

  constructor() {
    // Initialize cl100k_base encoding (used by gpt-4, gpt-3.5-turbo, etc.)
    this.encoding = new Tiktoken(cl100k_base);
  }

  supportsAsync(): boolean {
    return false; // Client-side, synchronous operation
  }

  supportedProviders(): AIProviderName[] {
    return ["openai", "azure"];
  }

  async countTokens(input: TokenCountInput): Promise<TokenCountResult> {
    const startTime = Date.now();

    try {
      let totalTokens = 0;

      // Count tokens for each message
      for (const message of input.messages) {
        // Add tokens for message structure
        totalTokens += 4; // Every message follows <im_start>{role/name}\n{content}<im_end>\n

        // Count role tokens
        const roleTokens = this.encoding.encode(message.role).length;
        totalTokens += roleTokens;

        // Count content tokens
        if (typeof message.content === "string") {
          const contentTokens = this.encoding.encode(message.content).length;
          totalTokens += contentTokens;
        } else if (Array.isArray(message.content)) {
          // Handle multimodal content
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
            // Note: Images are counted separately by the API
            // We can't accurately count image tokens client-side
          }
        }
      }

      // Add tokens for system prompt if provided
      if (input.systemPrompt) {
        totalTokens += 4; // Message structure
        const systemTokens = this.encoding.encode(input.systemPrompt).length;
        totalTokens += systemTokens;
      }

      // Every reply is primed with <im_start>assistant
      totalTokens += 2;

      // Add tokens for tools if provided
      if (input.tools && input.tools.length > 0) {
        // Approximate tool definitions contribution
        const toolsText = JSON.stringify(input.tools);
        const toolTokens = this.encoding.encode(toolsText).length;
        totalTokens += toolTokens;
      }

      const latency = Date.now() - startTime;

      return {
        inputTokens: totalTokens,
        method: "client",
        accuracy: "high",
        cached: false,
        latency,
      };
    } catch {
      // Fallback to character estimation if encoding fails
      const messageText = messagesToText(input.messages);
      const totalText = input.systemPrompt
        ? `${input.systemPrompt}\n${messageText}`
        : messageText;

      // Rough estimation: 1 token ≈ 4 characters
      const estimatedTokens = Math.ceil(totalText.length / 4);

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
   * Clean up resources
   */
  dispose(): void {
    // Note: Tiktoken instances from js-tiktoken/lite don't have a free() method
    // Memory will be automatically cleaned up by JavaScript GC
  }
}

/**
 * Create OpenAI token counter instance
 */
export function createOpenAICounter(): TokenCounter {
  return new OpenAITokenCounter();
}
