import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  TokenBucketRateLimiter,
  urlDownloadRateLimiter,
  withRateLimit,
} from "../../src/lib/utils/rateLimiter";

describe("TokenBucketRateLimiter", () => {
  let rateLimiter: TokenBucketRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    rateLimiter = new TokenBucketRateLimiter({
      maxTokens: 3,
      refillIntervalMs: 1000,
      tokensPerRefill: 3,
      maxQueueSize: 5,
      queueTimeoutMs: 5000,
    });
  });

  afterEach(() => {
    rateLimiter.stop();
    vi.useRealTimers();
  });

  describe("constructor and initial state", () => {
    it("should initialize with max tokens", () => {
      const stats = rateLimiter.getStats();
      expect(stats.availableTokens).toBe(3);
      expect(stats.queueLength).toBe(0);
      expect(stats.maxTokens).toBe(3);
      expect(stats.maxQueueSize).toBe(5);
    });

    it("should use default config when not provided", () => {
      const defaultLimiter = new TokenBucketRateLimiter();
      const stats = defaultLimiter.getStats();
      expect(stats.maxTokens).toBe(10);
      expect(stats.maxQueueSize).toBe(100);
      defaultLimiter.stop();
    });
  });

  describe("acquire", () => {
    it("should consume token when available", async () => {
      await rateLimiter.acquire();
      const stats = rateLimiter.getStats();
      expect(stats.availableTokens).toBe(2);
    });

    it("should consume all tokens when called multiple times", async () => {
      await rateLimiter.acquire();
      await rateLimiter.acquire();
      await rateLimiter.acquire();
      const stats = rateLimiter.getStats();
      expect(stats.availableTokens).toBe(0);
    });

    it("should queue request when no tokens available", async () => {
      // Consume all tokens
      await rateLimiter.acquire();
      await rateLimiter.acquire();
      await rateLimiter.acquire();

      // Start a request that should be queued
      const queuedPromise = rateLimiter.acquire();

      // Check that request is queued
      const stats = rateLimiter.getStats();
      expect(stats.availableTokens).toBe(0);
      expect(stats.queueLength).toBe(1);

      // Advance time to trigger token refill
      vi.advanceTimersByTime(1000);

      // Wait for the queued request to resolve
      await queuedPromise;

      // Queue should be empty now
      const afterStats = rateLimiter.getStats();
      expect(afterStats.queueLength).toBe(0);
    });

    it("should reject when queue is full", async () => {
      // Consume all tokens
      await rateLimiter.acquire();
      await rateLimiter.acquire();
      await rateLimiter.acquire();

      // Fill the queue (maxQueueSize = 5)
      const queuedPromises: Promise<void>[] = [];
      for (let i = 0; i < 5; i++) {
        queuedPromises.push(rateLimiter.acquire());
      }

      // The 6th request should be rejected
      await expect(rateLimiter.acquire()).rejects.toThrow(
        "Rate limiter queue full",
      );

      // Cleanup: advance time to resolve queued promises
      vi.advanceTimersByTime(2000);
      await Promise.all(queuedPromises);
    });
  });

  describe("token refill", () => {
    it("should refill tokens after interval", async () => {
      // Consume all tokens
      await rateLimiter.acquire();
      await rateLimiter.acquire();
      await rateLimiter.acquire();

      expect(rateLimiter.getStats().availableTokens).toBe(0);

      // Advance time by refill interval
      vi.advanceTimersByTime(1000);

      // Now acquire should work without queueing
      await rateLimiter.acquire();

      // Should still have tokens left after refill
      expect(rateLimiter.getStats().availableTokens).toBe(2);
    });

    it("should not exceed max tokens on refill", async () => {
      // Advance time without consuming tokens
      vi.advanceTimersByTime(5000);

      // Force a refill by acquiring a token
      await rateLimiter.acquire();

      // Should still be at max - 1
      expect(rateLimiter.getStats().availableTokens).toBe(2);
    });
  });

  describe("queue timeout", () => {
    it("should reject queued requests after timeout", async () => {
      // Create a limiter with a shorter timeout than refill interval
      const shortTimeoutLimiter = new TokenBucketRateLimiter({
        maxTokens: 1,
        refillIntervalMs: 10000, // 10 seconds
        tokensPerRefill: 1,
        maxQueueSize: 5,
        queueTimeoutMs: 2000, // 2 seconds
      });

      // Consume the only token
      await shortTimeoutLimiter.acquire();

      // Queue a request
      const queuedPromise = shortTimeoutLimiter.acquire();

      // Advance time past the queue timeout
      // We need to advance in smaller increments to trigger the interval
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(1000);
        await Promise.resolve(); // Allow microtasks to process
      }

      // The queued request should be rejected
      await expect(queuedPromise).rejects.toThrow("Rate limiter queue timeout");

      shortTimeoutLimiter.stop();
    });
  });

  describe("reset", () => {
    it("should reset tokens to max", async () => {
      await rateLimiter.acquire();
      await rateLimiter.acquire();

      rateLimiter.reset();

      const stats = rateLimiter.getStats();
      expect(stats.availableTokens).toBe(3);
      expect(stats.queueLength).toBe(0);
    });

    it("should reject queued requests on reset", async () => {
      // Consume all tokens
      await rateLimiter.acquire();
      await rateLimiter.acquire();
      await rateLimiter.acquire();

      // Queue a request
      const queuedPromise = rateLimiter.acquire();

      // Reset - should reject the queued request
      rateLimiter.reset();

      await expect(queuedPromise).rejects.toThrow("Rate limiter reset");
    });
  });

  describe("stop", () => {
    it("should stop the refill timer and reset", async () => {
      await rateLimiter.acquire();

      rateLimiter.stop();

      const stats = rateLimiter.getStats();
      expect(stats.availableTokens).toBe(3);
      expect(stats.queueLength).toBe(0);
    });
  });
});

describe("urlDownloadRateLimiter", () => {
  it("should be a global instance with default config", () => {
    const stats = urlDownloadRateLimiter.getStats();
    expect(stats.maxTokens).toBe(10);
    expect(stats.maxQueueSize).toBe(100);
  });
});

describe("withRateLimit", () => {
  let rateLimiter: TokenBucketRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    rateLimiter = new TokenBucketRateLimiter({
      maxTokens: 2,
      refillIntervalMs: 1000,
      tokensPerRefill: 2,
      maxQueueSize: 5,
      queueTimeoutMs: 5000,
    });
  });

  afterEach(() => {
    rateLimiter.stop();
    vi.useRealTimers();
  });

  it("should wrap a function with rate limiting", async () => {
    const mockFn = vi.fn().mockResolvedValue("result");
    const rateLimitedFn = withRateLimit(mockFn, rateLimiter);

    const result = await rateLimitedFn("arg1", "arg2");

    expect(result).toBe("result");
    expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
    expect(rateLimiter.getStats().availableTokens).toBe(1);
  });

  it("should rate limit wrapped function", async () => {
    const mockFn = vi.fn().mockResolvedValue("result");
    const rateLimitedFn = withRateLimit(mockFn, rateLimiter);

    // Call twice, consuming all tokens
    await rateLimitedFn();
    await rateLimitedFn();

    // Third call should be queued
    const queuedPromise = rateLimitedFn();

    expect(rateLimiter.getStats().queueLength).toBe(1);

    // Advance time to allow token refill
    vi.advanceTimersByTime(1000);

    await queuedPromise;

    expect(mockFn).toHaveBeenCalledTimes(3);
  });
});
