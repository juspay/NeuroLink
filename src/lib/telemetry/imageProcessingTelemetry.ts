/**
 * Image Processing Telemetry
 * Provides metrics and counters for monitoring image processing operations.
 *
 * Features:
 * - Processing time tracking (histogram)
 * - Success/failure counters
 * - Image size distribution tracking (histogram)
 *
 * Integrates with existing TelemetryService for OpenTelemetry support.
 */

import { TelemetryService } from "./telemetryService.js";
import { logger } from "../utils/logger.js";

/**
 * Image processing operation types
 */
export type ImageOperation =
  | "process"
  | "processForOpenAI"
  | "processForGoogle"
  | "processForAnthropic"
  | "processForVertex"
  | "detectImageType"
  | "validateImageSize"
  | "validateImageFormat";

/**
 * Metrics for a single image processing operation
 */
export interface ImageProcessingMetrics {
  operation: ImageOperation;
  provider?: string;
  model?: string;
  imageSize: number;
  processingTimeMs: number;
  success: boolean;
  errorType?: string;
  mimeType?: string;
}

/**
 * Size bucket labels for histogram
 */
type SizeBucket = "tiny" | "small" | "medium" | "large" | "very_large" | "huge";

/**
 * Duration bucket labels for histogram
 */
type DurationBucket = "instant" | "fast" | "normal" | "slow" | "very_slow";

/**
 * Aggregated statistics for image processing
 */
export interface ImageProcessingStats {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageProcessingTimeMs: number;
  averageSizeBytes: number;
  sizeDistribution: Record<SizeBucket, number>;
  durationDistribution: Record<DurationBucket, number>;
  operationBreakdown: Record<ImageOperation, number>;
  providerBreakdown: Record<string, number>;
  errorBreakdown: Record<string, number>;
}

/**
 * Image Processing Telemetry class
 * Tracks metrics and provides monitoring for image processing operations.
 */
export class ImageProcessingTelemetry {
  private static instance: ImageProcessingTelemetry;
  private telemetryService: TelemetryService;

  // Runtime metrics tracking
  private totalProcessed: number = 0;
  private successCount: number = 0;
  private failureCount: number = 0;
  private totalProcessingTime: number = 0;
  private totalSize: number = 0;

  // Distribution tracking
  private sizeDistribution: Record<SizeBucket, number> = {
    tiny: 0,
    small: 0,
    medium: 0,
    large: 0,
    very_large: 0,
    huge: 0,
  };

  private durationDistribution: Record<DurationBucket, number> = {
    instant: 0,
    fast: 0,
    normal: 0,
    slow: 0,
    very_slow: 0,
  };

  private operationBreakdown: Record<ImageOperation, number> = {
    process: 0,
    processForOpenAI: 0,
    processForGoogle: 0,
    processForAnthropic: 0,
    processForVertex: 0,
    detectImageType: 0,
    validateImageSize: 0,
    validateImageFormat: 0,
  };

  private providerBreakdown: Record<string, number> = {};
  private errorBreakdown: Record<string, number> = {};

  private constructor() {
    this.telemetryService = TelemetryService.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ImageProcessingTelemetry {
    if (!ImageProcessingTelemetry.instance) {
      ImageProcessingTelemetry.instance = new ImageProcessingTelemetry();
    }
    return ImageProcessingTelemetry.instance;
  }

  /**
   * Record an image processing operation
   */
  recordOperation(metrics: ImageProcessingMetrics): void {
    // Update counters
    this.totalProcessed++;
    if (metrics.success) {
      this.successCount++;
    } else {
      this.failureCount++;
      if (metrics.errorType) {
        this.errorBreakdown[metrics.errorType] =
          (this.errorBreakdown[metrics.errorType] || 0) + 1;
      }
    }

    // Update aggregates
    this.totalProcessingTime += metrics.processingTimeMs;
    this.totalSize += metrics.imageSize;

    // Update distributions
    this.sizeDistribution[this.getSizeBucket(metrics.imageSize)]++;
    this.durationDistribution[
      this.getDurationBucket(metrics.processingTimeMs)
    ]++;

    // Update operation breakdown
    this.operationBreakdown[metrics.operation]++;

    // Update provider breakdown
    if (metrics.provider) {
      this.providerBreakdown[metrics.provider] =
        (this.providerBreakdown[metrics.provider] || 0) + 1;
    }

    // Record to OpenTelemetry if enabled
    this.recordToOpenTelemetry(metrics);

    // Log debug info
    logger.debug(
      `[ImageTelemetry] ${metrics.operation}: ${metrics.success ? "success" : "failure"} ` +
        `(${metrics.processingTimeMs}ms, ${this.formatSize(metrics.imageSize)})`,
    );
  }

  /**
   * Track a processing operation with automatic timing
   */
  async trackOperation<T>(
    operation: ImageOperation,
    imageSize: number,
    fn: () => Promise<T>,
    options?: { provider?: string; model?: string; mimeType?: string },
  ): Promise<T> {
    const startTime = performance.now();
    let success = true;
    let errorType: string | undefined;

    try {
      const result = await fn();
      return result;
    } catch (error) {
      success = false;
      errorType = error instanceof Error ? error.name : "UnknownError";
      throw error;
    } finally {
      const processingTimeMs = performance.now() - startTime;
      this.recordOperation({
        operation,
        provider: options?.provider,
        model: options?.model,
        imageSize,
        processingTimeMs,
        success,
        errorType,
        mimeType: options?.mimeType,
      });
    }
  }

  /**
   * Track a synchronous processing operation with automatic timing
   */
  trackSync<T>(
    operation: ImageOperation,
    imageSize: number,
    fn: () => T,
    options?: { provider?: string; model?: string; mimeType?: string },
  ): T {
    const startTime = performance.now();
    let success = true;
    let errorType: string | undefined;

    try {
      const result = fn();
      return result;
    } catch (error) {
      success = false;
      errorType = error instanceof Error ? error.name : "UnknownError";
      throw error;
    } finally {
      const processingTimeMs = performance.now() - startTime;
      this.recordOperation({
        operation,
        provider: options?.provider,
        model: options?.model,
        imageSize,
        processingTimeMs,
        success,
        errorType,
        mimeType: options?.mimeType,
      });
    }
  }

  /**
   * Get current statistics
   */
  getStats(): ImageProcessingStats {
    const successRate =
      this.totalProcessed > 0
        ? (this.successCount / this.totalProcessed) * 100
        : 0;

    const averageProcessingTimeMs =
      this.totalProcessed > 0
        ? this.totalProcessingTime / this.totalProcessed
        : 0;

    const averageSizeBytes =
      this.totalProcessed > 0 ? this.totalSize / this.totalProcessed : 0;

    return {
      totalProcessed: this.totalProcessed,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate: Math.round(successRate * 100) / 100,
      averageProcessingTimeMs: Math.round(averageProcessingTimeMs * 100) / 100,
      averageSizeBytes: Math.round(averageSizeBytes),
      sizeDistribution: { ...this.sizeDistribution },
      durationDistribution: { ...this.durationDistribution },
      operationBreakdown: { ...this.operationBreakdown },
      providerBreakdown: { ...this.providerBreakdown },
      errorBreakdown: { ...this.errorBreakdown },
    };
  }

  /**
   * Reset all statistics (useful for testing)
   */
  reset(): void {
    this.totalProcessed = 0;
    this.successCount = 0;
    this.failureCount = 0;
    this.totalProcessingTime = 0;
    this.totalSize = 0;

    this.sizeDistribution = {
      tiny: 0,
      small: 0,
      medium: 0,
      large: 0,
      very_large: 0,
      huge: 0,
    };

    this.durationDistribution = {
      instant: 0,
      fast: 0,
      normal: 0,
      slow: 0,
      very_slow: 0,
    };

    this.operationBreakdown = {
      process: 0,
      processForOpenAI: 0,
      processForGoogle: 0,
      processForAnthropic: 0,
      processForVertex: 0,
      detectImageType: 0,
      validateImageSize: 0,
      validateImageFormat: 0,
    };

    this.providerBreakdown = {};
    this.errorBreakdown = {};

    logger.debug("[ImageTelemetry] Statistics reset");
  }

  /**
   * Record metrics to OpenTelemetry
   */
  private recordToOpenTelemetry(metrics: ImageProcessingMetrics): void {
    const labels: Record<string, string> = {
      operation: metrics.operation,
      success: metrics.success.toString(),
    };

    if (metrics.provider) {
      labels.provider = metrics.provider;
    }
    if (metrics.mimeType) {
      labels.mime_type = metrics.mimeType;
    }
    if (metrics.errorType) {
      labels.error_type = metrics.errorType;
    }

    // Record processing time histogram
    this.telemetryService.recordCustomHistogram(
      "image_processing_duration_ms",
      metrics.processingTimeMs,
      labels,
    );

    // Record size histogram
    this.telemetryService.recordCustomHistogram(
      "image_processing_size_bytes",
      metrics.imageSize,
      labels,
    );

    // Record success/failure counter
    this.telemetryService.recordCustomMetric(
      "image_processing_operations",
      1,
      labels,
    );
  }

  /**
   * Get size bucket for distribution tracking
   */
  private getSizeBucket(bytes: number): SizeBucket {
    if (bytes < 10 * 1024) {
      return "tiny"; // < 10KB
    }
    if (bytes < 100 * 1024) {
      return "small"; // 10KB - 100KB
    }
    if (bytes < 500 * 1024) {
      return "medium"; // 100KB - 500KB
    }
    if (bytes < 1024 * 1024) {
      return "large"; // 500KB - 1MB
    }
    if (bytes < 5 * 1024 * 1024) {
      return "very_large"; // 1MB - 5MB
    }
    return "huge"; // > 5MB
  }

  /**
   * Get duration bucket for distribution tracking
   */
  private getDurationBucket(ms: number): DurationBucket {
    if (ms < 1) {
      return "instant"; // < 1ms
    }
    if (ms < 10) {
      return "fast"; // 1ms - 10ms
    }
    if (ms < 100) {
      return "normal"; // 10ms - 100ms
    }
    if (ms < 500) {
      return "slow"; // 100ms - 500ms
    }
    return "very_slow"; // > 500ms
  }

  /**
   * Format size in human-readable format
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes}B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)}KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
}
