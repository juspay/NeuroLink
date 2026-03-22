/**
 * Provider Integration Utilities
 *
 * Generic stream utilities for observation, text collection, and performance measurement.
 * Works with any AsyncIterable stream, including StreamResult.stream.
 *
 * @module streaming/providerIntegration
 */

import { logger } from "../utils/logger.js";

// ============================================
// STREAM OBSERVER
// ============================================

/**
 * StreamObserver - Observes stream items without consuming them.
 * Useful for logging, metrics, or side effects while preserving the stream.
 */
export class StreamObserver<T = unknown> {
  private readonly observers: Array<(item: T) => void | Promise<void>> = [];
  private itemCount: number = 0;
  private textLength: number = 0;
  private startTime: number | null = null;

  /**
   * Add an observer callback
   */
  observe(callback: (item: T) => void | Promise<void>): this {
    this.observers.push(callback);
    return this;
  }

  /**
   * Apply observer to stream — yields all items through while notifying observers
   */
  async *wrap(stream: AsyncIterable<T>): AsyncGenerator<T> {
    this.startTime = Date.now();

    for await (const item of stream) {
      this.itemCount++;

      // Track text length for content chunks
      if (item && typeof item === "object" && "content" in item) {
        this.textLength += String(
          (item as Record<string, unknown>).content,
        ).length;
      }

      // Notify observers
      for (const observer of this.observers) {
        try {
          await observer(item);
        } catch (error) {
          logger.warn("Stream observer error", { error });
        }
      }

      yield item;
    }
  }

  /**
   * Get observation stats
   */
  getStats(): { itemCount: number; textLength: number; elapsedMs: number } {
    return {
      itemCount: this.itemCount,
      textLength: this.textLength,
      elapsedMs: this.startTime ? Date.now() - this.startTime : 0,
    };
  }
}

/**
 * Create a stream observer
 */
export function createStreamObserver<T = unknown>(): StreamObserver<T> {
  return new StreamObserver<T>();
}

// ============================================
// STREAM UTILITIES
// ============================================

/**
 * Collect all text content from a stream.
 * Extracts `content` field from each chunk.
 */
export async function collectStreamText(
  stream: AsyncIterable<{ content: string } | Record<string, unknown>>,
): Promise<string> {
  let text = "";

  for await (const chunk of stream) {
    if ("content" in chunk && typeof chunk.content === "string") {
      text += chunk.content;
    }
  }

  return text;
}

/**
 * Count stream chunks
 */
export async function countStreamChunks<T>(
  stream: AsyncIterable<T>,
): Promise<number> {
  let count = 0;
  for await (const _ of stream) {
    count++;
  }
  return count;
}

/**
 * Measure stream performance — collects all chunks and reports timing
 */
export async function measureStreamPerformance<T>(
  stream: AsyncIterable<T>,
): Promise<{
  chunks: T[];
  firstChunkLatency: number;
  totalTime: number;
  chunkCount: number;
}> {
  const chunks: T[] = [];
  const startTime = Date.now();
  let firstChunkTime: number | null = null;

  for await (const chunk of stream) {
    if (firstChunkTime === null) {
      firstChunkTime = Date.now();
    }
    chunks.push(chunk);
  }

  const endTime = Date.now();

  return {
    chunks,
    firstChunkLatency: firstChunkTime ? firstChunkTime - startTime : 0,
    totalTime: endTime - startTime,
    chunkCount: chunks.length,
  };
}
