import type { InfraRetryOptions } from "../../types/index.js";

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: InfraRetryOptions,
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs = 30000, shouldRetry } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (shouldRetry && !shouldRetry(lastError)) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
