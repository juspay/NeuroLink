/**
 * Google Token Counter
 *
 * Uses Google Generative AI SDK's countTokens() method for accurate token counting.
 * Supports both Google AI Studio and Vertex AI models.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  TokenCounter,
  TokenCountInput,
  TokenCountResult,
  AIProviderName,
} from "../../../types/conversation.js";
import type { CoreMessage } from "ai";
import { logger } from "../../../utils/logger.js";

/**
 * Convert CoreMessage to Google's format
 */
function convertToGoogleFormat(
  messages: CoreMessage[],
): Array<{ role: string; parts: Array<{ text: string }> }> {
  return messages.map((msg) => {
    // Convert role
    let role: string = msg.role;
    if (role === "assistant") {
      role = "model";
    } else if (role === "system") {
      // Google doesn't have a system role, treat as user
      role = "user";
    }

    // Extract text parts
    const parts: Array<{ text: string }> = [];

    if (typeof msg.content === "string") {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        const partObj = part as {
          type?: string;
          text?: string;
          [key: string]: unknown;
        };
        if (partObj.text) {
          parts.push({ text: partObj.text });
        }
      }
    }

    return { role, parts };
  });
}

/**
 * Google token counter using the Generative AI SDK
 */
export class GoogleTokenCounter implements TokenCounter {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  }

  supportsAsync(): boolean {
    return true; // API-based, async operation
  }

  supportedProviders(): AIProviderName[] {
    return ["google-ai", "vertex"];
  }

  async countTokens(input: TokenCountInput): Promise<TokenCountResult> {
    const startTime = Date.now();

    if (!this.apiKey) {
      logger.warn("Google API key not found, cannot count tokens");
      // Return estimation
      return this.estimateTokens(input, startTime);
    }

    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: input.model });

      // Convert messages to Google format
      const googleMessages = convertToGoogleFormat(input.messages);

      // Create content array from messages
      const contents = googleMessages.map((msg) => ({
        role: msg.role,
        parts: msg.parts,
      }));

      // Add system prompt if provided (as first user message)
      if (input.systemPrompt) {
        contents.unshift({
          role: "user",
          parts: [{ text: input.systemPrompt }],
        });
      }

      // Count tokens using SDK
      const result = await model.countTokens({ contents });

      const latency = Date.now() - startTime;

      return {
        inputTokens: result.totalTokens,
        method: "api",
        accuracy: "high",
        cached: false,
        latency,
      };
    } catch (error) {
      logger.warn("Google token counting failed, falling back to estimation", {
        error,
      });
      return this.estimateTokens(input, startTime);
    }
  }

  /**
   * Fallback estimation when API fails
   */
  private estimateTokens(
    input: TokenCountInput,
    startTime: number,
  ): TokenCountResult {
    // Rough estimation: 1 token ≈ 4 characters for Google
    let totalChars = 0;

    for (const msg of input.messages) {
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
 * Create Google token counter instance
 */
export function createGoogleCounter(apiKey?: string): TokenCounter {
  return new GoogleTokenCounter(apiKey);
}
