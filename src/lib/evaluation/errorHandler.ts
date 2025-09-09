import { logger } from "../utils/logger.js";

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  lastError?: {
    timestamp: number;
    message: string;
    type: string;
  };
}

export class ErrorHandler {
  private errorCount = 0;
  private errorsByType: Record<string, number> = {};
  private lastError?: ErrorStats["lastError"];
  private circuitBreakerThreshold = 5;
  private circuitBreakerWindow = 60000; // 1 minute
  private circuitBreakerErrors: number[] = [];
  private isCircuitOpen = false;

  handleError(error: Error, context: string): void {
    this.errorCount++;
    const errorType = error.constructor.name;
    this.errorsByType[errorType] = (this.errorsByType[errorType] || 0) + 1;

    this.lastError = {
      timestamp: Date.now(),
      message: error.message,
      type: errorType,
    };

    logger.error(`[AutoEvaluation] ${context}:`, error);

    // Update circuit breaker
    this.updateCircuitBreaker();
  }

  private updateCircuitBreaker(): void {
    const now = Date.now();

    // Remove old errors outside the window
    this.circuitBreakerErrors = this.circuitBreakerErrors.filter(
      (timestamp) => now - timestamp < this.circuitBreakerWindow,
    );

    // Add current error
    this.circuitBreakerErrors.push(now);

    // Check if circuit should open
    if (this.circuitBreakerErrors.length >= this.circuitBreakerThreshold) {
      this.isCircuitOpen = true;
      logger.warn(
        `[AutoEvaluation] Circuit breaker opened due to ${this.circuitBreakerErrors.length} errors in ${this.circuitBreakerWindow}ms`,
      );

      // Schedule circuit reset
      setTimeout(() => {
        this.isCircuitOpen = false;
        this.circuitBreakerErrors = [];
        logger.info(`[AutoEvaluation] Circuit breaker reset`);
      }, this.circuitBreakerWindow);
    }
  }

  isEvaluationDisabled(): boolean {
    return this.isCircuitOpen;
  }

  getStats(): ErrorStats {
    return {
      totalErrors: this.errorCount,
      errorsByType: { ...this.errorsByType },
      lastError: this.lastError,
    };
  }

  reset(): void {
    this.errorCount = 0;
    this.errorsByType = {};
    this.lastError = undefined;
    this.circuitBreakerErrors = [];
    this.isCircuitOpen = false;
  }
}
