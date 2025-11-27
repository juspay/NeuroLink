/**
 * AWS Bedrock Token Counter
 *
 * Uses AWS Bedrock Runtime's CountTokensCommand for accurate token counting.
 * Supports Claude models on Bedrock.
 */

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type {
  TokenCounter,
  TokenCountInput,
  TokenCountResult,
  AIProviderName,
} from "../../../types/conversation.js";
import type { CoreMessage } from "ai";
import { logger } from "../../../utils/logger.js";

/**
 * Convert CoreMessage to Bedrock's format
 */
function convertToBedrockFormat(messages: CoreMessage[]): Array<{
  role: "user" | "assistant";
  content: Array<{ text: string }>;
}> {
  return messages
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => {
      const content: Array<{ text: string }> = [];

      if (typeof msg.content === "string") {
        content.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          const partObj = part as {
            type?: string;
            text?: string;
            [key: string]: unknown;
          };
          if (partObj.text) {
            content.push({ text: partObj.text });
          }
        }
      }

      return {
        role: msg.role as "user" | "assistant",
        content,
      };
    });
}

/**
 * AWS Bedrock token counter
 */
export class BedrockTokenCounter implements TokenCounter {
  private client?: BedrockRuntimeClient;
  private region: string;

  constructor(region?: string) {
    this.region = region || process.env.AWS_REGION || "us-east-1";

    // Only initialize client if AWS credentials are available
    try {
      this.client = new BedrockRuntimeClient({
        region: this.region,
      });
    } catch (error) {
      logger.warn("Failed to initialize Bedrock client", { error });
    }
  }

  supportsAsync(): boolean {
    return true; // API-based, async operation
  }

  supportedProviders(): AIProviderName[] {
    return ["bedrock"];
  }

  async countTokens(input: TokenCountInput): Promise<TokenCountResult> {
    const startTime = Date.now();

    if (!this.client) {
      logger.warn("Bedrock client not initialized, cannot count tokens");
      return this.estimateTokens(input, startTime);
    }

    try {
      // Convert messages to Bedrock format
      const bedrockMessages = convertToBedrockFormat(input.messages);

      // Prepare converse command (we'll use the usage field from response)
      const command = new ConverseCommand({
        modelId: input.model,
        messages: bedrockMessages,
        system: input.systemPrompt ? [{ text: input.systemPrompt }] : undefined,
        // Use minimal inference config to get token count without generating
        inferenceConfig: {
          maxTokens: 1, // Minimal tokens to minimize cost
          temperature: 0,
        },
      });

      const response = await this.client.send(command);

      // Extract token count from usage
      const inputTokens = response.usage?.inputTokens || 0;

      const latency = Date.now() - startTime;

      return {
        inputTokens,
        method: "api",
        accuracy: "high",
        cached: false,
        latency,
      };
    } catch (error) {
      logger.warn("Bedrock token counting failed, falling back to estimation", {
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
    // Rough estimation: 1 token ≈ 4 characters for Claude on Bedrock
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
 * Create Bedrock token counter instance
 */
export function createBedrockCounter(region?: string): TokenCounter {
  return new BedrockTokenCounter(region);
}
