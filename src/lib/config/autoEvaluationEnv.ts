/**
 * Auto-Evaluation Environment Variables Documentation
 *
 * This file documents all environment variables used by the auto-evaluation system.
 * Copy the variables you need to your .env file and adjust the values.
 */

export const AUTO_EVALUATION_ENV_VARS = {
  // Basic Configuration
  NEUROLINK_AUTO_EVAL_ENABLED: {
    description: "Enable or disable auto-evaluation globally",
    type: "boolean",
    default: "true",
    example: "NEUROLINK_AUTO_EVAL_ENABLED=true",
  },

  NEUROLINK_AUTO_EVAL_PROVIDER: {
    description:
      "Default provider for evaluation (auto selects best available)",
    type: "string",
    default: "auto",
    example: "NEUROLINK_AUTO_EVAL_PROVIDER=openai",
    options: ["auto", "openai", "anthropic", "bedrock", "vertex", "googleAi"],
  },

  NEUROLINK_AUTO_EVAL_MODEL: {
    description:
      "Default model for evaluation (auto selects appropriate model)",
    type: "string",
    default: "auto",
    example: "NEUROLINK_AUTO_EVAL_MODEL=gpt-4o-mini",
  },

  NEUROLINK_AUTO_EVAL_TEMPERATURE: {
    description: "Temperature for evaluation responses (0.0-2.0)",
    type: "number",
    default: "0.3",
    example: "NEUROLINK_AUTO_EVAL_TEMPERATURE=0.2",
    range: [0, 2],
  },

  NEUROLINK_AUTO_EVAL_MAX_RETRIES: {
    description: "Maximum retry attempts for failed evaluations",
    type: "number",
    default: "3",
    example: "NEUROLINK_AUTO_EVAL_MAX_RETRIES=2",
    range: [0, 5],
  },

  NEUROLINK_AUTO_EVAL_TIMEOUT: {
    description: "Timeout for evaluation requests in milliseconds",
    type: "number",
    default: "30000",
    example: "NEUROLINK_AUTO_EVAL_TIMEOUT=45000",
    range: [1000, 300000],
  },

  // Retry Configuration
  NEUROLINK_AUTO_EVAL_RETRY_ENABLED: {
    description: "Enable automatic retry on low scores",
    type: "boolean",
    default: "true",
    example: "NEUROLINK_AUTO_EVAL_RETRY_ENABLED=true",
  },

  NEUROLINK_AUTO_EVAL_RETRY_STRATEGY: {
    description: "Strategy for retry attempts",
    type: "string",
    default: "ADAPTIVE",
    example: "NEUROLINK_AUTO_EVAL_RETRY_STRATEGY=AGGRESSIVE",
    options: ["STANDARD", "AGGRESSIVE", "CONSERVATIVE", "ADAPTIVE"],
  },

  // Circuit Breaker Configuration
  NEUROLINK_AUTO_EVAL_CIRCUIT_BREAKER_THRESHOLD: {
    description: "Number of failures before circuit breaker opens",
    type: "number",
    default: "5",
    example: "NEUROLINK_AUTO_EVAL_CIRCUIT_BREAKER_THRESHOLD=3",
    range: [1, 10],
  },

  NEUROLINK_AUTO_EVAL_CIRCUIT_BREAKER_RESET: {
    description: "Time in milliseconds before circuit breaker resets",
    type: "number",
    default: "60000",
    example: "NEUROLINK_AUTO_EVAL_CIRCUIT_BREAKER_RESET=30000",
    range: [5000, 300000],
  },

  // Score Thresholds
  NEUROLINK_AUTO_EVAL_MIN_SCORE_RELEVANCE: {
    description: "Minimum acceptable relevance score (1-10)",
    type: "number",
    default: "7",
    example: "NEUROLINK_AUTO_EVAL_MIN_SCORE_RELEVANCE=8",
    range: [1, 10],
  },

  NEUROLINK_AUTO_EVAL_MIN_SCORE_ACCURACY: {
    description: "Minimum acceptable accuracy score (1-10)",
    type: "number",
    default: "7",
    example: "NEUROLINK_AUTO_EVAL_MIN_SCORE_ACCURACY=8",
    range: [1, 10],
  },

  NEUROLINK_AUTO_EVAL_MIN_SCORE_COMPLETENESS: {
    description: "Minimum acceptable completeness score (1-10)",
    type: "number",
    default: "6",
    example: "NEUROLINK_AUTO_EVAL_MIN_SCORE_COMPLETENESS=7",
    range: [1, 10],
  },

  NEUROLINK_AUTO_EVAL_MIN_SCORE_OVERALL: {
    description: "Minimum acceptable overall score (1-10)",
    type: "number",
    default: "7",
    example: "NEUROLINK_AUTO_EVAL_MIN_SCORE_OVERALL=8",
    range: [1, 10],
  },

  // Performance Optimization
  NEUROLINK_AUTO_EVAL_CACHE_ENABLED: {
    description: "Enable caching of evaluation results",
    type: "boolean",
    default: "true",
    example: "NEUROLINK_AUTO_EVAL_CACHE_ENABLED=true",
  },

  NEUROLINK_AUTO_EVAL_CACHE_TTL: {
    description: "Cache time-to-live in milliseconds",
    type: "number",
    default: "3600000",
    example: "NEUROLINK_AUTO_EVAL_CACHE_TTL=7200000",
    range: [60000, 86400000],
  },

  NEUROLINK_AUTO_EVAL_CACHE_MAX_SIZE: {
    description: "Maximum number of cached evaluations",
    type: "number",
    default: "1000",
    example: "NEUROLINK_AUTO_EVAL_CACHE_MAX_SIZE=500",
    range: [10, 10000],
  },

  NEUROLINK_AUTO_EVAL_BATCH_SIZE: {
    description: "Batch size for parallel evaluations",
    type: "number",
    default: "5",
    example: "NEUROLINK_AUTO_EVAL_BATCH_SIZE=10",
    range: [1, 100],
  },

  NEUROLINK_AUTO_EVAL_PARALLEL_LIMIT: {
    description: "Maximum parallel evaluation requests",
    type: "number",
    default: "3",
    example: "NEUROLINK_AUTO_EVAL_PARALLEL_LIMIT=5",
    range: [1, 10],
  },
};

/**
 * Generate example .env file content
 */
export function generateExampleEnvFile(): string {
  const lines: string[] = [
    "# Auto-Evaluation Configuration",
    "# Copy these to your .env file and adjust as needed",
    "",
  ];

  Object.entries(AUTO_EVALUATION_ENV_VARS).forEach(([_key, config]) => {
    lines.push(`# ${config.description}`);
    if (config.options) {
      lines.push(`# Options: ${config.options.join(", ")}`);
    }
    if (config.range) {
      lines.push(`# Range: ${config.range[0]}-${config.range[1]}`);
    }
    lines.push(`# Default: ${config.default}`);
    lines.push(`${config.example}`);
    lines.push("");
  });

  return lines.join("\n");
}

/**
 * Validate environment variables
 */
export function validateAutoEvaluationEnv(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  Object.entries(AUTO_EVALUATION_ENV_VARS).forEach(([key, config]) => {
    const value = process.env[key];
    if (value === undefined) {
      return;
    }

    switch (config.type) {
      case "boolean":
        if (value !== "true" && value !== "false") {
          errors.push(`${key} must be 'true' or 'false'`);
        }
        break;

      case "number": {
        const num = parseFloat(value);
        if (isNaN(num)) {
          errors.push(`${key} must be a valid number`);
        } else if (config.range) {
          if (num < config.range[0] || num > config.range[1]) {
            errors.push(
              `${key} must be between ${config.range[0]} and ${config.range[1]}`,
            );
          }
        }
        break;
      }

      case "string":
        if (config.options && !config.options.includes(value)) {
          errors.push(`${key} must be one of: ${config.options.join(", ")}`);
        }
        break;
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
