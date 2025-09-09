/**
 * Auto-Evaluation Configuration Manager
 * Manages configuration for the auto-evaluation system
 */

import type { AutoEvaluationConfig } from "../evaluation/autoEvaluationConfig.js";
import { DEFAULT_AUTO_EVALUATION_CONFIG } from "../evaluation/autoEvaluationConfig.js";
import { logger } from "../utils/logger.js";

export class AutoEvaluationConfigManager {
  private config: AutoEvaluationConfig;
  private environmentOverrides: Partial<AutoEvaluationConfig>;

  constructor() {
    this.config = { ...DEFAULT_AUTO_EVALUATION_CONFIG };
    this.environmentOverrides = this.loadEnvironmentConfig();
    this.applyEnvironmentOverrides();
  }

  /**
   * Load configuration from environment variables
   */
  private loadEnvironmentConfig(): Partial<AutoEvaluationConfig> {
    const overrides: Partial<AutoEvaluationConfig> = {};

    // Basic settings
    if (process.env.NEUROLINK_AUTO_EVAL_ENABLED !== undefined) {
      overrides.enabled = process.env.NEUROLINK_AUTO_EVAL_ENABLED === "true";
    }

    if (process.env.NEUROLINK_AUTO_EVAL_PROVIDER) {
      overrides.provider = process.env.NEUROLINK_AUTO_EVAL_PROVIDER;
    }

    if (process.env.NEUROLINK_AUTO_EVAL_MODEL) {
      overrides.model = process.env.NEUROLINK_AUTO_EVAL_MODEL;
    }

    if (process.env.NEUROLINK_AUTO_EVAL_TEMPERATURE) {
      overrides.temperature = parseFloat(
        process.env.NEUROLINK_AUTO_EVAL_TEMPERATURE,
      );
    }

    if (process.env.NEUROLINK_AUTO_EVAL_MAX_RETRIES) {
      overrides.maxRetries = parseInt(
        process.env.NEUROLINK_AUTO_EVAL_MAX_RETRIES,
        10,
      );
    }

    if (process.env.NEUROLINK_AUTO_EVAL_TIMEOUT) {
      overrides.timeout = parseInt(process.env.NEUROLINK_AUTO_EVAL_TIMEOUT, 10);
    }

    // Retry configuration
    if (process.env.NEUROLINK_AUTO_EVAL_RETRY_ENABLED !== undefined) {
      overrides.retryConfig = {
        ...overrides.retryConfig,
        enabled: process.env.NEUROLINK_AUTO_EVAL_RETRY_ENABLED === "true",
      };
    }

    if (process.env.NEUROLINK_AUTO_EVAL_RETRY_STRATEGY) {
      overrides.retryConfig = {
        ...overrides.retryConfig,
        strategy: process.env.NEUROLINK_AUTO_EVAL_RETRY_STRATEGY as
          | "STANDARD"
          | "AGGRESSIVE"
          | "CONSERVATIVE"
          | "ADAPTIVE",
      };
    }

    // Circuit breaker configuration
    if (process.env.NEUROLINK_AUTO_EVAL_CIRCUIT_BREAKER_THRESHOLD) {
      overrides.circuitBreaker = {
        ...overrides.circuitBreaker,
        failureThreshold: parseInt(
          process.env.NEUROLINK_AUTO_EVAL_CIRCUIT_BREAKER_THRESHOLD,
          10,
        ),
      };
    }

    if (process.env.NEUROLINK_AUTO_EVAL_CIRCUIT_BREAKER_RESET) {
      overrides.circuitBreaker = {
        ...overrides.circuitBreaker,
        resetTimeout: parseInt(
          process.env.NEUROLINK_AUTO_EVAL_CIRCUIT_BREAKER_RESET,
          10,
        ),
      };
    }

    // Score thresholds
    if (process.env.NEUROLINK_AUTO_EVAL_MIN_SCORE_RELEVANCE) {
      overrides.minScoreThresholds = {
        ...overrides.minScoreThresholds,
        relevance: parseFloat(
          process.env.NEUROLINK_AUTO_EVAL_MIN_SCORE_RELEVANCE,
        ),
      };
    }

    if (process.env.NEUROLINK_AUTO_EVAL_MIN_SCORE_ACCURACY) {
      overrides.minScoreThresholds = {
        ...overrides.minScoreThresholds,
        accuracy: parseFloat(
          process.env.NEUROLINK_AUTO_EVAL_MIN_SCORE_ACCURACY,
        ),
      };
    }

    if (process.env.NEUROLINK_AUTO_EVAL_MIN_SCORE_COMPLETENESS) {
      overrides.minScoreThresholds = {
        ...overrides.minScoreThresholds,
        completeness: parseFloat(
          process.env.NEUROLINK_AUTO_EVAL_MIN_SCORE_COMPLETENESS,
        ),
      };
    }

    if (process.env.NEUROLINK_AUTO_EVAL_MIN_SCORE_OVERALL) {
      overrides.minScoreThresholds = {
        ...overrides.minScoreThresholds,
        overall: parseFloat(process.env.NEUROLINK_AUTO_EVAL_MIN_SCORE_OVERALL),
      };
    }

    // Performance optimization
    if (process.env.NEUROLINK_AUTO_EVAL_CACHE_ENABLED !== undefined) {
      overrides.cache = {
        ...overrides.cache,
        enabled: process.env.NEUROLINK_AUTO_EVAL_CACHE_ENABLED === "true",
      };
    }

    if (process.env.NEUROLINK_AUTO_EVAL_CACHE_TTL) {
      overrides.cache = {
        ...overrides.cache,
        ttl: parseInt(process.env.NEUROLINK_AUTO_EVAL_CACHE_TTL, 10),
      };
    }

    if (process.env.NEUROLINK_AUTO_EVAL_CACHE_MAX_SIZE) {
      overrides.cache = {
        ...overrides.cache,
        maxSize: parseInt(process.env.NEUROLINK_AUTO_EVAL_CACHE_MAX_SIZE, 10),
      };
    }

    if (process.env.NEUROLINK_AUTO_EVAL_BATCH_SIZE) {
      overrides.batchSize = parseInt(
        process.env.NEUROLINK_AUTO_EVAL_BATCH_SIZE,
        10,
      );
    }

    if (process.env.NEUROLINK_AUTO_EVAL_PARALLEL_LIMIT) {
      overrides.parallelLimit = parseInt(
        process.env.NEUROLINK_AUTO_EVAL_PARALLEL_LIMIT,
        10,
      );
    }

    return overrides;
  }

  /**
   * Apply environment overrides to configuration
   */
  private applyEnvironmentOverrides(): void {
    this.config = {
      ...this.config,
      ...this.environmentOverrides,
      retryConfig: {
        ...this.config.retryConfig,
        ...this.environmentOverrides.retryConfig,
      },
      circuitBreaker: {
        ...this.config.circuitBreaker,
        ...this.environmentOverrides.circuitBreaker,
      },
      minScoreThresholds: {
        ...this.config.minScoreThresholds,
        ...this.environmentOverrides.minScoreThresholds,
      },
      cache: {
        ...this.config.cache,
        ...this.environmentOverrides.cache,
      },
    };

    logger.debug("Auto-evaluation configuration loaded", {
      config: this.config,
      environmentOverrides: Object.keys(this.environmentOverrides),
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoEvaluationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AutoEvaluationConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      retryConfig: {
        ...this.config.retryConfig,
        ...updates.retryConfig,
      },
      circuitBreaker: {
        ...this.config.circuitBreaker,
        ...updates.circuitBreaker,
      },
      minScoreThresholds: {
        ...this.config.minScoreThresholds,
        ...updates.minScoreThresholds,
      },
      cache: {
        ...this.config.cache,
        ...updates.cache,
      },
    };

    logger.info("Auto-evaluation configuration updated", {
      updates: Object.keys(updates),
    });
  }

  /**
   * Get provider-specific configuration
   */
  getProviderConfig(provider: string): Partial<AutoEvaluationConfig> {
    const providerConfigs: Record<string, Partial<AutoEvaluationConfig>> = {
      openai: {
        model: "gpt-4o-mini",
        temperature: 0.3,
        timeout: 45000,
      },
      anthropic: {
        model: "claude-3-5-haiku-latest",
        temperature: 0.2,
        timeout: 60000,
      },
      bedrock: {
        model: "claude-3-5-haiku-latest",
        temperature: 0.3,
        timeout: 50000,
      },
      vertex: {
        model: "gemini-2.5-flash",
        temperature: 0.3,
        timeout: 40000,
      },
      googleAi: {
        model: "gemini-2.5-flash",
        temperature: 0.3,
        timeout: 40000,
      },
    };

    return providerConfigs[provider] || {};
  }

  /**
   * Validate configuration
   */
  validateConfig(config: Partial<AutoEvaluationConfig>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        errors.push("Temperature must be between 0 and 2");
      }
    }

    if (config.maxRetries !== undefined) {
      if (config.maxRetries < 0 || config.maxRetries > 5) {
        errors.push("Max retries must be between 0 and 5");
      }
    }

    if (config.timeout !== undefined) {
      if (config.timeout < 1000 || config.timeout > 300000) {
        errors.push("Timeout must be between 1000ms and 300000ms");
      }
    }

    if (config.minScoreThresholds) {
      Object.entries(config.minScoreThresholds).forEach(([key, value]) => {
        if (value < 1 || value > 10) {
          errors.push(`Score threshold for ${key} must be between 1 and 10`);
        }
      });
    }

    if (config.batchSize !== undefined) {
      if (config.batchSize < 1 || config.batchSize > 100) {
        errors.push("Batch size must be between 1 and 100");
      }
    }

    if (config.parallelLimit !== undefined) {
      if (config.parallelLimit < 1 || config.parallelLimit > 10) {
        errors.push("Parallel limit must be between 1 and 10");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export configuration for debugging
   */
  exportConfig(): string {
    return JSON.stringify(
      {
        current: this.config,
        defaults: DEFAULT_AUTO_EVALUATION_CONFIG,
        environmentOverrides: this.environmentOverrides,
      },
      null,
      2,
    );
  }

  /**
   * Get configuration recommendations based on usage patterns
   */
  getRecommendations(usageStats?: {
    averageResponseTime?: number;
    failureRate?: number;
    averageScore?: number;
  }): string[] {
    const recommendations: string[] = [];

    if (usageStats) {
      // Response time recommendations
      if (
        usageStats.averageResponseTime &&
        usageStats.averageResponseTime > 10000
      ) {
        recommendations.push(
          "Consider increasing timeout or using a faster evaluation model",
        );
      }

      // Failure rate recommendations
      if (usageStats.failureRate && usageStats.failureRate > 0.1) {
        recommendations.push(
          "High failure rate detected. Consider adjusting circuit breaker settings or retry configuration",
        );
      }

      // Score recommendations
      if (usageStats.averageScore && usageStats.averageScore < 6) {
        recommendations.push(
          "Low average scores detected. Consider adjusting evaluation criteria or retry strategy",
        );
      }
    }

    // General recommendations
    if (!this.config.cache.enabled) {
      recommendations.push(
        "Enable caching to improve performance for repeated evaluations",
      );
    }

    if (this.config.retryConfig.strategy === "STANDARD") {
      recommendations.push(
        "Consider using ADAPTIVE retry strategy for better performance",
      );
    }

    return recommendations;
  }
}

// Singleton instance
export const autoEvaluationConfigManager = new AutoEvaluationConfigManager();
