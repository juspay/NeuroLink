/**
 * Stream Handler Module
 *
 * Handles streaming-related validation, result creation, and analytics.
 * Extracted from BaseProvider to follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Stream options validation
 * - Text stream creation
 * - Stream result formatting
 * - Stream analytics creation
 *
 * @module core/modules/StreamHandler
 */

import {
  trace,
  context as otelContext,
  SpanStatusCode,
} from "@opentelemetry/api";
import type { StreamOptions, StreamResult } from "../../types/streamTypes.js";
import type { UnknownRecord } from "../../types/common.js";
import type { AIProviderName } from "../../types/index.js";
import { tracers, ATTR, withSpan } from "../../telemetry/index.js";
import { logger } from "../../utils/logger.js";
import {
  validateStreamOptions as validateStreamOpts,
  ValidationError,
  createValidationSummary,
} from "../../utils/parameterValidation.js";
import { STEP_LIMITS } from "../constants.js";
import { createAnalytics } from "../analytics.js";
import { nanoid } from "nanoid";
import { NoOutputGeneratedError } from "ai";

/**
 * StreamHandler class - Handles streaming operations for AI providers
 */
export class StreamHandler {
  constructor(
    private readonly providerName: AIProviderName,
    private readonly modelName: string,
  ) {}

  /**
   * Validate stream options - consolidates validation from 7/10 providers
   */
  validateStreamOptions(options: StreamOptions): void {
    const span = tracers.stream.startSpan("neurolink.stream.validate", {
      attributes: {
        [ATTR.NL_PROVIDER]: this.providerName,
        [ATTR.NL_MODEL]: this.modelName,
        "stream.has_max_steps": options.maxSteps !== undefined,
      },
    });

    try {
      const validation = validateStreamOpts(options);

      if (!validation.isValid) {
        const summary = createValidationSummary(validation);
        span.setAttribute(
          "stream.validation_errors",
          validation.errors?.length ?? 0,
        );
        throw new ValidationError(
          `Stream options validation failed: ${summary}`,
          "options",
          "VALIDATION_FAILED",
          validation.suggestions,
        );
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        logger.warn("Stream options validation warnings:", validation.warnings);
        span.addEvent("stream.validation.warnings", {
          "warning.count": validation.warnings.length,
          warnings: validation.warnings.join("; ").substring(0, 500),
        });
      }

      // Additional BaseProvider-specific validation
      if (options.maxSteps !== undefined) {
        if (
          options.maxSteps < STEP_LIMITS.min ||
          options.maxSteps > STEP_LIMITS.max
        ) {
          throw new ValidationError(
            `maxSteps must be between ${STEP_LIMITS.min} and ${STEP_LIMITS.max}`,
            "maxSteps",
            "OUT_OF_RANGE",
            [
              `Use a value between ${STEP_LIMITS.min} and ${STEP_LIMITS.max} for optimal performance`,
            ],
          );
        }
      }
    } catch (error) {
      span.recordException(
        error instanceof Error ? error : new Error(String(error)),
      );
      // NLK-GAP-006 fix: set error status alongside recordException
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Create text stream transformation - consolidates identical logic from 7/10 providers
   * Tracks TTFC (Time To First Chunk), chunk count, and total bytes streamed.
   */
  createTextStream(result: {
    textStream: AsyncIterable<string>;
  }): AsyncGenerator<{ content: string }> {
    const providerName = this.providerName;

    return (async function* () {
      let chunkCount = 0;
      let totalBytes = 0;
      const streamStart = Date.now();
      let firstChunkTime: number | undefined;

      try {
        for await (const chunk of result.textStream) {
          chunkCount++;
          totalBytes += chunk.length;

          if (!firstChunkTime) {
            firstChunkTime = Date.now();
            const activeSpan = trace.getSpan(otelContext.active());
            if (activeSpan) {
              activeSpan.addEvent("stream.first_chunk", {
                "stream.ttfc_ms": firstChunkTime - streamStart,
                "stream.provider": providerName,
              });
            }
          }

          yield { content: chunk };
        }
      } catch (error) {
        // AI SDK v6 throws NoOutputGeneratedError when the stream produces no output
        // (e.g. empty response, model refusal with no text). Treat as an empty stream
        // rather than crashing the process with an unhandled rejection.
        if (NoOutputGeneratedError.isInstance(error)) {
          logger.warn(
            `${providerName}: Stream produced no output (NoOutputGeneratedError), returning empty stream`,
          );
        } else {
          throw error;
        }
      }

      // Record completion metrics on the active span
      const activeSpan = trace.getSpan(otelContext.active());
      if (activeSpan) {
        activeSpan.addEvent("stream.complete", {
          "stream.chunk_count": chunkCount,
          "stream.total_bytes": totalBytes,
          "stream.duration_ms": Date.now() - streamStart,
          "stream.ttfc_ms": firstChunkTime ? firstChunkTime - streamStart : -1,
        });
      }
    })();
  }

  /**
   * Create filtered stream from AI SDK fullStream
   *
   * Filters out reasoning/thinking chunks from the stream to prevent chain-of-thought
   * tokens from leaking to users when using models with extended thinking capabilities
   * (e.g., Claude Sonnet 4.5, Gemini 2.5 Pro).
   *
   * **When to use:**
   * - For Google Vertex AI provider with reasoning-capable models
   * - When you want to hide internal reasoning/thinking process from end users
   *
   * **Note:** Currently only implemented for GoogleVertex provider. Other providers
   * (OpenAI, Anthropic, etc.) use `createTextStream` which passes through all text.
   * This may change as more models adopt extended thinking capabilities.
   *
   * **Filtered chunk types:**
   * - `reasoning` - Chain-of-thought thinking tokens
   * - `reasoning-signature` - Signatures for reasoning blocks
   * - `redacted-reasoning` - Redacted thinking content
   * - `source`, `tool-call`, `tool-result` - Non-text chunks
   *
   * **Passed through:**
   * - `text-delta` - Yields content to user
   * - `error` - Throws as Error
   * - Plain strings - Yields as content (fallback)
   *
   * **Fallback:** Uses textStream if fullStream is unavailable
   *
   * @param result - AI SDK stream result with fullStream or textStream
   * @returns AsyncGenerator yielding only text content chunks
   *
   * @example
   * ```typescript
   * const result = await streamText({ model, messages });
   * const filtered = this.streamHandler.createFilteredFullStream(result);
   * for await (const chunk of filtered) {
   *   console.log(chunk.content); // Only visible text, no reasoning
   * }
   * ```
   */
  createFilteredFullStream(result: {
    fullStream?: AsyncIterable<unknown>;
    textStream?: AsyncIterable<string>;
  }): AsyncGenerator<{ content: string }> {
    // Type guards
    const hasType = (val: unknown): val is { type: string } =>
      val !== null &&
      typeof val === "object" &&
      "type" in val &&
      typeof (val as Record<string, unknown>).type === "string";
    const isTextDelta = (val: {
      type: string;
    }): val is { type: "text-delta"; textDelta: string } =>
      val.type === "text-delta" &&
      "textDelta" in val &&
      typeof (val as Record<string, unknown>).textDelta === "string";
    const isError = (val: {
      type: string;
    }): val is { type: "error"; error: unknown } =>
      val.type === "error" && "error" in val;

    const getErrorMessage = (error: unknown): string => {
      if (error !== null && typeof error === "object" && "message" in error) {
        const msg = (error as Record<string, unknown>).message;
        return typeof msg === "string" ? msg : "Unknown error";
      }
      return "Unknown error";
    };

    return (async function* () {
      if (result.fullStream) {
        for await (const chunk of result.fullStream) {
          if (typeof chunk === "string") {
            yield { content: chunk };
          } else if (hasType(chunk)) {
            if (isError(chunk)) {
              throw new Error(
                `Streaming error: ${getErrorMessage(chunk.error)}`,
              );
            } else if (isTextDelta(chunk)) {
              yield { content: chunk.textDelta };
            }
            // Skip: reasoning, reasoning-signature, redacted-reasoning, source, tool-call, tool-result, etc.
          }
        }
      } else if (result.textStream) {
        for await (const chunk of result.textStream) {
          yield { content: chunk };
        }
      }
    })();
  }

  /**
   * Create standardized stream result - consolidates result structure
   */
  createStreamResult(
    stream: AsyncGenerator<{ content: string }>,
    additionalProps: Partial<StreamResult> = {},
  ): StreamResult {
    return {
      stream,
      provider: this.providerName,
      model: this.modelName,
      ...additionalProps,
    };
  }

  /**
   * Create stream analytics - consolidates analytics from 4/10 providers
   */
  async createStreamAnalytics(
    result: UnknownRecord,
    startTime: number,
    options: StreamOptions,
  ): Promise<UnknownRecord | undefined> {
    return withSpan(
      {
        name: "neurolink.stream.analytics",
        tracer: tracers.stream,
        attributes: {
          [ATTR.NL_PROVIDER]: this.providerName,
          [ATTR.NL_MODEL]: this.modelName,
          [ATTR.NL_STREAM_MODE]: true,
        },
      },
      async (span) => {
        try {
          const durationMs = Date.now() - startTime;
          span.setAttribute("stream.duration_ms", durationMs);

          const analytics = createAnalytics(
            this.providerName,
            this.modelName,
            result,
            durationMs,
            {
              requestId: `${this.providerName}-stream-${nanoid()}`,
              streamingMode: true,
              ...options.context,
            },
          );
          return analytics as unknown as UnknownRecord;
        } catch (error) {
          logger.warn(
            `Analytics creation failed for ${this.providerName}:`,
            error,
          );
          return undefined;
        }
      },
    );
  }

  /**
   * Validate streaming-only options (called before executeStream)
   * Simpler validation for options object structure
   */
  validateStreamOptionsOnly(options: StreamOptions): void {
    if (!options.input) {
      throw new ValidationError(
        "Stream options must include input",
        "input",
        "MISSING_REQUIRED",
        ["Provide options.input with text content"],
      );
    }

    if (!options.input.text && !options.input.images?.length) {
      throw new ValidationError(
        "Stream input must include either text or images",
        "input",
        "MISSING_REQUIRED",
        ["Provide options.input.text or options.input.images"],
      );
    }
  }
}
