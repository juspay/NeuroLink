import type { RetryResult } from "./retryTypes.js";
import { logger } from "../utils/logger.js";

export interface TelemetryEvent {
  eventType: "evaluation" | "retry" | "success" | "failure";
  timestamp: number;
  requestId: string;
  provider: string;
  model: string;
  duration: number;
  metadata: Record<string, unknown>;
}

export interface TelemetryConfig {
  enabled: boolean;
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number;
}

export class TelemetryCollector {
  private events: TelemetryEvent[] = [];
  private flushInterval?: NodeJS.Timeout;
  private config: Required<TelemetryConfig>;

  constructor(config: TelemetryConfig) {
    this.config = {
      enabled: config.enabled,
      endpoint: config.endpoint || "",
      batchSize: config.batchSize || 100,
      flushInterval: config.flushInterval || 30000, // 30 seconds
    };

    if (this.config.enabled && this.config.endpoint) {
      this.startBatchProcessing();
    }
  }

  collectEvaluationEvent(
    requestId: string,
    provider: string,
    model: string,
    result: RetryResult,
  ): void {
    if (!this.config.enabled) {
      return;
    }

    const event: TelemetryEvent = {
      eventType: result.success ? "success" : "failure",
      timestamp: Date.now(),
      requestId,
      provider,
      model,
      duration: result.totalDuration,
      metadata: {
        attempts: result.attempts.length,
        finalScore: result.finalEvaluation.overall,
        improvement: result.averageScoreImprovement,
        bottlenecks: result.retryMetadata.bottlenecks,
      },
    };

    this.events.push(event);
    logger.debug(`[Telemetry] Event collected`, { eventType: event.eventType });

    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  collectRetryEvent(
    requestId: string,
    attemptNumber: number,
    score: number,
    issues: string[],
  ): void {
    if (!this.config.enabled) {
      return;
    }

    const event: TelemetryEvent = {
      eventType: "retry",
      timestamp: Date.now(),
      requestId,
      provider: "unknown",
      model: "unknown",
      duration: 0,
      metadata: {
        attemptNumber,
        score,
        issues,
      },
    };

    this.events.push(event);
  }

  private startBatchProcessing(): void {
    this.flushInterval = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.events.length === 0 || !this.config.endpoint) {
      return;
    }

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      await this.sendEvents(eventsToFlush);
      logger.debug(`[Telemetry] Flushed ${eventsToFlush.length} events`);
    } catch (error) {
      logger.error(`[Telemetry] Failed to flush events:`, error);
      // Re-add events for retry
      this.events.unshift(...eventsToFlush);
    }
  }

  private async sendEvents(events: TelemetryEvent[]): Promise<void> {
    // In a real implementation, this would send to the telemetry endpoint
    // For now, we'll just log
    logger.info(
      `[Telemetry] Would send ${events.length} events to ${this.config.endpoint}`,
    );
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }

  // Get aggregated metrics
  getMetrics(): {
    totalEvaluations: number;
    successRate: number;
    averageAttempts: number;
    averageImprovement: number;
  } {
    const evaluations = this.events.filter(
      (e) => e.eventType === "success" || e.eventType === "failure",
    );
    const successful = evaluations.filter((e) => e.eventType === "success");

    const totalAttempts = evaluations.reduce(
      (sum, e) => sum + (e.metadata.attempts || 1),
      0,
    );
    const totalImprovement = evaluations.reduce(
      (sum, e) => sum + (e.metadata.improvement || 0),
      0,
    );

    return {
      totalEvaluations: evaluations.length,
      successRate:
        evaluations.length > 0 ? successful.length / evaluations.length : 0,
      averageAttempts:
        evaluations.length > 0 ? totalAttempts / evaluations.length : 0,
      averageImprovement:
        evaluations.length > 0 ? totalImprovement / evaluations.length : 0,
    };
  }
}
