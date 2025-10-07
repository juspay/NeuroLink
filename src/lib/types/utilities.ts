/**
 * Utility module types - extracted from utils module files
 */

// Consolidated timeout utils types
export type TimeoutConfig = {
  operation: string;
  timeout?: number | string;
  gracefulShutdown?: boolean;
  retryOnTimeout?: boolean;
  maxRetries?: number;
  abortSignal?: AbortSignal;
};

export type TimeoutResult<T> = {
  success: boolean;
  data?: T;
  error?: Error;
  timedOut: boolean;
  executionTime: number;
  retriesUsed: number;
};

/**
 * Enhanced validation result with format checking
 */
export type APIValidationResult = {
  isValid: boolean;
  apiKey: string;
  formatValid?: boolean;
  errorType?: "missing" | "format" | "config";
  error?: string;
};
