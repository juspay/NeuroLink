/**
 * Extended configuration interface for Auto-Evaluation that includes all settings
 * This extends the base AutoEvaluationConfig with additional properties needed
 * by the implementation.
 */

import type { AutoEvaluationConfig } from "./autoEvaluationConfig.js";

export interface ExtendedAutoEvaluationConfig extends AutoEvaluationConfig {
  // Direct properties for simplified access
  enabled?: boolean;
  provider?: string;
  model?: string;
  temperature?: number;
  maxRetries?: number;
  timeout?: number;

  // Retry configuration
  retryConfig?: {
    enabled?: boolean;
    strategy?: "STANDARD" | "AGGRESSIVE" | "CONSERVATIVE" | "ADAPTIVE";
    minScoreThreshold?: number;
    feedbackIntegration?: "APPEND" | "REPLACE" | "MERGE" | "HIERARCHICAL";
    backoffMultiplier?: number;
    baseDelay?: number;
  };

  // Circuit breaker configuration
  circuitBreaker?: {
    failureThreshold?: number;
    resetTimeout?: number;
    halfOpenRequests?: number;
  };

  // Score thresholds
  minScoreThresholds?: {
    relevance?: number;
    accuracy?: number;
    completeness?: number;
    overall?: number;
  };

  // Cache configuration
  cache?: {
    enabled?: boolean;
    ttl?: number;
    maxSize?: number;
  };

  // Performance optimization
  batchSize?: number;
  parallelLimit?: number;
}

// Default extended configuration
export const DEFAULT_EXTENDED_AUTO_EVALUATION_CONFIG: ExtendedAutoEvaluationConfig =
  {
    enabled: true,
    provider: "auto",
    model: "auto",
    temperature: 0.3,
    maxRetries: 3,
    timeout: 30000,

    retryConfig: {
      enabled: true,
      strategy: "ADAPTIVE",
      minScoreThreshold: 7,
      feedbackIntegration: "MERGE",
      backoffMultiplier: 1.5,
      baseDelay: 1000,
    },

    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRequests: 1,
    },

    minScoreThresholds: {
      relevance: 7,
      accuracy: 7,
      completeness: 6,
      overall: 7,
    },

    cache: {
      enabled: true,
      ttl: 3600000,
      maxSize: 1000,
    },

    batchSize: 5,
    parallelLimit: 3,
  };
