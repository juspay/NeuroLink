import type { AnalyticsData } from "./types.js";
import type { TokenUsage } from "../types/providers.js";
import type { ToolCall, ToolResult } from "../types/streamTypes.js";
import { createAnalytics } from "./analytics.js";
import { logger } from "../utils/logger.js";

/**
 * Raw usage data from Vercel AI SDK (uses different field names)
 */
interface AISDKUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Stream analytics result from Vercel AI SDK streamText
 */
export interface StreamTextResult {
  textStream: AsyncIterable<string>;
  text: Promise<string>;
  usage: Promise<AISDKUsage | undefined>;
  response: Promise<
    | {
        id?: string;
        model?: string;
        timestamp?: number | Date;
      }
    | undefined
  >;
  finishReason: Promise<
    | "stop"
    | "length"
    | "content-filter"
    | "tool-calls"
    | "error"
    | "other"
    | "unknown"
  >;
  toolResults?: Promise<ToolResult[]>;
  toolCalls?: Promise<ToolCall[]>;
}

/**
 * Interface for collecting analytics from streaming results
 */
export interface StreamAnalyticsCollector {
  collectUsage(result: StreamTextResult): Promise<TokenUsage>;
  collectMetadata(result: StreamTextResult): Promise<ResponseMetadata>;
  createAnalytics(
    provider: string,
    model: string,
    result: StreamTextResult,
    responseTime: number,
    metadata?: Record<string, unknown>,
  ): Promise<AnalyticsData>;
}

/**
 * Response metadata from stream result
 */
export interface ResponseMetadata {
  id?: string;
  model?: string;
  timestamp?: number;
  finishReason?: string;
}

/**
 * Base implementation for collecting analytics from Vercel AI SDK stream results
 */
export class BaseStreamAnalyticsCollector implements StreamAnalyticsCollector {
  /**
   * Collect token usage from stream result
   */
  async collectUsage(result: StreamTextResult): Promise<TokenUsage> {
    try {
      const usage = await result.usage;

      if (!usage) {
        logger.debug("No usage data available from stream result");
        return {
          input: 0,
          output: 0,
          total: 0,
        };
      }

      return {
        input: usage.promptTokens || 0,
        output: usage.completionTokens || 0,
        total:
          usage.totalTokens ||
          (usage.promptTokens || 0) + (usage.completionTokens || 0),
      };
    } catch (error) {
      logger.warn("Failed to collect usage from stream result", { error });
      return {
        input: 0,
        output: 0,
        total: 0,
      };
    }
  }

  /**
   * Collect response metadata from stream result
   */
  async collectMetadata(result: StreamTextResult): Promise<ResponseMetadata> {
    try {
      const [response, finishReason] = await Promise.all([
        result.response,
        result.finishReason,
      ]);

      return {
        id: response?.id,
        model: response?.model,
        timestamp:
          response?.timestamp instanceof Date
            ? response.timestamp.getTime()
            : response?.timestamp || Date.now(),
        finishReason: finishReason,
      };
    } catch (error) {
      logger.warn("Failed to collect metadata from stream result", { error });
      const finishReason = await result.finishReason.catch(() => "error");
      return {
        timestamp: Date.now(),
        finishReason: finishReason,
      };
    }
  }

  /**
   * Create comprehensive analytics from stream result
   */
  async createAnalytics(
    provider: string,
    model: string,
    result: StreamTextResult,
    responseTime: number,
    metadata?: Record<string, unknown>,
  ): Promise<AnalyticsData> {
    try {
      // Collect analytics data in parallel
      const [usage, responseMetadata] = await Promise.all([
        this.collectUsage(result),
        this.collectMetadata(result),
      ]);

      // Get final text content and finish reason
      const [content, finishReason, toolResults, toolCalls] = await Promise.all(
        [
          result.text,
          result.finishReason,
          result.toolResults || Promise.resolve([]),
          result.toolCalls || Promise.resolve([]),
        ],
      );

      // Create comprehensive analytics
      return createAnalytics(
        provider,
        model,
        {
          usage,
          content,
          response: responseMetadata,
          finishReason: finishReason,
          toolResults: toolResults,
          toolCalls: toolCalls,
        },
        responseTime,
        {
          ...metadata,
          streamingMode: true,
          responseId: responseMetadata.id,
          finishReason: finishReason,
        },
      );
    } catch (error) {
      logger.error("Failed to create analytics from stream result", {
        provider,
        model,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return minimal analytics on error
      return createAnalytics(
        provider,
        model,
        { usage: { input: 0, output: 0, total: 0 } },
        responseTime,
        {
          ...metadata,
          streamingMode: true,
          analyticsError: true,
        },
      );
    }
  }

  /**
   * Clean up resources and force garbage collection if needed
   */
  cleanup(): void {
    // Only force garbage collection if memory usage exceeds 500 MB
    const heapUsed = process.memoryUsage().heapUsed;
    const GC_THRESHOLD = 500 * 1024 * 1024; // 500 MB
    if (typeof global !== "undefined" && global.gc && heapUsed > GC_THRESHOLD) {
      global.gc();
    }
  }
}

/**
 * Global instance of stream analytics collector
 */
export const streamAnalyticsCollector = new BaseStreamAnalyticsCollector();
