/**
 * Token Count Cache Manager
 *
 * Provides 5-minute TTL caching for token count results to minimize API calls
 * and improve performance for repeated queries.
 */

import type {
  TokenCountResult,
  TokenCountCacheEntry,
} from "../../../types/conversation.js";

/**
 * Cache configuration
 */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * In-memory cache store
 */
const cache = new Map<string, TokenCountCacheEntry>();

/**
 * Cache statistics
 */
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Generate a cache key from input parameters
 */
export function generateCacheKey(
  provider: string,
  model: string,
  messagesHash: string,
): string {
  return `${provider}:${model}:${messagesHash}`;
}

/**
 * Get a cached token count result
 * @returns Cached result if valid, undefined otherwise
 */
export function getCachedResult(key: string): TokenCountResult | undefined {
  const entry = cache.get(key);

  if (!entry) {
    cacheMisses++;
    return undefined;
  }

  // Check if entry has expired
  const now = Date.now();
  const age = now - entry.timestamp;

  if (age > CACHE_TTL_MS) {
    // Entry expired, remove it
    cache.delete(key);
    cacheMisses++;
    return undefined;
  }

  cacheHits++;

  // Return result with cached flag set to true
  return {
    ...entry.result,
    cached: true,
  };
}

/**
 * Store a token count result in cache
 */
export function setCachedResult(key: string, result: TokenCountResult): void {
  const entry: TokenCountCacheEntry = {
    result: {
      ...result,
      cached: false, // Original result wasn't cached
    },
    timestamp: Date.now(),
    key,
  };

  cache.set(key, entry);
}

/**
 * Clear expired cache entries
 */
export function cleanExpiredEntries(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];

  for (const [key, entry] of cache.entries()) {
    const age = now - entry.timestamp;
    if (age > CACHE_TTL_MS) {
      expiredKeys.push(key);
    }
  }

  for (const key of expiredKeys) {
    cache.delete(key);
  }
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  cache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
} {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? cacheHits / total : 0;

  return {
    size: cache.size,
    hits: cacheHits,
    misses: cacheMisses,
    hitRate,
  };
}

// Clean expired entries every minute
// Note: In production, consider providing a cleanup/shutdown function
// to clear this interval and prevent memory leaks in long-running applications
let cleanupInterval: ReturnType<typeof setInterval> | undefined;

if (typeof setInterval !== "undefined") {
  cleanupInterval = setInterval(cleanExpiredEntries, 60 * 1000);
}

/**
 * Stop automatic cache cleanup (for graceful shutdown)
 */
export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = undefined;
  }
}
