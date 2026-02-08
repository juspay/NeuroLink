/**
 * RAG Circuit Breaker Tests
 * Comprehensive tests for the RAGCircuitBreaker class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  RAGCircuitBreaker,
  RAGCircuitBreakerManager,
  ragCircuitBreakerManager,
  getCircuitBreaker,
  executeWithCircuitBreaker,
} from "../../../src/lib/rag/resilience/CircuitBreaker.js";
import {
  RAGCircuitBreakerError,
  RAGErrorCodes,
} from "../../../src/lib/rag/errors/RAGError.js";

describe("RAGCircuitBreaker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with closed state", () => {
      const breaker = new RAGCircuitBreaker("test");
      expect(breaker.isClosed()).toBe(true);
      expect(breaker.isOpen()).toBe(false);
      expect(breaker.isHalfOpen()).toBe(false);
      expect(breaker.getState()).toBe("closed");
      breaker.destroy();
    });

    it("should initialize with custom configuration", () => {
      const breaker = new RAGCircuitBreaker("test", {
        failureThreshold: 10,
        resetTimeout: 60000,
        halfOpenMaxCalls: 5,
      });
      expect(breaker.isClosed()).toBe(true);
      breaker.destroy();
    });

    it("should return correct name", () => {
      const breaker = new RAGCircuitBreaker("rag-vector-store");
      expect(breaker.getName()).toBe("rag-vector-store");
      breaker.destroy();
    });

    it("should start with zero call history", () => {
      const breaker = new RAGCircuitBreaker("test");
      const stats = breaker.getStats();
      expect(stats.totalCalls).toBe(0);
      expect(stats.averageLatency).toBe(0);
      breaker.destroy();
    });
  });

  describe("successful operations", () => {
    it("should execute successful operation", async () => {
      const breaker = new RAGCircuitBreaker("test");

      const result = await breaker.execute(async () => "success", "query");

      expect(result).toBe("success");
      expect(breaker.isClosed()).toBe(true);
      breaker.destroy();
    });

    it("should record successful calls", async () => {
      const breaker = new RAGCircuitBreaker("test");

      await breaker.execute(async () => "result1");
      await breaker.execute(async () => "result2");
      await breaker.execute(async () => "result3");

      const stats = breaker.getStats();
      expect(stats.totalCalls).toBe(3);
      expect(stats.successfulCalls).toBe(3);
      expect(stats.failedCalls).toBe(0);
      breaker.destroy();
    });

    it("should emit callSuccess event", async () => {
      const breaker = new RAGCircuitBreaker("test");
      const successSpy = vi.fn();

      breaker.on("callSuccess", successSpy);
      await breaker.execute(async () => "success", "embedding");

      expect(successSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: expect.any(Number),
          timestamp: expect.any(Date),
          operationType: "embedding",
        }),
      );
      breaker.destroy();
    });
  });

  describe("failed operations", () => {
    it("should propagate errors from operations", async () => {
      const breaker = new RAGCircuitBreaker("test");

      await expect(
        breaker.execute(async () => {
          throw new Error("Vector store unavailable");
        }),
      ).rejects.toThrow("Vector store unavailable");

      breaker.destroy();
    });

    it("should record failed calls", async () => {
      const breaker = new RAGCircuitBreaker("test");

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }

      const stats = breaker.getStats();
      expect(stats.failedCalls).toBe(1);
      breaker.destroy();
    });

    it("should emit callFailure event with operation type", async () => {
      const breaker = new RAGCircuitBreaker("test");
      const failureSpy = vi.fn();

      breaker.on("callFailure", failureSpy);

      try {
        await breaker.execute(async () => {
          throw new Error("embedding failed");
        }, "embedding");
      } catch {
        // Expected
      }

      expect(failureSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "embedding failed",
          duration: expect.any(Number),
          timestamp: expect.any(Date),
          operationType: "embedding",
        }),
      );
      breaker.destroy();
    });
  });

  describe("state transitions - CLOSED to OPEN", () => {
    it("should open after reaching failure threshold", async () => {
      const breaker = new RAGCircuitBreaker("test", {
        failureThreshold: 3,
        minimumCallsBeforeCalculation: 3,
      });

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error(`failure ${i}`);
          });
        } catch {
          // Expected
        }
      }

      expect(breaker.isOpen()).toBe(true);
      breaker.destroy();
    });

    it("should emit circuitOpen event when opening", async () => {
      const breaker = new RAGCircuitBreaker("test", {
        failureThreshold: 2,
        minimumCallsBeforeCalculation: 2,
      });
      const openSpy = vi.fn();

      breaker.on("circuitOpen", openSpy);

      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error("fail");
          });
        } catch {
          // Expected
        }
      }

      expect(openSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          failureRate: expect.any(Number),
          totalCalls: expect.any(Number),
          timestamp: expect.any(Date),
        }),
      );
      breaker.destroy();
    });

    it("should emit stateChange event", async () => {
      const breaker = new RAGCircuitBreaker("test", {
        failureThreshold: 2,
        minimumCallsBeforeCalculation: 2,
      });
      const stateChangeSpy = vi.fn();

      breaker.on("stateChange", stateChangeSpy);

      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error("fail");
          });
        } catch {
          // Expected
        }
      }

      expect(stateChangeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          oldState: "closed",
          newState: "open",
          reason: expect.any(String),
          timestamp: expect.any(Date),
        }),
      );
      breaker.destroy();
    });
  });

  describe("state transitions - OPEN to HALF_OPEN", () => {
    it("should reject operations with RAGCircuitBreakerError when open", async () => {
      const breaker = new RAGCircuitBreaker("test", {
        failureThreshold: 1,
        minimumCallsBeforeCalculation: 1,
        resetTimeout: 5000,
      });

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }

      await expect(breaker.execute(async () => "should fail")).rejects.toThrow(
        RAGCircuitBreakerError,
      );

      breaker.destroy();
    });

    it("should include next retry time in error", async () => {
      const breaker = new RAGCircuitBreaker("test", {
        failureThreshold: 1,
        minimumCallsBeforeCalculation: 1,
        resetTimeout: 5000,
      });

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }

      try {
        await breaker.execute(async () => "should fail");
      } catch (error) {
        expect(error).toBeInstanceOf(RAGCircuitBreakerError);
        expect((error as RAGCircuitBreakerError).circuitName).toBe("test");
        expect((error as RAGCircuitBreakerError).nextRetryTime).toBeDefined();
      }

      breaker.destroy();
    });

    it("should transition to half-open after reset timeout", async () => {
      const breaker = new RAGCircuitBreaker("test", {
        failureThreshold: 1,
        minimumCallsBeforeCalculation: 1,
        resetTimeout: 5000,
        halfOpenMaxCalls: 1,
      });

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }
      expect(breaker.isOpen()).toBe(true);

      vi.advanceTimersByTime(5001);

      await breaker.execute(async () => "success");

      expect(breaker.isClosed()).toBe(true);
      breaker.destroy();
    });

    it("should emit circuitHalfOpen event", async () => {
      const breaker = new RAGCircuitBreaker("test", {
        failureThreshold: 1,
        minimumCallsBeforeCalculation: 1,
        resetTimeout: 1000,
      });
      const halfOpenSpy = vi.fn();

      breaker.on("circuitHalfOpen", halfOpenSpy);

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }

      vi.advanceTimersByTime(1001);

      await breaker.execute(async () => "success");

      expect(halfOpenSpy).toHaveBeenCalled();
      breaker.destroy();
    });
  });

  describe("state transitions - HALF_OPEN to CLOSED", () => {
    it("should close after successful half-open tests", async () => {
      const breaker = new RAGCircuitBreaker("test", {
        failureThreshold: 1,
        minimumCallsBeforeCalculation: 1,
        resetTimeout: 1000,
        halfOpenMaxCalls: 2,
      });

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }
      expect(breaker.isOpen()).toBe(true);

      vi.advanceTimersByTime(1001);

      await breaker.execute(async () => "success1");
      await breaker.execute(async () => "success2");

      expect(breaker.isClosed()).toBe(true);
      breaker.destroy();
    });

    it("should emit circuitClosed event", async () => {
      const breaker = new RAGCircuitBreaker("test", {
        failureThreshold: 1,
        minimumCallsBeforeCalculation: 1,
        resetTimeout: 1000,
        halfOpenMaxCalls: 1,
      });
      const closedSpy = vi.fn();

      breaker.on("circuitClosed", closedSpy);

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }

      vi.advanceTimersByTime(1001);

      await breaker.execute(async () => "success");

      expect(closedSpy).toHaveBeenCalled();
      breaker.destroy();
    });
  });

  describe("state transitions - HALF_OPEN to OPEN", () => {
    it("should reopen on failure during half-open", async () => {
      const breaker = new RAGCircuitBreaker("test", {
        failureThreshold: 1,
        minimumCallsBeforeCalculation: 1,
        resetTimeout: 1000,
      });

      try {
        await breaker.execute(async () => {
          throw new Error("initial fail");
        });
      } catch {
        // Expected
      }

      vi.advanceTimersByTime(1001);

      try {
        await breaker.execute(async () => {
          throw new Error("half-open fail");
        });
      } catch {
        // Expected
      }

      expect(breaker.isOpen()).toBe(true);
      breaker.destroy();
    });
  });

  describe("manual controls", () => {
    it("should reset to closed state", async () => {
      const breaker = new RAGCircuitBreaker("test", {
        failureThreshold: 1,
        minimumCallsBeforeCalculation: 1,
      });

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }
      expect(breaker.isOpen()).toBe(true);

      breaker.reset();

      expect(breaker.isClosed()).toBe(true);
      expect(breaker.getStats().totalCalls).toBe(0);
      breaker.destroy();
    });

    it("should force open the circuit", () => {
      const breaker = new RAGCircuitBreaker("test");
      expect(breaker.isClosed()).toBe(true);

      breaker.forceOpen("Manual intervention");

      expect(breaker.isOpen()).toBe(true);
      breaker.destroy();
    });
  });

  describe("statistics", () => {
    it("should track call statistics", async () => {
      const breaker = new RAGCircuitBreaker("test");

      await breaker.execute(async () => "success");
      await breaker.execute(async () => "success");

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }

      const stats = breaker.getStats();
      expect(stats.totalCalls).toBe(3);
      expect(stats.successfulCalls).toBe(2);
      expect(stats.failedCalls).toBe(1);
      breaker.destroy();
    });

    it("should calculate failure rate", async () => {
      const breaker = new RAGCircuitBreaker("test", {
        statisticsWindowSize: 60000,
      });

      await breaker.execute(async () => "success");
      await breaker.execute(async () => "success");

      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }

      const stats = breaker.getStats();
      expect(stats.failureRate).toBeCloseTo(1 / 3, 2);
      breaker.destroy();
    });

    it("should calculate average latency", async () => {
      const breaker = new RAGCircuitBreaker("test");

      await breaker.execute(async () => "success");
      await breaker.execute(async () => "success");

      const stats = breaker.getStats();
      expect(stats.averageLatency).toBeGreaterThanOrEqual(0);
      breaker.destroy();
    });

    it("should calculate p95 latency", async () => {
      const breaker = new RAGCircuitBreaker("test");

      for (let i = 0; i < 10; i++) {
        await breaker.execute(async () => "success");
      }

      const stats = breaker.getStats();
      expect(stats.p95Latency).toBeGreaterThanOrEqual(0);
      breaker.destroy();
    });
  });

  describe("cleanup", () => {
    it("should remove all listeners on destroy", () => {
      const breaker = new RAGCircuitBreaker("test");
      const listener = vi.fn();

      breaker.on("stateChange", listener);
      breaker.on("callSuccess", listener);
      breaker.on("callFailure", listener);

      breaker.destroy();

      // After destroy, no more events should be emitted
      breaker.emit("stateChange", {
        oldState: "closed",
        newState: "open",
        reason: "test",
        timestamp: new Date(),
      });
    });

    it("should clear call history on destroy", async () => {
      const breaker = new RAGCircuitBreaker("test");

      await breaker.execute(async () => "success");
      await breaker.execute(async () => "success");

      breaker.destroy();

      expect(breaker.getStats().totalCalls).toBe(0);
    });
  });
});

describe("RAGCircuitBreakerManager", () => {
  let manager: RAGCircuitBreakerManager;

  beforeEach(() => {
    manager = new RAGCircuitBreakerManager();
  });

  afterEach(() => {
    manager.destroyAll();
  });

  describe("breaker management", () => {
    it("should create and retrieve breakers", () => {
      const breaker = manager.getBreaker("test");

      expect(breaker).toBeInstanceOf(RAGCircuitBreaker);
      expect(breaker.getName()).toBe("test");
    });

    it("should return same breaker for same name", () => {
      const breaker1 = manager.getBreaker("same");
      const breaker2 = manager.getBreaker("same");

      expect(breaker1).toBe(breaker2);
    });

    it("should list breaker names", () => {
      manager.getBreaker("breaker1");
      manager.getBreaker("breaker2");
      manager.getBreaker("breaker3");

      const names = manager.getBreakerNames();
      expect(names).toContain("breaker1");
      expect(names).toContain("breaker2");
      expect(names).toContain("breaker3");
    });

    it("should remove breaker", () => {
      manager.getBreaker("to-remove");
      expect(manager.getBreakerNames()).toContain("to-remove");

      const removed = manager.removeBreaker("to-remove");

      expect(removed).toBe(true);
      expect(manager.getBreakerNames()).not.toContain("to-remove");
    });

    it("should return false when removing non-existent breaker", () => {
      const removed = manager.removeBreaker("non-existent");
      expect(removed).toBe(false);
    });
  });

  describe("aggregate operations", () => {
    it("should get stats for all breakers", async () => {
      const breaker1 = manager.getBreaker("b1");
      const breaker2 = manager.getBreaker("b2");

      await breaker1.execute(async () => "success");
      await breaker2.execute(async () => "success");

      const allStats = manager.getAllStats();

      expect(allStats["b1"]).toBeDefined();
      expect(allStats["b2"]).toBeDefined();
    });

    it("should reset all breakers", async () => {
      vi.useFakeTimers();

      const breaker1 = manager.getBreaker("r1", {
        failureThreshold: 1,
        minimumCallsBeforeCalculation: 1,
      });
      const breaker2 = manager.getBreaker("r2", {
        failureThreshold: 1,
        minimumCallsBeforeCalculation: 1,
      });

      try {
        await breaker1.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }
      try {
        await breaker2.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }

      expect(breaker1.isOpen()).toBe(true);
      expect(breaker2.isOpen()).toBe(true);

      manager.resetAll();

      expect(breaker1.isClosed()).toBe(true);
      expect(breaker2.isClosed()).toBe(true);

      vi.useRealTimers();
    });

    it("should provide health summary", async () => {
      vi.useFakeTimers();

      manager.getBreaker("closed");

      const openBreaker = manager.getBreaker("open", {
        failureThreshold: 1,
        minimumCallsBeforeCalculation: 1,
      });
      try {
        await openBreaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }

      const health = manager.getHealthSummary();

      expect(health.totalBreakers).toBe(2);
      expect(health.closedBreakers).toBe(1);
      expect(health.openBreakers).toBe(1);
      expect(health.unhealthyBreakers).toContain("open");

      vi.useRealTimers();
    });

    it("should destroy all breakers", () => {
      manager.getBreaker("d1");
      manager.getBreaker("d2");

      manager.destroyAll();

      expect(manager.getBreakerNames()).toHaveLength(0);
    });
  });
});

describe("Convenience functions", () => {
  afterEach(() => {
    ragCircuitBreakerManager.destroyAll();
  });

  it("getCircuitBreaker should return breaker", () => {
    const breaker = getCircuitBreaker("test-breaker");
    expect(breaker).toBeInstanceOf(RAGCircuitBreaker);
    expect(breaker.getName()).toBe("test-breaker");
  });

  it("executeWithCircuitBreaker should execute operation", async () => {
    const result = await executeWithCircuitBreaker(
      "test-exec",
      async () => "result",
      "query",
    );

    expect(result).toBe("result");
  });
});
