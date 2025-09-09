/**
 * Configuration for the Auto-Evaluation middleware.
 * Following the same pattern as Guardrails middleware.
 */
export interface AutoEvaluationConfig {
  // Quality settings
  quality?: {
    threshold?: number; // Default: 7/10
    strictMode?: boolean; // All scores must meet threshold
  };

  // Retry settings
  retry?: {
    maxAttempts?: number; // Default: 3
    backoffMultiplier?: number; // Default: 1.5
  };

  // Evaluation model settings
  evaluationModel?: {
    provider?: string; // Default: same as generation provider
    model?: string; // Default: auto-select based on provider
    temperature?: number; // Default: 0.3 for consistency
  };

  // Performance settings
  performance?: {
    timeout?: number; // Default: 120000ms (2 minutes)
    cache?: boolean; // Default: true
    cacheTTL?: number; // Default: 3600000ms (1 hour)
  };

  // Telemetry settings
  telemetry?: {
    enabled?: boolean; // Default: true
    endpoint?: string; // Optional telemetry endpoint
  };
}

// Default configuration - always enabled, no feature flags needed
export const DEFAULT_AUTO_EVALUATION_CONFIG: Required<AutoEvaluationConfig> = {
  quality: {
    threshold: 7,
    strictMode: false,
  },
  retry: {
    maxAttempts: 3,
    backoffMultiplier: 1.5,
  },
  evaluationModel: {
    provider: "", // Will use same as generation provider
    model: "", // Will auto-select
    temperature: 0.3,
  },
  performance: {
    timeout: 120000,
    cache: true,
    cacheTTL: 3600000,
  },
  telemetry: {
    enabled: true,
    endpoint: "",
  },
};
