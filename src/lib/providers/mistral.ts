import { createMistral } from "@ai-sdk/mistral";
import { streamText, type LanguageModelV1 } from "ai";
import type {
  AIProviderName,
  TextGenerationOptions,
  EnhancedGenerateResult,
} from "../core/types.js";
import type { StreamOptions, StreamResult } from "../types/streamTypes.js";
import type { Unknown } from "../types/common.js";
import { BaseProvider, type NeuroLinkSDK } from "../core/baseProvider.js";
import { logger } from "../utils/logger.js";
import { createAnalytics } from "../core/analytics.js";
import {
  validateApiKey,
  createMistralConfig,
  getProviderModel,
} from "../utils/providerConfig.js";
import { streamAnalyticsCollector } from "../core/streamAnalytics.js";

// Configuration helpers - now using consolidated utility
const getMistralApiKey = (): string => {
  return validateApiKey(createMistralConfig());
};

const getDefaultMistralModel = (): string => {
  return getProviderModel("MISTRAL_MODEL", "mistral-large-latest");
};

/**
 * Mistral AI Provider v2 - BaseProvider Implementation
 * Supports official AI-SDK integration with all Mistral models
 */
export class MistralProvider extends BaseProvider {
  private model: LanguageModelV1;

  constructor(modelName?: string, sdk?: unknown) {
    // Type guard for NeuroLinkSDK parameter validation
    const validatedSdk =
      sdk && typeof sdk === "object" && "getInMemoryServers" in sdk
        ? (sdk as NeuroLinkSDK)
        : undefined;

    super(modelName, "mistral" as AIProviderName, validatedSdk);

    // Initialize Mistral model with API key validation
    const apiKey = getMistralApiKey();
    const mistral = createMistral({
      apiKey: apiKey,
    });
    this.model = mistral(this.modelName || getDefaultMistralModel());

    logger.debug("Mistral Provider v2 initialized", {
      modelName: this.modelName,
      providerName: this.providerName,
    });
  }

  /**
   * Generate text using Mistral API
   */
  async generate(
    options: TextGenerationOptions,
  ): Promise<EnhancedGenerateResult> {
    const startTime = Date.now();

    try {
      const result = await this.model.doGenerate({
        inputFormat: "prompt",
        mode: { type: "regular" },
        prompt: [
          {
            role: "user",
            content: [{ type: "text", text: options.prompt || "" }],
          },
        ],
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });

      const responseTime = Date.now() - startTime;

      // Extract token usage and text content
      const tokenUsage = result.usage;
      const textContent = result.text || "";

      // Create analytics data using helper
      const analytics = createAnalytics(
        "mistral",
        this.modelName!,
        { usage: tokenUsage, content: textContent },
        responseTime,
        { requestId: `mistral-${Date.now()}` },
      );

      return {
        content: textContent,
        usage: {
          inputTokens: tokenUsage?.promptTokens || 0,
          outputTokens: tokenUsage?.completionTokens || 0,
          totalTokens:
            (tokenUsage?.promptTokens || 0) +
            (tokenUsage?.completionTokens || 0),
        },
        provider: this.providerName,
        model: this.modelName!,
        analytics,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      logger.error("Mistral generation failed", {
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      });

      throw new Error(
        `Mistral generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Stream text generation using Mistral API
   */
  async executeStream(options: StreamOptions): Promise<StreamResult> {
    const startTime = Date.now();

    try {
      const result = await streamText({
        model: this.model,
        prompt: options.input.text,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        tools: options.tools,
        toolChoice: "auto",
      });

      // Transform stream to match StreamResult interface
      const transformedStream = async function* () {
        for await (const chunk of result.textStream) {
          yield { content: chunk };
        }
      };

      // Create analytics promise that resolves after stream completion
      const analyticsPromise = streamAnalyticsCollector.createAnalytics(
        this.providerName,
        this.modelName!,
        result,
        Date.now() - startTime,
        {
          requestId: `mistral-stream-${Date.now()}`,
          streamingMode: true,
        },
      );

      return {
        stream: transformedStream(),
        provider: this.providerName,
        model: this.modelName!,
        analytics: analyticsPromise,
        metadata: {
          startTime,
          streamId: `mistral-${Date.now()}`,
        },
      };
    } catch (error) {
      logger.error("Mistral streaming failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      throw new Error(
        `Mistral streaming failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get default model name for this provider
   */
  getDefaultModel(): string {
    return getDefaultMistralModel();
  }

  /**
   * Get provider name
   */
  getProviderName(): AIProviderName {
    return this.providerName;
  }

  /**
   * Get AI SDK model instance
   */
  getAISDKModel(): LanguageModelV1 {
    return this.model;
  }

  /**
   * Handle provider-specific errors
   */
  handleProviderError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(`Mistral provider error: ${String(error)}`);
  }

  /**
   * Validate provider configuration
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      getMistralApiKey();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get provider-specific configuration
   */
  getConfiguration() {
    return {
      provider: this.providerName,
      model: this.modelName,
      defaultModel: getDefaultMistralModel(),
    };
  }
}

export default MistralProvider;
