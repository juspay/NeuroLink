/**
 * Backpressure Handling for Streaming
 *
 * Provides utilities for managing backpressure in streaming scenarios where
 * the producer (AI model) may generate data faster than the consumer can process.
 *
 * Features:
 * - Buffered streams with configurable high/low watermarks
 * - Pause/resume signaling
 * - Flow control with rate limiting
 * - Memory-bounded buffering
 *
 * @module streaming/backpressure
 */

import { logger } from "../utils/logger.js";
// No custom event type imports — all utilities are fully generic over <T>

// ============================================
// CONFIGURATION TYPES
// ============================================

/**
 * Backpressure configuration options
 */
export type BackpressureConfig = {
  /** High watermark - pause when buffer exceeds this (default: 100 items) */
  highWatermark: number;
  /** Low watermark - resume when buffer drops below this (default: 25 items) */
  lowWatermark: number;
  /** Maximum buffer size - drop oldest items if exceeded (default: 1000 items) */
  maxBufferSize: number;
  /** Maximum memory usage in bytes (default: 50MB) */
  maxMemoryBytes: number;
  /** Enable memory monitoring (default: true) */
  monitorMemory: boolean;
  /** Strategy when buffer overflows */
  overflowStrategy: "drop-oldest" | "drop-newest" | "error";
  /** Callback when backpressure is applied */
  onPressure?: (paused: boolean, bufferSize: number) => void;
  /** Callback when items are dropped */
  onDrop?: (dropped: number, reason: "overflow" | "memory") => void;
};

/**
 * Default backpressure configuration
 */
export const DEFAULT_BACKPRESSURE_CONFIG: BackpressureConfig = {
  highWatermark: 100,
  lowWatermark: 25,
  maxBufferSize: 1000,
  maxMemoryBytes: 50 * 1024 * 1024, // 50MB
  monitorMemory: true,
  overflowStrategy: "drop-oldest",
};

/**
 * Backpressure state
 */
export type BackpressureState = {
  /** Current buffer size */
  bufferSize: number;
  /** Whether producer is paused */
  isPaused: boolean;
  /** Total items buffered */
  totalBuffered: number;
  /** Total items dropped */
  totalDropped: number;
  /** Estimated memory usage */
  memoryUsage: number;
  /** Time spent paused (ms) */
  pausedTime: number;
};

// ============================================
// BACKPRESSURE CONTROLLER
// ============================================

/**
 * BackpressureController - Manages flow control between producer and consumer
 *
 * @example Basic usage
 * ```typescript
 * const controller = new BackpressureController({ highWatermark: 50 });
 *
 * // Producer side
 * for await (const event of sourceStream) {
 *   await controller.push(event); // Will pause if buffer full
 * }
 * controller.end();
 *
 * // Consumer side
 * for await (const event of controller.stream()) {
 *   // Process event
 * }
 * ```
 */
export class BackpressureController<T = unknown> {
  private readonly config: BackpressureConfig;
  private readonly buffer: T[] = [];
  private isPaused: boolean = false;
  private isEnded: boolean = false;
  private hasError: boolean = false;
  private error: Error | null = null;
  private totalBuffered: number = 0;
  private totalDropped: number = 0;
  private pauseStartTime: number | null = null;
  private totalPausedTime: number = 0;

  // Resolvers for async operations
  private pushResolver: (() => void) | null = null;
  private pullResolver: ((value: IteratorResult<T>) => void) | null = null;

  constructor(config: Partial<BackpressureConfig> = {}) {
    this.config = { ...DEFAULT_BACKPRESSURE_CONFIG, ...config };
  }

  /**
   * Push an item to the buffer (producer side)
   * Resolves when the item is buffered, may pause if buffer is full
   */
  async push(item: T): Promise<void> {
    // If consumer is waiting, deliver directly
    if (this.pullResolver) {
      const resolver = this.pullResolver;
      this.pullResolver = null;
      resolver({ value: item, done: false });
      return;
    }

    // Check memory pressure
    if (
      this.config.monitorMemory &&
      this.estimateMemory() > this.config.maxMemoryBytes
    ) {
      this.handleOverflow("memory");
    }

    // Check buffer overflow
    if (this.buffer.length >= this.config.maxBufferSize) {
      this.handleOverflow("overflow");
    }

    // Buffer the item
    this.buffer.push(item);
    this.totalBuffered++;

    // Check if we need to apply backpressure
    if (this.buffer.length >= this.config.highWatermark && !this.isPaused) {
      this.pause();
    }

    // If paused, wait for signal to resume
    if (this.isPaused) {
      await new Promise<void>((resolve) => {
        this.pushResolver = resolve;
      });
    }
  }

  /**
   * Signal end of stream (producer side)
   */
  end(): void {
    this.isEnded = true;

    // If consumer is waiting, signal end
    if (this.pullResolver) {
      const resolver = this.pullResolver;
      this.pullResolver = null;
      resolver({ value: undefined as unknown as T, done: true });
    }
  }

  /**
   * Signal error (producer side)
   */
  setError(error: Error): void {
    this.hasError = true;
    this.error = error;

    // If consumer is waiting, throw error
    if (this.pullResolver) {
      this.pullResolver = null;
      // Error will be thrown on next pull
    }
  }

  /**
   * Get the stream (consumer side)
   */
  stream(): AsyncIterable<T> {
    const self = this;

    return {
      [Symbol.asyncIterator]() {
        return {
          async next(): Promise<IteratorResult<T>> {
            return self.pull();
          },
        };
      },
    };
  }

  /**
   * Pull an item from the buffer (consumer side)
   */
  async pull(): Promise<IteratorResult<T>> {
    // Check for error
    if (this.hasError && this.error) {
      throw this.error;
    }

    // If buffer has items, return immediately
    if (this.buffer.length > 0) {
      const item = this.buffer.shift()!;

      // Check if we should resume producer
      if (this.isPaused && this.buffer.length <= this.config.lowWatermark) {
        this.resume();
      }

      return { value: item, done: false };
    }

    // If ended with empty buffer, signal done
    if (this.isEnded) {
      return { value: undefined as unknown as T, done: true };
    }

    // Wait for producer to push or end
    return new Promise((resolve) => {
      this.pullResolver = resolve;
    });
  }

  /**
   * Get current state
   */
  getState(): BackpressureState {
    return {
      bufferSize: this.buffer.length,
      isPaused: this.isPaused,
      totalBuffered: this.totalBuffered,
      totalDropped: this.totalDropped,
      memoryUsage: this.estimateMemory(),
      pausedTime:
        this.totalPausedTime +
        (this.pauseStartTime ? Date.now() - this.pauseStartTime : 0),
    };
  }

  /**
   * Check if controller is paused
   */
  get paused(): boolean {
    return this.isPaused;
  }

  /**
   * Check if controller has ended
   */
  get ended(): boolean {
    return this.isEnded;
  }

  /**
   * Get current buffer size
   */
  get size(): number {
    return this.buffer.length;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Pause the producer
   */
  private pause(): void {
    this.isPaused = true;
    this.pauseStartTime = Date.now();
    this.config.onPressure?.(true, this.buffer.length);
    logger.debug("Backpressure: producer paused", {
      bufferSize: this.buffer.length,
    });
  }

  /**
   * Resume the producer
   */
  private resume(): void {
    if (this.pauseStartTime) {
      this.totalPausedTime += Date.now() - this.pauseStartTime;
      this.pauseStartTime = null;
    }
    this.isPaused = false;
    this.config.onPressure?.(false, this.buffer.length);
    logger.debug("Backpressure: producer resumed", {
      bufferSize: this.buffer.length,
    });

    // Signal waiting producer
    if (this.pushResolver) {
      const resolver = this.pushResolver;
      this.pushResolver = null;
      resolver();
    }
  }

  /**
   * Handle buffer overflow
   */
  private handleOverflow(reason: "overflow" | "memory"): void {
    switch (this.config.overflowStrategy) {
      case "drop-oldest": {
        const dropped = this.buffer.shift();
        if (dropped) {
          this.totalDropped++;
          this.config.onDrop?.(1, reason);
          logger.warn("Backpressure: dropped oldest item", { reason });
        }
        break;
      }

      case "drop-newest": {
        // Don't add the new item (handled by caller not pushing)
        this.totalDropped++;
        this.config.onDrop?.(1, reason);
        logger.warn("Backpressure: dropped newest item", { reason });
        break;
      }

      case "error":
        throw new Error(`Buffer overflow: ${reason}`);
    }
  }

  /**
   * Estimate memory usage of buffer
   */
  private estimateMemory(): number {
    // Rough estimate: JSON stringify and measure length
    // This is expensive, so should be used sparingly
    try {
      return this.buffer.reduce((acc, item) => {
        return acc + JSON.stringify(item).length * 2; // UTF-16 characters
      }, 0);
    } catch {
      return this.buffer.length * 1000; // Fallback estimate
    }
  }
}

// ============================================
// STREAM TRANSFORMERS WITH BACKPRESSURE
// ============================================

/**
 * Apply backpressure to an async iterable stream
 */
export function withBackpressure<T>(
  stream: AsyncIterable<T>,
  config: Partial<BackpressureConfig> = {},
): AsyncIterable<T> {
  const controller = new BackpressureController<T>(config);

  // Start producer in background
  (async () => {
    try {
      for await (const item of stream) {
        await controller.push(item);
      }
      controller.end();
    } catch (error) {
      controller.setError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  })();

  return controller.stream();
}

/**
 * Buffer stream with memory-bounded buffering
 */
export async function* bufferedStream<T>(
  stream: AsyncIterable<T>,
  options: {
    maxItems?: number;
    maxMemoryBytes?: number;
    flushIntervalMs?: number;
  } = {},
): AsyncGenerator<T[]> {
  const maxItems = options.maxItems ?? 100;
  const flushIntervalMs = options.flushIntervalMs ?? 100;

  const buffer: T[] = [];
  let lastFlush = Date.now();

  for await (const item of stream) {
    buffer.push(item);

    const shouldFlush =
      buffer.length >= maxItems || Date.now() - lastFlush >= flushIntervalMs;

    if (shouldFlush && buffer.length > 0) {
      yield [...buffer];
      buffer.length = 0;
      lastFlush = Date.now();
    }
  }

  // Flush remaining
  if (buffer.length > 0) {
    yield buffer;
  }
}

/**
 * Rate limit a stream to maximum items per second
 */
export async function* rateLimitedStream<T>(
  stream: AsyncIterable<T>,
  itemsPerSecond: number,
): AsyncGenerator<T> {
  const minInterval = 1000 / itemsPerSecond;
  let lastEmit = 0;

  for await (const item of stream) {
    const now = Date.now();
    const elapsed = now - lastEmit;

    if (elapsed < minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, minInterval - elapsed),
      );
    }

    yield item;
    lastEmit = Date.now();
  }
}

/**
 * Create a chunked stream that batches items by time or count
 */
export async function* chunkedStream<T>(
  stream: AsyncIterable<T>,
  options: {
    chunkSize?: number;
    chunkTimeoutMs?: number;
  } = {},
): AsyncGenerator<T[]> {
  const chunkSize = options.chunkSize ?? 10;
  const chunkTimeoutMs = options.chunkTimeoutMs ?? 50;

  let chunk: T[] = [];
  let chunkStartTime = Date.now();

  for await (const item of stream) {
    chunk.push(item);

    const shouldFlush =
      chunk.length >= chunkSize ||
      Date.now() - chunkStartTime >= chunkTimeoutMs;

    if (shouldFlush) {
      yield chunk;
      chunk = [];
      chunkStartTime = Date.now();
    }
  }

  // Flush remaining
  if (chunk.length > 0) {
    yield chunk;
  }
}

// ============================================
// PRESSURE MONITORING
// ============================================

/**
 * Monitor stream pressure and emit warnings
 */
export function createPressureMonitor(
  config: {
    warningThreshold?: number;
    criticalThreshold?: number;
    checkIntervalMs?: number;
    onWarning?: (state: BackpressureState) => void;
    onCritical?: (state: BackpressureState) => void;
  } = {},
): {
  attach: (controller: BackpressureController) => void;
  detach: () => void;
  getStats: () => { warnings: number; criticals: number };
} {
  const warningThreshold = config.warningThreshold ?? 0.7;
  const criticalThreshold = config.criticalThreshold ?? 0.9;
  const checkIntervalMs = config.checkIntervalMs ?? 1000;

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let controller: BackpressureController | null = null;
  let warnings = 0;
  let criticals = 0;

  const check = () => {
    if (!controller) {
      return;
    }

    const state = controller.getState();
    const pressure =
      state.bufferSize / DEFAULT_BACKPRESSURE_CONFIG.highWatermark;

    if (pressure >= criticalThreshold) {
      criticals++;
      config.onCritical?.(state);
      logger.error("Backpressure: CRITICAL", state);
    } else if (pressure >= warningThreshold) {
      warnings++;
      config.onWarning?.(state);
      logger.warn("Backpressure: WARNING", state);
    }
  };

  return {
    attach(ctrl: BackpressureController) {
      controller = ctrl;
      intervalId = setInterval(check, checkIntervalMs);
    },
    detach() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      controller = null;
    },
    getStats() {
      return { warnings, criticals };
    },
  };
}

// ============================================
// ADAPTIVE RATE CONTROL
// ============================================

/**
 * Adaptive rate controller that adjusts based on consumer performance
 */
export class AdaptiveRateController<T> {
  private targetLatencyMs: number;
  private minRate: number;
  private maxRate: number;
  private currentRate: number;
  private latencyHistory: number[] = [];
  private readonly historySize = 10;

  constructor(
    options: {
      targetLatencyMs?: number;
      minRate?: number;
      maxRate?: number;
      initialRate?: number;
    } = {},
  ) {
    this.targetLatencyMs = options.targetLatencyMs ?? 50;
    this.minRate = options.minRate ?? 10;
    this.maxRate = options.maxRate ?? 1000;
    this.currentRate = options.initialRate ?? 100;
  }

  /**
   * Process stream with adaptive rate control
   */
  async *process(stream: AsyncIterable<T>): AsyncGenerator<T> {
    for await (const item of stream) {
      const start = Date.now();
      yield item;
      const latency = Date.now() - start;

      this.recordLatency(latency);
      this.adjustRate();
    }
  }

  /**
   * Get current rate
   */
  getRate(): number {
    return this.currentRate;
  }

  /**
   * Get current rate (alias for getRate)
   */
  getCurrentRate(): number {
    return this.currentRate;
  }

  /**
   * Record a latency measurement
   */
  recordLatency(latency: number): void {
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > this.historySize) {
      this.latencyHistory.shift();
    }
    this.adjustRate();
  }

  /**
   * Get average latency
   */
  getAverageLatency(): number {
    if (this.latencyHistory.length === 0) {
      return 0;
    }
    return (
      this.latencyHistory.reduce((a, b) => a + b, 0) /
      this.latencyHistory.length
    );
  }

  private adjustRate(): void {
    const avgLatency = this.getAverageLatency();

    if (avgLatency > this.targetLatencyMs * 1.2) {
      // Slow down
      this.currentRate = Math.max(this.minRate, this.currentRate * 0.9);
    } else if (avgLatency < this.targetLatencyMs * 0.8) {
      // Speed up
      this.currentRate = Math.min(this.maxRate, this.currentRate * 1.1);
    }
  }
}
