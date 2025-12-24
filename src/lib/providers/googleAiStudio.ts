import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, type Schema, type LanguageModelV1 } from "ai";
import type { ZodUnknownSchema } from "../types/typeAliases.js";
import { AIProviderName, GoogleAIModels } from "../constants/enums.js";
import type {
  StreamOptions,
  StreamResult,
  AudioChunk,
} from "../types/streamTypes.js";
import type { UnknownRecord } from "../types/common.js";
import type {
  LiveServerMessage,
  GenAIClient,
  GoogleGenAIClass,
} from "../types/providers.js";
import type { NeuroLink } from "../neurolink.js";
import { BaseProvider } from "../core/baseProvider.js";
import { logger } from "../utils/logger.js";
import { createTimeoutController, TimeoutError } from "../utils/timeout.js";
import {
  AuthenticationError,
  NetworkError,
  ProviderError,
  RateLimitError,
} from "../types/errors.js";
import type {
  EnhancedGenerateResult,
  TextGenerationOptions,
} from "../types/index.js";
import { DEFAULT_MAX_STEPS } from "../core/constants.js";
import { streamAnalyticsCollector } from "../core/streamAnalytics.js";

// Google AI Live API types now imported from ../types/providerSpecific.js

// Import proper types for multimodal message handling

// Create Google GenAI client
async function createGoogleGenAIClient(apiKey: string): Promise<GenAIClient> {
  const mod: unknown = await import("@google/genai");
  const ctor = (mod as Record<string, unknown>).GoogleGenAI as unknown;
  if (!ctor) {
    throw new Error("@google/genai does not export GoogleGenAI");
  }
  const Ctor = ctor as GoogleGenAIClass;
  return new Ctor({ apiKey });
}

// Environment variable setup
if (
  !process.env.GOOGLE_GENERATIVE_AI_API_KEY &&
  process.env.GOOGLE_AI_API_KEY
) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
}

/**
 * Google AI Studio provider implementation using BaseProvider
 * Migrated from original GoogleAIStudio class to new factory pattern
 *
 * @important Structured Output Limitation
 * Google Gemini models cannot combine function calling (tools) with structured
 * output (JSON schema). When using schemas with output.format: "json", you MUST
 * set disableTools: true.
 *
 * Error without disableTools:
 * "Function calling with a response mime type: 'application/json' is unsupported"
 *
 * This is a Google API limitation documented at:
 * https://ai.google.dev/gemini-api/docs/function-calling
 *
 * @example
 * ```typescript
 * // ✅ Correct usage with schemas
 * const provider = new GoogleAIStudioProvider("gemini-2.5-flash");
 * const result = await provider.generate({
 *   input: { text: "Analyze data" },
 *   schema: MySchema,
 *   output: { format: "json" },
 *   disableTools: true  // Required
 * });
 * ```
 *
 * @note Gemini 3 Pro Preview (November 2025) will support combining tools + schemas
 * @note "Too many states for serving" errors can occur with complex schemas + tools.
 *       Solution: Simplify schema or use disableTools: true
 */
export class GoogleAIStudioProvider extends BaseProvider {
  constructor(modelName?: string, sdk?: unknown) {
    super(
      modelName,
      "google-ai" as AIProviderName,
      sdk as NeuroLink | undefined,
    );
    logger.debug("GoogleAIStudioProvider initialized", {
      model: this.modelName,
      provider: this.providerName,
      sdkProvided: !!sdk,
    });
  }
  // ===================
  // ABSTRACT METHOD IMPLEMENTATIONS
  // ===================

  public getProviderName(): AIProviderName {
    return "google-ai" as AIProviderName;
  }

  public getDefaultModel(): string {
    return process.env.GOOGLE_AI_MODEL || GoogleAIModels.GEMINI_2_5_FLASH;
  }

  /**
   * 🔧 PHASE 2: Return AI SDK model instance for tool calling
   */
  public getAISDKModel(): LanguageModelV1 {
    const apiKey = this.getApiKey();
    const google = createGoogleGenerativeAI({ apiKey });
    return google(this.modelName);
  }

  public handleProviderError(error: unknown): Error {
    if (error instanceof TimeoutError) {
      throw new NetworkError(error.message, this.providerName);
    }

    const errorRecord = error as UnknownRecord;
    const message =
      typeof errorRecord?.message === "string"
        ? errorRecord.message
        : "Unknown error";

    if (message.includes("API_KEY_INVALID")) {
      throw new AuthenticationError(
        "Invalid Google AI API key. Please check your GOOGLE_AI_API_KEY environment variable.",
        this.providerName,
      );
    }

    if (message.includes("RATE_LIMIT_EXCEEDED")) {
      throw new RateLimitError(
        "Google AI rate limit exceeded. Please try again later.",
        this.providerName,
      );
    }

    throw new ProviderError(`Google AI error: ${message}`, this.providerName);
  }

  /**
   * Overrides the BaseProvider's image generation method to implement it for Google AI.
   * This method calls the Google AI API to generate an image from a prompt.
   * @param options The generation options containing the prompt.
   * @returns A promise that resolves to the generation result, including the image data.
   */
  protected async executeImageGeneration(
    options: TextGenerationOptions,
  ): Promise<EnhancedGenerateResult> {
    const prompt = options.prompt || options.input?.text || "";
    const imageModelName = options.model || this.modelName;
    const startTime = Date.now();
    const apiKey = this.getApiKey();

    logger.info("🎨 Starting Google AI Studio image generation", {
      model: imageModelName,
      prompt: prompt.substring(0, 100),
      provider: this.providerName,
    });

    // Use the @google/genai client for image generation
    let client: GenAIClient;
    try {
      client = await createGoogleGenAIClient(apiKey);
    } catch {
      throw new AuthenticationError(
        "Missing '@google/genai'. Install with: npm install @google/genai",
        this.providerName,
      );
    }

    try {
      // Build content array with multimodal support
      const imageParts = await Promise.all(
        (options.input?.images || []).map(async (image) => {
          // Handle ImageWithAltText objects
          if (typeof image === "object" && "url" in image) {
            const imageUrl = image.url as string;
            if (imageUrl.startsWith("http")) {
              const response = await fetch(imageUrl);
              if (!response.ok) {
                throw new Error(
                  `Failed to fetch image from ${imageUrl}: ${response.status} ${response.statusText}`,
                );
              }
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const mimeType = this.detectImageType(buffer);
              logger.debug(
                `Downloaded and detected image MIME type: ${mimeType}`,
              );
              return {
                inlineData: {
                  mimeType,
                  data: buffer.toString("base64"),
                },
              };
            }
            // Base64 URL in ImageWithAltText
            const buffer = Buffer.from(imageUrl as string, "base64");
            const mimeType = this.detectImageType(buffer);
            return {
              inlineData: {
                mimeType,
                data: buffer.toString("base64"),
              },
            };
          }
          // Handle string URLs
          if (typeof image === "string" && image.startsWith("http")) {
            const response = await fetch(image);
            if (!response.ok) {
              throw new Error(
                `Failed to fetch image from ${image}: ${response.status} ${response.statusText}`,
              );
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const mimeType = this.detectImageType(buffer);
            logger.debug(
              `Downloaded and detected image MIME type: ${mimeType}`,
            );
            return {
              inlineData: {
                mimeType,
                data: buffer.toString("base64"),
              },
            };
          }
          // Handle Buffer or base64 string
          const buffer = Buffer.isBuffer(image)
            ? image
            : typeof image === "string"
              ? Buffer.from(image, "base64")
              : Buffer.from(""); // Fallback for unexpected types
          const mimeType = this.detectImageType(buffer);
          logger.debug(`Detected image MIME type: ${mimeType}`);
          return {
            inlineData: {
              mimeType,
              data: buffer.toString("base64"),
            },
          };
        }),
      );

      const contents = [
        {
          role: "user",
          parts: [{ text: prompt }, ...imageParts],
        },
      ];

      // Configure for image generation
      const generateConfig = {
        responseModalities: ["IMAGE", "TEXT"], // This is the key setting for image generation
      };

      logger.debug("Starting image generation request", {
        model: imageModelName,
        contentParts: contents[0].parts.length,
        responseModalities: generateConfig.responseModalities,
      });

      // Try streaming approach first
      let imageData: string | null = null;
      let textContent = "";

      try {
        // Await the Promise to get the AsyncIterable
        const stream = await client.models.generateContentStream({
          model: imageModelName,
          contents: contents,
          config: generateConfig,
        });

        // Process the stream
        for await (const chunk of stream) {
          logger.debug("Received chunk", {
            hasCandidate: !!chunk.candidates?.[0],
            hasContent: !!chunk.candidates?.[0]?.content,
            hasParts: !!chunk.candidates?.[0]?.content?.parts,
          });

          const candidate = chunk.candidates?.[0];
          if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
              // Check for image data
              if ("inlineData" in part && part.inlineData?.data) {
                imageData = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || "image/png";

                logger.info("Image generation successful", {
                  model: imageModelName,
                  mimeType,
                  dataLength: imageData.length,
                  responseTime: Date.now() - startTime,
                });

                const result: EnhancedGenerateResult = {
                  content: `Generated image using ${imageModelName} (${mimeType})`,
                  imageOutput: {
                    base64: imageData,
                  },
                  provider: this.providerName,
                  model: imageModelName,
                  usage: {
                    input: this.estimateTokenCount(prompt),
                    output: 0,
                    total: this.estimateTokenCount(prompt),
                  },
                };

                return await this.enhanceResult(result, options, startTime);
              }

              // Check for text content
              if ("text" in part && part.text) {
                textContent += part.text;
                logger.debug("Received text content", {
                  text: part.text.substring(0, 100),
                });
              }
            }
          }
        }
      } catch (streamError) {
        logger.debug("Streaming failed, trying non-streaming approach", {
          error:
            streamError instanceof Error
              ? streamError.message
              : String(streamError),
        });
      }

      // If no image was found, try non-streaming approach
      if (!imageData) {
        logger.debug("Trying non-streaming approach");

        const response = await client.models.generateContent({
          model: imageModelName,
          contents: contents,
          config: generateConfig,
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if ("inlineData" in part && part.inlineData?.data) {
              imageData = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || "image/png";

              logger.info("Image generation successful (non-streaming)", {
                model: imageModelName,
                mimeType,
                dataLength: imageData.length,
                responseTime: Date.now() - startTime,
              });

              const result: EnhancedGenerateResult = {
                content: `Generated image using ${imageModelName} (${mimeType})`,
                imageOutput: {
                  base64: imageData,
                },
                provider: this.providerName,
                model: imageModelName,
                usage: {
                  input: this.estimateTokenCount(prompt),
                  output: 0,
                  total: this.estimateTokenCount(prompt),
                },
              };

              return await this.enhanceResult(result, options, startTime);
            }

            if ("text" in part && part.text) {
              textContent += part.text;
            }
          }
        }
      }

      // If we reach here, no image was generated
      logger.warn("No image data found in response", {
        model: imageModelName,
        prompt: prompt.substring(0, 100),
        hasTextContent: !!textContent,
        textContent: textContent.substring(0, 200),
      });

      throw new ProviderError(
        textContent ||
          `Image generation completed but no image data was returned. This may indicate an issue with the model "${imageModelName}" or the prompt: "${prompt}". Please try again or use a different model.`,
        this.providerName,
      );
    } catch (error) {
      logger.error("Image generation failed", {
        error: error instanceof Error ? error.message : String(error),
        model: imageModelName,
        prompt: prompt.substring(0, 100),
      });

      throw this.handleProviderError(error);
    }
  }

  /**
   * Detect image MIME type from buffer
   */
  private detectImageType(buffer: Buffer): string {
    // Check PNG signature
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }

    // Check JPEG signature
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return "image/jpeg";
    }

    // Check WebP signature
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return "image/webp";
    }

    // Check GIF signature
    if (
      buffer.length >= 6 &&
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46
    ) {
      return "image/gif";
    }

    // Default to PNG if unknown
    return "image/png";
  }

  /**
   * Estimate token count from text (simple character-based estimation)
   */
  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  // executeGenerate removed - BaseProvider handles all generation with tools
  protected async executeStream(
    options: StreamOptions,
    _analysisSchema?: ZodUnknownSchema | Schema<unknown>,
  ): Promise<StreamResult> {
    // Phase 1: if audio input present, bridge to Gemini Live (Studio) using @google/genai
    if (options.input?.audio) {
      return await this.executeAudioStreamViaGeminiLive(options);
    }
    this.validateStreamOptions(options);

    const startTime = Date.now();
    const apiKey = this.getApiKey();

    // Ensure environment variable is set for @ai-sdk/google
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
    }

    const model = await this.getAISDKModelWithMiddleware(options);

    const timeout = this.getTimeout(options);
    const timeoutController = createTimeoutController(
      timeout,
      this.providerName,
      "stream",
    );

    try {
      // Get tools consistently with generate method
      const shouldUseTools = !options.disableTools && this.supportsTools();
      const tools = shouldUseTools ? await this.getAllTools() : {};

      // Build message array from options with multimodal support
      // Using protected helper from BaseProvider to eliminate code duplication
      const messages = await this.buildMessagesForStream(options);

      const result = await streamText({
        model,
        messages: messages,
        temperature: options.temperature,
        maxTokens: options.maxTokens, // No default limit - unlimited unless specified
        tools,
        maxSteps: options.maxSteps || DEFAULT_MAX_STEPS,
        toolChoice: shouldUseTools ? "auto" : "none",
        abortSignal: timeoutController?.controller.signal,
        experimental_telemetry: this.getStreamTelemetryConfig(options),
        onStepFinish: ({ toolCalls, toolResults }) => {
          this.handleToolExecutionStorage(
            toolCalls,
            toolResults,
            options,
            new Date(),
          ).catch((error: unknown) => {
            logger.warn(
              "[GoogleAiStudioProvider] Failed to store tool executions",
              {
                provider: this.providerName,
                error: error instanceof Error ? error.message : String(error),
              },
            );
          });
        },
      });

      timeoutController?.cleanup();

      // Transform string stream to content object stream using BaseProvider method
      const transformedStream = this.createTextStream(result);

      // Create analytics promise that resolves after stream completion
      const analyticsPromise = streamAnalyticsCollector.createAnalytics(
        this.providerName,
        this.modelName,
        result,
        Date.now() - startTime,
        {
          requestId: `google-ai-stream-${Date.now()}`,
          streamingMode: true,
        },
      );

      return {
        stream: transformedStream,
        provider: this.providerName,
        model: this.modelName,
        analytics: analyticsPromise,
        metadata: {
          startTime,
          streamId: `google-ai-${Date.now()}`,
        },
      };
    } catch (error) {
      timeoutController?.cleanup();
      throw this.handleProviderError(error);
    }
  }

  // ===================
  // HELPER METHODS
  // ===================
  private async executeAudioStreamViaGeminiLive(
    options: StreamOptions,
  ): Promise<StreamResult> {
    const startTime = Date.now();
    const apiKey = this.getApiKey();

    // Dynamic import to avoid hard dependency unless audio streaming is used
    let client: GenAIClient;
    try {
      client = await createGoogleGenAIClient(apiKey);
    } catch {
      throw new AuthenticationError(
        "Missing '@google/genai'. Install with: pnpm add @google/genai",
        this.providerName,
      );
    }

    const model =
      this.modelName ||
      process.env.GOOGLE_VOICE_AI_MODEL ||
      "gemini-2.5-flash-preview-native-audio-dialog";

    // Simple async queue for yielding audio events to the outer AsyncIterable
    type QueueItem =
      | { type: "audio"; audio: AudioChunk }
      | { type: "end" }
      | { type: "error"; error: unknown };
    const queue: QueueItem[] = [];
    let resolveNext:
      | ((value: IteratorResult<{ type: "audio"; audio: AudioChunk }>) => void)
      | null = null;
    let done = false;

    const push = (item: QueueItem) => {
      if (done) {
        return;
      }
      if (item.type === "audio") {
        if (resolveNext) {
          const fn = resolveNext;
          resolveNext = null;
          fn({ value: { type: "audio", audio: item.audio }, done: false });
          return;
        }
      }
      queue.push(item);
    };

    const session = await client.live.connect({
      model,
      callbacks: {
        onopen: () => {
          // no-op
        },
        onmessage: async (message: LiveServerMessage) => {
          try {
            const audio =
              message?.serverContent?.modelTurn?.parts?.[0]?.inlineData;
            if (audio?.data) {
              const buf = Buffer.from(String(audio.data), "base64");
              const chunk: AudioChunk = {
                data: buf,
                sampleRateHz: 24000,
                channels: 1,
                encoding: "PCM16LE",
              };
              push({ type: "audio", audio: chunk });
            }
            if (message?.serverContent?.interrupted) {
              // allow consumer to handle; no special action required here
            }
          } catch (e) {
            push({ type: "error", error: e });
          }
        },
        onerror: (e: { message?: string }) => {
          push({ type: "error", error: e });
        },
        onclose: (_e: { code?: number; reason?: string }) => {
          push({ type: "end" });
        },
      },
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Orus" } },
        },
      },
    });

    // Feed upstream audio frames concurrently
    (async () => {
      try {
        const spec = options.input?.audio;
        if (!spec) {
          logger.debug(
            "[GeminiLive] No audio spec found on input; skipping upstream send",
          );
          return;
        }
        for await (const frame of spec.frames) {
          // Zero-length frame acts as a 'flush' control signal
          if (!frame || (frame as Buffer).byteLength === 0) {
            try {
              if (session.sendInput) {
                await session.sendInput({ event: "flush" });
              } else if (session.sendRealtimeInput) {
                await session.sendRealtimeInput({ event: "flush" });
              }
            } catch (err) {
              logger.debug("[GeminiLive] flush control failed (non-fatal)", {
                error: err instanceof Error ? err.message : String(err),
              });
            }
            continue;
          }
          // Convert PCM16LE buffer to base64 and wrap in genai Blob-like object
          const base64 = (frame as Buffer).toString("base64");
          const mimeType = `audio/pcm;rate=${spec.sampleRateHz || 16000}`;
          await session.sendRealtimeInput?.({
            media: { data: base64, mimeType },
          });
        }
        // Best-effort flush signal if supported
        try {
          if (session.sendInput) {
            await session.sendInput({ event: "flush" });
          } else if (session.sendRealtimeInput) {
            await session.sendRealtimeInput({ event: "flush" });
          }
        } catch (err) {
          logger.debug("[GeminiLive] final flush failed (non-fatal)", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      } catch (e) {
        push({ type: "error", error: e });
      }
    })().catch(() => {
      // ignore
    });

    // AsyncIterable for stream events
    const asyncIterable = {
      [Symbol.asyncIterator]() {
        return {
          async next(): Promise<
            IteratorResult<{ type: "audio"; audio: AudioChunk }>
          > {
            if (queue.length > 0) {
              const item = queue.shift();
              if (!item) {
                return {
                  value: undefined as unknown as {
                    type: "audio";
                    audio: AudioChunk;
                  },
                  done: true,
                };
              }
              if (item.type === "audio") {
                return {
                  value: { type: "audio", audio: item.audio },
                  done: false,
                };
              }
              if (item.type === "end") {
                done = true;
                return {
                  value: undefined as unknown as {
                    type: "audio";
                    audio: AudioChunk;
                  },
                  done: true,
                };
              }
              if (item.type === "error") {
                done = true;
                throw item.error instanceof Error
                  ? item.error
                  : new Error(String(item.error));
              }
            }
            if (done) {
              return {
                value: undefined as unknown as {
                  type: "audio";
                  audio: AudioChunk;
                },
                done: true,
              };
            }
            return await new Promise<
              IteratorResult<{ type: "audio"; audio: AudioChunk }>
            >((resolve) => {
              resolveNext = resolve;
            });
          },
        };
      },
    } as AsyncIterable<{ type: "audio"; audio: AudioChunk }>;

    return {
      stream: asyncIterable,
      provider: this.providerName,
      model: model,
      metadata: {
        startTime,
        streamId: `google-ai-audio-${Date.now()}`,
      },
    };
  }

  private getApiKey(): string {
    const apiKey =
      process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      throw new AuthenticationError(
        "GOOGLE_AI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set",
        this.providerName,
      );
    }

    return apiKey;
  }
}

export default GoogleAIStudioProvider;
