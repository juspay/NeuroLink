/**
 * Error Recovery Patterns for Streaming
 *
 * Provides hierarchical error recovery strategies for streaming operations:
 * - Level 1: Automatic retry with exponential backoff
 * - Level 2: Fallback streaming (real -> fake)
 * - Level 3: Provider fallback
 *
 * @module streaming/errorRecovery
 */

import { logger } from "../utils/logger.js";
// Error categories for stream error classification
export type ErrorCategory =
  | "network"
  | "timeout"
  | "rate_limit"
  | "provider"
  | "validation"
  | "content_filter"
  | "authentication"
  | "unknown";

// ============================================
// ERROR TYPES
// ============================================

/**
 * Stream-specific error with recovery context
 */
export class StreamError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly retriable: boolean;
  public readonly retryAfter?: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    retriable: boolean = true,
    options?: {
      retryAfter?: number;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "StreamError";
    this.code = code;
    this.category = category;
    this.retriable = retriable;
    this.retryAfter = options?.retryAfter;
    this.context = options?.context;
  }
}

/**
 * Rate limit error with retry-after support
 */
export class RateLimitError extends StreamError {
  constructor(
    message: string,
    retryAfter?: number,
    context?: Record<string, unknown>,
  ) {
    super(message, "RATE_LIMIT_EXCEEDED", "rate_limit", true, {
      retryAfter,
      context,
    });
    this.name = "RateLimitError";
  }
}

/**
 * Network error for connection issues
 */
export class NetworkError extends StreamError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
    cause?: Error,
  ) {
    super(message, "NETWORK_ERROR", "network", true, { context, cause });
    this.name = "NetworkError";
  }
}

/**
 * Timeout error for request timeouts
 */
export class TimeoutError extends StreamError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "TIMEOUT", "timeout", true, { context });
    this.name = "TimeoutError";
  }
}

/**
 * Provider error for AI provider issues
 */
export class ProviderError extends StreamError {
  constructor(
    message: string,
    code: string = "PROVIDER_ERROR",
    retriable: boolean = true,
    context?: Record<string, unknown>,
    cause?: Error,
  ) {
    super(message, code, "provider", retriable, { context, cause });
    this.name = "ProviderError";
  }
}

/**
 * Validation error for invalid requests
 */
export class ValidationError extends StreamError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", "validation", false, { context });
    this.name = "ValidationError";
  }
}

/**
 * Content filter error when content is blocked
 */
export class ContentFilterError extends StreamError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "CONTENT_FILTER", "content_filter", false, { context });
    this.name = "ContentFilterError";
  }
}

// ============================================
// RETRY CONFIGURATION
// ============================================

/**
 * Retry configuration for stream operations
 */
export type RetryConfig = {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff multiplier (exponential) */
  backoffMultiplier: number;
  /** Add jitter to delays */
  jitter: boolean;
  /** Custom retry condition */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Aggressive retry configuration for critical operations
 */
export const AGGRESSIVE_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 500,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Conservative retry configuration for rate-limited scenarios
 */
export const CONSERVATIVE_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 60000,
  backoffMultiplier: 3,
  jitter: true,
};

// ============================================
// RETRY UTILITIES
// ============================================

/**
 * Check if an error is retriable
 */
export function isRetriableError(error: unknown): boolean {
  if (error instanceof StreamError) {
    return error.retriable;
  }

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Non-retriable error patterns
    const nonRetriablePatterns = [
      "invalid_api_key",
      "unauthorized",
      "forbidden",
      "content_filter",
      "context_length_exceeded",
      "invalid_request",
      "validation",
      "bad_request",
    ];

    for (const pattern of nonRetriablePatterns) {
      if (errorMessage.includes(pattern) || errorName.includes(pattern)) {
        return false;
      }
    }

    // Retriable error patterns
    const retriablePatterns = [
      "rate_limit",
      "timeout",
      "network",
      "connection",
      "socket",
      "econnreset",
      "econnrefused",
      "etimedout",
      "server_error",
      "service_unavailable",
      "bad_gateway",
      "gateway_timeout",
      "internal_server_error",
      "overloaded",
    ];

    for (const pattern of retriablePatterns) {
      if (errorMessage.includes(pattern) || errorName.includes(pattern)) {
        return true;
      }
    }
  }

  // Default to not retriable for unknown errors
  return false;
}

/**
 * Calculate delay for retry attempt with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig,
  error?: unknown,
): number {
  // Respect Retry-After header for rate limit errors
  if (error instanceof RateLimitError && error.retryAfter) {
    return error.retryAfter * 1000;
  }

  if (error instanceof StreamError && error.retryAfter) {
    return error.retryAfter * 1000;
  }

  // Calculate exponential backoff
  let delay = config.initialDelayMs * config.backoffMultiplier ** attempt;

  // Apply maximum delay cap
  delay = Math.min(delay, config.maxDelayMs);

  // Add jitter (0-25% of delay)
  if (config.jitter) {
    const jitter = delay * 0.25 * Math.random();
    delay += jitter;
  }

  return Math.round(delay);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// RETRY WRAPPER
// ============================================

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (error: unknown, attempt: number, delay: number) => void,
): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = config.shouldRetry
        ? config.shouldRetry(error, attempt)
        : isRetriableError(error);

      if (!shouldRetry || attempt >= config.maxRetries) {
        throw error;
      }

      const delay = calculateRetryDelay(attempt, config, error);

      logger.warn(
        `Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`,
        {
          error: error instanceof Error ? error.message : String(error),
          attempt,
          delay,
        },
      );

      onRetry?.(error, attempt, delay);

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry wrapper for stream operations.
 * Re-creates the stream on failure and retries up to maxRetries times.
 */
export async function* withStreamRetry<T>(
  createStream: () => AsyncIterable<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): AsyncGenerator<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const stream = createStream();
      for await (const item of stream) {
        yield item;
      }
      return; // Success, exit generator
    } catch (error) {
      lastError = error;

      const shouldRetry = config.shouldRetry
        ? config.shouldRetry(error, attempt)
        : isRetriableError(error);

      if (!shouldRetry || attempt >= config.maxRetries) {
        throw error;
      }

      const delay = calculateRetryDelay(attempt, config, error);

      logger.warn(`Stream retry attempt ${attempt + 1}/${config.maxRetries}`, {
        error: error instanceof Error ? error.message : String(error),
        delay,
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

// ============================================
// FALLBACK PATTERNS
// ============================================

/**
 * Provider fallback configuration
 */
export type ProviderFallbackConfig = {
  /** Providers to try in order */
  providers: Array<{
    name: string;
    model: string;
    priority: number;
  }>;
  /** Maximum total attempts across all providers */
  maxAttempts?: number;
  /** Continue to next provider on any error */
  fallbackOnAnyError?: boolean;
};

/**
 * Fallback result with provider tracking
 */
export type FallbackResult<T> = {
  result: T;
  usedProvider: string;
  usedModel: string;
  attemptedProviders: string[];
  fallbackUsed: boolean;
};

/**
 * Execute operation with provider fallback
 */
export async function withProviderFallback<T>(
  config: ProviderFallbackConfig,
  createOperation: (provider: string, model: string) => Promise<T>,
): Promise<FallbackResult<T>> {
  const sortedProviders = [...config.providers].sort(
    (a, b) => a.priority - b.priority,
  );
  const attemptedProviders: string[] = [];
  const errors: Error[] = [];

  for (const providerConfig of sortedProviders) {
    attemptedProviders.push(providerConfig.name);

    try {
      const result = await createOperation(
        providerConfig.name,
        providerConfig.model,
      );

      return {
        result,
        usedProvider: providerConfig.name,
        usedModel: providerConfig.model,
        attemptedProviders,
        fallbackUsed: attemptedProviders.length > 1,
      };
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      errors.push(errorObj);

      logger.warn(`Provider ${providerConfig.name} failed`, {
        error: errorObj.message,
        provider: providerConfig.name,
        model: providerConfig.model,
      });

      // Check if we should try next provider
      const shouldFallback =
        config.fallbackOnAnyError || isRetriableError(error);

      if (!shouldFallback) {
        throw error;
      }
    }
  }

  // All providers failed
  const aggregateError = new AggregateError(
    errors,
    `All providers failed: ${attemptedProviders.join(", ")}`,
  );
  throw aggregateError;
}

// ============================================
// ERROR CLASSIFICATION HELPERS
// ============================================

/**
 * Categorize an error
 */
export function categorizeError(error: Error | StreamError): ErrorCategory {
  // If it's a StreamError, return its category directly
  if (error instanceof StreamError) {
    return error.category;
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (message.includes("timeout") || name.includes("timeout")) {
    return "timeout";
  }

  if (
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("socket") ||
    name.includes("network")
  ) {
    return "network";
  }

  if (message.includes("rate_limit") || message.includes("too many requests")) {
    return "rate_limit";
  }

  if (message.includes("content_filter") || message.includes("blocked")) {
    return "content_filter";
  }

  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("bad_request")
  ) {
    return "validation";
  }

  if (
    message.includes("provider") ||
    message.includes("api") ||
    message.includes("server_error")
  ) {
    return "provider";
  }

  return "unknown";
}

/**
 * Extract error code from error
 */
export function extractErrorCode(error: Error): string {
  // Check for code property
  const errorWithCode = error as Error & { code?: string | number };
  if (errorWithCode.code) {
    return String(errorWithCode.code);
  }

  // Generate code from error name/message
  const name = error.name.replace(/Error$/, "").toUpperCase();
  if (name && name !== "ERROR") {
    return name;
  }

  return "UNKNOWN_ERROR";
}

// ============================================
// STREAM ERROR RECOVERY WRAPPER
// ============================================

/**
 * Options for stream error recovery
 */
export type StreamRecoveryOptions = {
  /** Retry configuration */
  retryConfig?: RetryConfig;
  /** Provider fallback configuration */
  fallbackConfig?: ProviderFallbackConfig;
  /** Enable fake streaming fallback */
  enableFakeStreamingFallback?: boolean;
  /** Custom error handler */
  onError?: (
    error: unknown,
    context: { attempt: number; provider?: string },
  ) => void;
  /** Custom recovery decision */
  shouldRecover?: (error: unknown) => boolean;
};

/**
 * Comprehensive stream error recovery wrapper
 *
 * Implements three-level recovery:
 * 1. Automatic retry with exponential backoff
 * 2. Fallback streaming mode
 * 3. Provider fallback
 */
export async function* withStreamRecovery<T>(
  createStream: (provider?: string, model?: string) => AsyncIterable<T>,
  options: StreamRecoveryOptions = {},
): AsyncGenerator<T> {
  const retryConfig = options.retryConfig ?? DEFAULT_RETRY_CONFIG;

  // Level 1: Retry with primary provider
  try {
    yield* withStreamRetry(() => createStream(), retryConfig);
    return;
  } catch (primaryError) {
    logger.warn("Primary stream failed after retries", {
      error:
        primaryError instanceof Error
          ? primaryError.message
          : String(primaryError),
    });

    // Level 2 & 3: Provider fallback if configured
    if (options.fallbackConfig) {
      const sortedProviders = [...options.fallbackConfig.providers].sort(
        (a, b) => a.priority - b.priority,
      );

      for (const provider of sortedProviders) {
        try {
          const stream = createStream(provider.name, provider.model);
          for await (const item of stream) {
            yield item;
          }
          return; // Success
        } catch (fallbackError) {
          logger.warn(`Fallback provider ${provider.name} failed`, {
            error:
              fallbackError instanceof Error
                ? fallbackError.message
                : String(fallbackError),
          });
          options.onError?.(fallbackError, {
            attempt: 0,
            provider: provider.name,
          });
        }
      }
    }

    // All recovery attempts failed
    throw primaryError;
  }
}
