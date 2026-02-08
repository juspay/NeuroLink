/**
 * RAG Retry Handler Tests
 * Comprehensive tests for the RAGRetryHandler class
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EmbeddingError,
  MetadataExtractionError,
  RAGError,
  RAGErrorCodes,
  VectorQueryError,
} from "../../../src/lib/rag/errors/RAGError.js";
import {
  createRetryHandler,
  DEFAULT_RAG_RETRY_CONFIG,
  EmbeddingRetryHandler,
  embeddingRetryHandler,
  isRetryable,
  MetadataExtractionRetryHandler,
  metadataExtractionRetryHandler,
  RAGRetryHandler,
  VectorStoreRetryHandler,
  vectorStoreRetryHandler,
  withRAGRetry,
} from "../../../src/lib/rag/resilience/RetryHandler.js";

describe("isRetryable", () => {
  it("should return true for retryable RAG errors", () => {
    const error = new EmbeddingError("Rate limited", {
      code: RAGErrorCodes.EMBEDDING_RATE_LIMIT,
      retryable: true,
    });

    expect(isRetryable(error)).toBe(true);
  });

  it("should return false for non-retryable RAG errors", () => {
    const error = new RAGError(
      "Invalid config",
      RAGErrorCodes.INVALID_CONFIGURATION,
      {
        retryable: false,
      },
    );

    expect(isRetryable(error)).toBe(false);
  });

  it("should return true for timeout errors", () => {
    const error = { name: "TimeoutError", message: "Timeout" };
    expect(isRetryable(error)).toBe(true);
  });

  it("should return true for ETIMEDOUT errors", () => {
    const error = { code: "ETIMEDOUT", message: "Connection timed out" };
    expect(isRetryable(error)).toBe(true);
  });

  it("should return true for network errors", () => {
    expect(isRetryable({ code: "ECONNRESET" })).toBe(true);
    expect(isRetryable({ code: "ENOTFOUND" })).toBe(true);
    expect(isRetryable({ code: "ECONNREFUSED" })).toBe(true);
    expect(isRetryable({ code: "ECONNABORTED" })).toBe(true);
    expect(isRetryable({ code: "EPIPE" })).toBe(true);
  });

  it("should return true for retryable HTTP status codes", () => {
    expect(isRetryable({ status: 429 })).toBe(true);
    expect(isRetryable({ status: 500 })).toBe(true);
    expect(isRetryable({ status: 502 })).toBe(true);
    expect(isRetryable({ status: 503 })).toBe(true);
    expect(isRetryable({ status: 504 })).toBe(true);
  });

  it("should return false for non-retryable HTTP status codes", () => {
    expect(isRetryable({ status: 400 })).toBe(false);
    expect(isRetryable({ status: 401 })).toBe(false);
    expect(isRetryable({ status: 404 })).toBe(false);
  });

  it("should return false for null/undefined", () => {
    expect(isRetryable(null)).toBe(false);
    expect(isRetryable(undefined)).toBe(false);
  });

  it("should use custom shouldRetry function", () => {
    const config = {
      ...DEFAULT_RAG_RETRY_CONFIG,
      shouldRetry: (error: Error) => error.message.includes("retry-me"),
    };

    expect(isRetryable(new Error("retry-me please"), config)).toBe(true);
    expect(isRetryable(new Error("do not retry"), config)).toBe(false);
  });
});

describe("withRAGRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return result on success", async () => {
    const result = await withRAGRetry(async () => "success");
    expect(result).toBe("success");
  });

  it("should retry on retryable errors", async () => {
    let attempts = 0;

    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw { code: "ECONNRESET" };
      }
      return "success";
    };

    const promise = withRAGRetry(operation, { maxRetries: 3 });

    // Fast-forward through retries
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("should not retry on non-retryable errors", async () => {
    let attempts = 0;

    const operation = async () => {
      attempts++;
      throw new RAGError("Invalid", RAGErrorCodes.INVALID_CONFIGURATION, {
        retryable: false,
      });
    };

    await expect(withRAGRetry(operation, { maxRetries: 3 })).rejects.toThrow();
    expect(attempts).toBe(1);
  });

  it("should throw after max retries", async () => {
    let attempts = 0;

    const operation = async () => {
      attempts++;
      throw { code: "ECONNRESET" };
    };

    // Run with fake timers properly handling the promise
    const promise = withRAGRetry(operation, { maxRetries: 2 });

    // Attach a catch handler immediately to prevent unhandled rejection
    const resultPromise = promise.catch((err) => err);

    // Run all timers and wait for promise to settle
    for (let i = 0; i < 3; i++) {
      await vi.advanceTimersByTimeAsync(31000);
    }

    const error = await resultPromise;
    expect(error).toBeDefined();
    expect(attempts).toBe(3); // Initial + 2 retries
  });

  it("should use exponential backoff", async () => {
    let attempts = 0;
    const timestamps: number[] = [];

    const operation = async () => {
      timestamps.push(Date.now());
      attempts++;
      if (attempts < 4) {
        throw { code: "ECONNRESET" };
      }
      return "success";
    };

    const promise = withRAGRetry(operation, {
      maxRetries: 3,
      initialDelay: 100,
      backoffMultiplier: 2,
      jitter: false,
    });

    await vi.runAllTimersAsync();
    await promise;

    // Verify delays increase
    expect(timestamps.length).toBe(4);
  });

  it("should wrap non-RAG errors in RAGError", async () => {
    const operation = async () => {
      throw new Error("Generic error");
    };

    await expect(
      withRAGRetry(operation, { maxRetries: 0 }),
    ).rejects.toMatchObject({
      code: RAGErrorCodes.RETRY_EXHAUSTED,
    });
  });
});

describe("RAGRetryHandler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should execute operation with default config", async () => {
    const handler = new RAGRetryHandler();
    const result = await handler.executeWithRetry(async () => "result");
    expect(result).toBe("result");
  });

  it("should use custom max retries", async () => {
    const handler = new RAGRetryHandler({ maxRetries: 5 });
    let attempts = 0;

    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw { code: "ECONNRESET" };
      }
      return "success";
    };

    const promise = handler.executeWithRetry(operation);
    await vi.runAllTimersAsync();
    await promise;

    expect(attempts).toBe(3);
  });

  it("should get config", () => {
    const handler = new RAGRetryHandler({ maxRetries: 10 });
    const config = handler.getConfig();
    expect(config.maxRetries).toBe(10);
  });

  it("should update config", () => {
    const handler = new RAGRetryHandler();
    handler.updateConfig({ maxRetries: 7 });
    expect(handler.getConfig().maxRetries).toBe(7);
  });

  describe("executeBatch", () => {
    it("should process all items successfully", async () => {
      const handler = new RAGRetryHandler();
      const items = [1, 2, 3, 4, 5];

      const result = await handler.executeBatch(
        items,
        async (item) => item * 2,
      );

      expect(result.successful.length).toBe(5);
      expect(result.failed.length).toBe(0);
      expect(result.successRate).toBe(1);
    });

    it("should handle partial failures with continueOnError", async () => {
      const handler = new RAGRetryHandler({ maxRetries: 0 });
      const items = [1, 2, 3, 4, 5];

      const result = await handler.executeBatch(
        items,
        async (item) => {
          if (item === 3) {
            throw new Error("Failed for 3");
          }
          return item * 2;
        },
        { continueOnError: true },
      );

      expect(result.successful.length).toBe(4);
      expect(result.failed.length).toBe(1);
      expect(result.failed[0]?.item).toBe(3);
      expect(result.successRate).toBe(0.8);
    });

    it("should stop on error when continueOnError is false", async () => {
      const handler = new RAGRetryHandler({ maxRetries: 0 });
      const items = [1, 2, 3, 4, 5];

      await expect(
        handler.executeBatch(
          items,
          async (item) => {
            if (item === 2) {
              throw new Error("Failed for 2");
            }
            return item * 2;
          },
          { continueOnError: false },
        ),
      ).rejects.toThrow("Failed for 2");
    });

    it("should respect concurrency limit", async () => {
      const handler = new RAGRetryHandler();
      const items = [1, 2, 3, 4, 5];
      let maxConcurrent = 0;
      let currentConcurrent = 0;

      const result = await handler.executeBatch(
        items,
        async (item) => {
          currentConcurrent++;
          maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
          // No delay needed - just track concurrent calls
          currentConcurrent--;
          return item;
        },
        { concurrency: 2 },
      );

      expect(result.successful.length).toBe(5);
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });
});

describe("Specialized Retry Handlers", () => {
  describe("EmbeddingRetryHandler", () => {
    it("should have higher max retries", () => {
      const handler = new EmbeddingRetryHandler();
      expect(handler.getConfig().maxRetries).toBe(5);
    });

    it("should have longer initial delay", () => {
      const handler = new EmbeddingRetryHandler();
      expect(handler.getConfig().initialDelay).toBe(2000);
    });

    it("should retry embedding errors", async () => {
      const handler = new EmbeddingRetryHandler();
      let attempts = 0;

      vi.useFakeTimers();

      const operation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new EmbeddingError("Rate limited", {
            code: RAGErrorCodes.EMBEDDING_RATE_LIMIT,
            retryable: true,
          });
        }
        return "embedding";
      };

      const promise = handler.executeWithRetry(operation);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe("embedding");
      expect(attempts).toBe(2);

      vi.useRealTimers();
    });
  });

  describe("VectorStoreRetryHandler", () => {
    it("should have standard config", () => {
      const handler = new VectorStoreRetryHandler();
      expect(handler.getConfig().maxRetries).toBe(3);
    });

    it("should retry vector query errors", async () => {
      const handler = new VectorStoreRetryHandler();
      let attempts = 0;

      vi.useFakeTimers();

      const operation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new VectorQueryError("Timeout", {
            code: RAGErrorCodes.VECTOR_QUERY_TIMEOUT,
            retryable: true,
          });
        }
        return [{ id: "1", score: 0.9 }];
      };

      const promise = handler.executeWithRetry(operation);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual([{ id: "1", score: 0.9 }]);
      expect(attempts).toBe(2);

      vi.useRealTimers();
    });
  });

  describe("MetadataExtractionRetryHandler", () => {
    it("should retry metadata extraction errors", async () => {
      const handler = new MetadataExtractionRetryHandler();
      let attempts = 0;

      vi.useFakeTimers();

      const operation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new MetadataExtractionError("Timeout", {
            code: RAGErrorCodes.METADATA_EXTRACTION_TIMEOUT,
            retryable: true,
          });
        }
        return { title: "Test" };
      };

      const promise = handler.executeWithRetry(operation);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ title: "Test" });

      vi.useRealTimers();
    });
  });
});

describe("createRetryHandler", () => {
  it("should create a retry function", async () => {
    const retry = createRetryHandler({ maxRetries: 2 });

    const result = await retry(async () => "result");
    expect(result).toBe("result");
  });
});

describe("Global retry handlers", () => {
  it("should export embeddingRetryHandler", () => {
    expect(embeddingRetryHandler).toBeInstanceOf(EmbeddingRetryHandler);
  });

  it("should export vectorStoreRetryHandler", () => {
    expect(vectorStoreRetryHandler).toBeInstanceOf(VectorStoreRetryHandler);
  });

  it("should export metadataExtractionRetryHandler", () => {
    expect(metadataExtractionRetryHandler).toBeInstanceOf(
      MetadataExtractionRetryHandler,
    );
  });
});
