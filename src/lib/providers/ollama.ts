import type {
  AIProviderName,
  TextGenerationOptions,
  EnhancedGenerateResult,
} from "../core/types.js";
import type {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1StreamPart,
} from "ai";
import { streamText, Output } from "ai";
import type { StreamOptions, StreamResult } from "../types/streamTypes.js";
import type { ZodType, ZodTypeDef } from "zod";
import type { Schema } from "ai";
import { BaseProvider } from "../core/baseProvider.js";
import { logger } from "../utils/logger.js";
import { getDefaultTimeout, TimeoutError } from "../utils/timeout.js";
import { DEFAULT_MAX_TOKENS } from "../core/constants.js";

// Model version constants (configurable via environment)
const DEFAULT_OLLAMA_MODEL = "llama3.1:8b";
const FALLBACK_OLLAMA_MODEL = "llama3.2:latest"; // Used when primary model fails

// Configuration helpers
const getOllamaBaseUrl = (): string => {
  return process.env.OLLAMA_BASE_URL || "http://localhost:11434";
};

// Create AbortController with timeout for better compatibility
const createAbortSignalWithTimeout = (timeoutMs: number): AbortSignal => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Clear timeout if signal is aborted through other means
  controller.signal.addEventListener("abort", () => {
    clearTimeout(timeoutId);
  });

  return controller.signal;
};

const getDefaultOllamaModel = (): string => {
  return process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
};

const getOllamaTimeout = (): number => {
  return parseInt(process.env.OLLAMA_TIMEOUT || "60000", 10);
};

// Custom LanguageModelV1 implementation for Ollama
class OllamaLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1";
  readonly provider = "ollama";
  readonly modelId: string;
  readonly maxTokens?: number;
  readonly supportsStreaming = true;
  readonly defaultObjectGenerationMode = "json" as const;

  private baseUrl: string;
  private timeout: number;

  constructor(modelId: string, baseUrl: string, timeout: number) {
    this.modelId = modelId;
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private convertMessagesToPrompt(
    messages: Array<{ role: string; content: unknown }>,
  ): string {
    return messages
      .map((msg: { role: string; content: unknown }) => {
        if (typeof msg.content === "string") {
          return `${msg.role}: ${msg.content}`;
        }
        return `${msg.role}: ${JSON.stringify(msg.content)}`;
      })
      .join("\n");
  }

  async doGenerate(options: LanguageModelV1CallOptions): Promise<{
    text?: string;
    reasoning?:
      | string
      | Array<
          | { type: "text"; text: string; signature?: string }
          | { type: "redacted"; data: string }
        >;
    files?: Array<{ data: string | Uint8Array; mimeType: string }>;
    logprobs?: Array<{
      token: string;
      logprob: number;
      topLogprobs: Array<{ token: string; logprob: number }>;
    }>;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens?: number;
    };
    finishReason:
      | "stop"
      | "length"
      | "content-filter"
      | "tool-calls"
      | "error"
      | "unknown";
    response?: {
      id?: string;
      timestamp?: Date;
      modelId?: string;
    };
    warnings?: Array<{ type: "other"; message: string }>;
    rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
    rawResponse?: { headers?: Record<string, string> };
    request?: { body?: string };
  }> {
    const messages =
      (options as { messages?: Array<{ role: string; content: unknown }> })
        .messages || [];
    const prompt = this.convertMessagesToPrompt(messages);

    // Debug: Log what's being sent to Ollama
    logger.debug(
      "[OllamaLanguageModel] Messages:",
      JSON.stringify(messages, null, 2),
    );
    logger.debug(
      "[OllamaLanguageModel] Converted Prompt:",
      JSON.stringify(prompt),
    );

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.modelId,
        prompt,
        stream: false,
        system: messages.find(
          (m: { role: string; content: unknown }) => m.role === "system",
        )?.content,
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
      }),
      signal: createAbortSignalWithTimeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Debug: Log Ollama API response to understand empty content issue
    logger.debug(
      "[OllamaLanguageModel] API Response:",
      JSON.stringify(data, null, 2),
    );

    return {
      text: data.response,
      usage: {
        promptTokens: data.prompt_eval_count || this.estimateTokens(prompt),
        completionTokens: data.eval_count || this.estimateTokens(data.response),
        totalTokens:
          (data.prompt_eval_count || this.estimateTokens(prompt)) +
          (data.eval_count || this.estimateTokens(data.response)),
      },
      finishReason: "stop",
      rawCall: {
        rawPrompt: prompt,
        rawSettings: {
          model: this.modelId,
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
      },
      rawResponse: {
        headers: {},
      },
    };
  }

  async doStream(options: LanguageModelV1CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV1StreamPart>;
    rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
    rawResponse?: { headers?: Record<string, string> };
    request?: { body?: string };
    warnings?: Array<{ type: "other"; message: string }>;
  }> {
    const messages =
      (options as { messages?: Array<{ role: string; content: unknown }> })
        .messages || [];
    const prompt = this.convertMessagesToPrompt(messages);

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.modelId,
        prompt,
        stream: true,
        system: messages.find(
          (m: { role: string; content: unknown }) => m.role === "system",
        )?.content,
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
      }),
      signal: createAbortSignalWithTimeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`,
      );
    }

    const self = this;
    return {
      stream: new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of self.parseStreamResponse(response)) {
              controller.enqueue(chunk);
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      }),
      rawCall: {
        rawPrompt: prompt,
        rawSettings: {
          model: this.modelId,
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
      },
      rawResponse: {
        headers: {},
      },
    };
  }

  private async *parseStreamResponse(
    response: Response,
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                yield {
                  type: "text-delta",
                  textDelta: data.response,
                };
              }
              if (data.done) {
                yield {
                  type: "finish",
                  finishReason: "stop",
                  usage: {
                    promptTokens:
                      data.prompt_eval_count ||
                      this.estimateTokens(data.context || ""),
                    completionTokens: data.eval_count || 0,
                  },
                };
                return;
              }
            } catch (error) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Ollama Provider v2 - BaseProvider Implementation
 *
 * PHASE 3.7: BaseProvider wrap around existing custom Ollama implementation
 *
 * Features:
 * - Extends BaseProvider for shared functionality
 * - Preserves custom OllamaLanguageModel implementation
 * - Local model management and health checking
 * - Enhanced error handling with Ollama-specific guidance
 */
export class OllamaProvider extends BaseProvider {
  private ollamaModel: OllamaLanguageModel;
  private baseUrl: string;
  private timeout: number;

  constructor(modelName?: string) {
    super(modelName, "ollama" as AIProviderName);

    this.baseUrl = getOllamaBaseUrl();
    this.timeout = getOllamaTimeout();

    // Initialize Ollama model
    this.ollamaModel = new OllamaLanguageModel(
      this.modelName || getDefaultOllamaModel(),
      this.baseUrl,
      this.timeout,
    );

    logger.debug("Ollama BaseProvider v2 initialized", {
      modelName: this.modelName,
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      provider: this.providerName,
    });
  }

  protected getProviderName(): AIProviderName {
    return "ollama" as AIProviderName;
  }

  protected getDefaultModel(): string {
    return getDefaultOllamaModel();
  }

  /**
   * Returns the Vercel AI SDK model instance for Ollama
   * The OllamaLanguageModel implements LanguageModelV1 interface properly
   */
  protected getAISDKModel(): LanguageModelV1 {
    return this.ollamaModel;
  }

  /**
   * Ollama tool/function calling support is currently disabled due to integration issues.
   *
   * **Current Issues:**
   * 1. The OllamaLanguageModel from @ai-sdk/provider-utils doesn't properly integrate
   *    with BaseProvider's tool calling mechanism
   * 2. Ollama models require specific prompt formatting for function calls that differs
   *    from the standardized AI SDK format
   * 3. Tool response parsing and execution flow needs custom implementation
   *
   * **What's needed to enable tool support:**
   * - Create a custom OllamaLanguageModel wrapper that handles tool schema formatting
   * - Implement Ollama-specific tool calling prompt templates
   * - Add proper response parsing for Ollama's function call format
   * - Test with models that support function calling (llama3.1, mistral, etc.)
   *
   * **Tracking:**
   * - See BaseProvider tool integration patterns in other providers
   * - Monitor Ollama function calling documentation: https://ollama.com/blog/tool-support
   * - Track AI SDK updates for better Ollama integration
   *
   * @returns false to disable tools by default
   */
  supportsTools(): boolean {
    // IMPLEMENTATION STATUS (2025): Ollama function calling actively evolving
    //
    // Current State:
    // - Function calling added in Ollama 2024, improving in 2025
    // - Requires compatible models (Llama 3.1+, Code Llama variants)
    // - AI SDK integration needs custom adapter for Ollama's tool format
    //
    // Technical Requirements:
    // 1. Replace AI SDK with direct Ollama API tool calls
    // 2. Implement Ollama-specific tool schema conversion
    // 3. Add function response parsing from Ollama's JSON format
    // 4. Handle streaming tool calls with incremental parsing
    // 5. Validate model compatibility before enabling tools
    //
    // Implementation Path:
    // - Use Ollama's chat API with 'tools' parameter
    // - Parse tool_calls from response.message.tool_calls
    // - Execute functions and return results to conversation
    //
    // Until Ollama-specific implementation, tools disabled for compatibility
    return false;
  }

  // executeGenerate removed - BaseProvider handles all generation with tools

  protected async executeStream(
    options: StreamOptions,
    analysisSchema?: ZodType<unknown, ZodTypeDef, unknown> | Schema<unknown>,
  ): Promise<StreamResult> {
    try {
      this.validateStreamOptions(options);
      await this.checkOllamaHealth();

      // Direct HTTP streaming implementation for better compatibility
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.modelName || FALLBACK_OLLAMA_MODEL,
          prompt: options.input.text,
          system: options.systemPrompt,
          stream: true,
          options: {
            temperature: options.temperature,
            num_predict: options.maxTokens || DEFAULT_MAX_TOKENS,
          },
        }),
        signal: createAbortSignalWithTimeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
      }

      // Transform to async generator to match other providers
      const self = this;
      const transformedStream = async function* () {
        const generator = self.createOllamaStream(response);
        for await (const chunk of generator) {
          yield chunk;
        }
      };

      return {
        stream: transformedStream(),
        provider: this.providerName,
        model: this.modelName,
      };
    } catch (error) {
      throw this.handleProviderError(error);
    }
  }

  private async *createOllamaStream(
    response: Response,
  ): AsyncGenerator<{ content: string }> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                yield { content: data.response };
              }
              if (data.done) {
                return;
              }
            } catch (error) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  protected handleProviderError(error: unknown): Error {
    if ((error as Error).name === "TimeoutError") {
      return new TimeoutError(
        `Ollama request timed out. The model might be loading or the request is too complex.`,
        this.defaultTimeout,
      );
    }

    if (
      (error as Error).message?.includes("ECONNREFUSED") ||
      (error as Error).message?.includes("fetch failed")
    ) {
      return new Error(
        `❌ Ollama Service Not Running\n\nCannot connect to Ollama at ${this.baseUrl}\n\n🔧 Steps to Fix:\n1. Install Ollama: https://ollama.ai/\n2. Start Ollama service: 'ollama serve'\n3. Verify it's running: 'curl ${this.baseUrl}/api/version'\n4. Try again`,
      );
    }

    if (
      (error as Error).message?.includes("model") &&
      (error as Error).message?.includes("not found")
    ) {
      return new Error(
        `❌ Ollama Model Not Found\n\nModel '${this.modelName}' is not available locally.\n\n🔧 Install Model:\n1. Run: ollama pull ${this.modelName}\n2. Or try a different model:\n   - ollama pull ${FALLBACK_OLLAMA_MODEL}\n   - ollama pull mistral:latest\n   - ollama pull codellama:latest\n\n🔧 List Available Models:\nollama list`,
      );
    }

    if ((error as Error).message?.includes("404")) {
      return new Error(
        `❌ Ollama API Endpoint Not Found\n\nThe API endpoint might have changed or Ollama version is incompatible.\n\n🔧 Check:\n1. Ollama version: 'ollama --version'\n2. Update Ollama to latest version\n3. Verify API is available: 'curl ${this.baseUrl}/api/version'`,
      );
    }

    return new Error(
      `❌ Ollama Provider Error\n\n${(error as Error).message || "Unknown error occurred"}\n\n🔧 Troubleshooting:\n1. Check if Ollama service is running\n2. Verify model is installed: 'ollama list'\n3. Check network connectivity to ${this.baseUrl}\n4. Review Ollama logs for details`,
    );
  }

  private validateStreamOptions(options: StreamOptions): void {
    if (!options.input?.text?.trim()) {
      throw new Error("Prompt is required for streaming");
    }

    if (options.maxTokens && options.maxTokens < 1) {
      throw new Error("maxTokens must be greater than 0");
    }

    if (
      options.temperature &&
      (options.temperature < 0 || options.temperature > 2)
    ) {
      throw new Error("temperature must be between 0 and 2");
    }
  }

  /**
   * Check if Ollama service is healthy and accessible
   */
  private async checkOllamaHealth(): Promise<void> {
    try {
      // Use traditional AbortController for better compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama health check failed: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
        throw new Error(
          `❌ Ollama Service Not Running\n\nCannot connect to Ollama service.\n\n🔧 Start Ollama:\n1. Run: ollama serve\n2. Or start Ollama app\n3. Verify: curl ${this.baseUrl}/api/version`,
        );
      }
      throw error;
    }
  }

  /**
   * Get available models from Ollama
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.models?.map((model: { name: string }) => model.name) || [];
    } catch (error) {
      logger.warn("Failed to fetch Ollama models:", error);
      return [];
    }
  }

  /**
   * Check if a specific model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    const models = await this.getAvailableModels();
    return models.includes(modelName);
  }
}

export default OllamaProvider;
