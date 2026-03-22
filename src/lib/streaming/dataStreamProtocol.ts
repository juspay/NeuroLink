/**
 * Data Stream Protocol Support
 *
 * Provides SSE (Server-Sent Events) encoding/decoding and HTTP Response
 * creation for streaming NeuroLink data to clients.
 *
 * Works with the existing StreamResult.stream shape:
 *   AsyncIterable<{ content: string }>
 *
 * @module streaming/dataStreamProtocol
 */

import { nanoid } from "nanoid";
import type { TokenUsage } from "../types/analytics.js";
import type { UnknownRecord } from "../types/common.js";

// ============================================
// SSE ENCODING/DECODING
// ============================================

/**
 * Encode any data to SSE format
 */
export function encodeSSE(data: unknown): string {
  const json = JSON.stringify(data);
  return `data: ${json}\n\n`;
}

/**
 * Encode multiple data items to SSE format
 */
export function encodeSSEBatch(items: unknown[]): string {
  return items.map(encodeSSE).join("");
}

/**
 * Encode done marker
 */
export function encodeSSEDone(): string {
  return "data: [DONE]\n\n";
}

/**
 * Parse SSE line to data
 */
export function parseSSELine(line: string): unknown | null {
  if (!line.startsWith("data: ")) {
    return null;
  }

  const data = line.slice(6).trim();

  if (data === "[DONE]") {
    return { type: "done" };
  }

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// ============================================
// SSE RESPONSE CREATION
// ============================================

/**
 * Options for SSE response creation
 */
export type SSEResponseOptions = {
  /** Stream ID for headers */
  streamId?: string;
  /** Include ping events for keep-alive */
  includePing?: boolean;
  /** Ping interval in milliseconds */
  pingIntervalMs?: number;
  /** Custom headers */
  headers?: Record<string, string>;
};

/**
 * Create an SSE Response from a content stream.
 * Works with StreamResult.stream (AsyncIterable<{ content: string }>).
 *
 * Each chunk is encoded as an SSE event. The stream ends with [DONE].
 *
 * @example
 * ```typescript
 * const result = await neurolink.stream({ prompt: "Hello" });
 * return toSSEResponse(result.stream);
 * ```
 */
export function toSSEResponse(
  stream: AsyncIterable<{ content: string } | Record<string, unknown>>,
  options: SSEResponseOptions = {},
): Response {
  const encoder = new TextEncoder();
  const streamId = options.streamId ?? nanoid();

  let pingInterval: ReturnType<typeof setInterval> | null = null;

  const readableStream = new ReadableStream({
    async start(controller) {
      // Setup ping interval for keep-alive
      if (options.includePing && options.pingIntervalMs) {
        pingInterval = setInterval(() => {
          controller.enqueue(encoder.encode(encodeSSE({ type: "ping" })));
        }, options.pingIntervalMs);
      }

      try {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(encodeSSE(chunk)));
        }

        controller.enqueue(encoder.encode(encodeSSEDone()));
        controller.close();
      } catch (err) {
        const errorEvent = {
          type: "error",
          error: err instanceof Error ? err.message : String(err),
        };
        controller.enqueue(encoder.encode(encodeSSE(errorEvent)));
        controller.enqueue(encoder.encode(encodeSSEDone()));
        controller.close();
      } finally {
        if (pingInterval) {
          clearInterval(pingInterval);
        }
      }
    },
    cancel() {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Stream-Id": streamId,
      ...options.headers,
    },
  });
}

/**
 * Parse an SSE response body into content chunks.
 *
 * @example
 * ```typescript
 * const response = await fetch("/api/stream");
 * for await (const chunk of parseSSEResponse(response)) {
 *   console.log(chunk.content);
 * }
 * ```
 */
export async function* parseSSEResponse(
  response: Response,
): AsyncGenerator<{ content: string } | Record<string, unknown>> {
  if (!response.body) {
    throw new Error("Response has no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events (separated by double newline)
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const parsed = parseSSELine(event.trim());

        if (!parsed || (parsed as { type: string }).type === "done") {
          continue;
        }

        // Yield the parsed chunk as-is
        yield parsed as { content: string } | Record<string, unknown>;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ============================================
// DATA PARTS SUPPORT
// ============================================

/**
 * Data part types for custom data streaming
 */
export type DataPartType = "status" | "progress" | "metadata" | "custom";

/**
 * Data part structure
 */
export type DataPart<T = unknown> = {
  type: DataPartType;
  key: string;
  value: T;
  transient?: boolean;
};

/**
 * Create a data part for injection into SSE streams
 */
export function createDataPart<T>(
  type: DataPartType,
  keyOrValue: string | T,
  value?: T,
  transient: boolean = false,
): Record<string, unknown> {
  // Handle two-argument signature: createDataPart("custom", { value: 123 })
  if (value === undefined) {
    return { type, data: keyOrValue };
  }

  // Handle four-argument signature: createDataPart("custom", "key", value, transient)
  return {
    type: "data",
    data: { type, key: keyOrValue as string, value, transient },
  };
}

/**
 * Create a status data part
 */
export function createStatusPart(status: string): Record<string, unknown> {
  return createDataPart("status", "status", status);
}

/**
 * Create a progress data part
 */
export function createProgressPart(
  current: number,
  total: number,
  message?: string,
): Record<string, unknown> {
  return createDataPart("progress", "progress", { current, total, message });
}

/**
 * Create a metadata data part
 */
export function createMetadataPart(
  metadata: UnknownRecord,
): Record<string, unknown> {
  return createDataPart("metadata", "metadata", metadata);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert NeuroLink TokenUsage to AI SDK usage format
 */
export function toAISDKUsage(usage: TokenUsage): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  return {
    promptTokens: usage.input,
    completionTokens: usage.output,
    totalTokens: usage.total,
  };
}

/**
 * Convert AI SDK usage to NeuroLink TokenUsage format
 */
export function fromAISDKUsage(usage: {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}): TokenUsage {
  return {
    input: usage.promptTokens,
    output: usage.completionTokens,
    total: usage.totalTokens,
  };
}

// Legacy aliases for backward compatibility
export { toSSEResponse as createDataStreamResponse };
export { parseSSEResponse as parseDataStream };
