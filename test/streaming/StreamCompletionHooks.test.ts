/**
 * Tests for StreamCompletionHooks
 *
 * Tests Pattern 4: Completion Hooks
 * - Callback invocation
 * - Hook ordering (priority)
 * - Checkpoint/resume functionality
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  StreamCompletionHooks,
  createStreamHooks,
  createStreamHooksWithDefaults,
  createLoggingHooks,
  createMetricsHook,
  createRetryHook,
  type StreamStartContext,
  type StreamCompleteContext,
  type StreamErrorContext,
} from "../../src/lib/core/stream/StreamCompletionHooks.js";

describe("StreamCompletionHooks", () => {
  const defaultConfig = {
    streamId: "stream-123",
    provider: "test-provider",
    model: "test-model",
  };

  describe("Callback Invocation", () => {
    it("should trigger start hooks", async () => {
      const hooks = createStreamHooks(defaultConfig);
      const startCallback = vi.fn();

      hooks.onStart(startCallback);
      await hooks.triggerStart({ config: { temperature: 0.7 } });

      expect(startCallback).toHaveBeenCalledTimes(1);
      expect(startCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          streamId: "stream-123",
          phase: "started",
          config: { temperature: 0.7 },
        }),
      );
    });

    it("should trigger progress hooks", async () => {
      const hooks = createStreamHooks(defaultConfig);
      const progressCallback = vi.fn();

      hooks.onProgress(progressCallback);
      await hooks.triggerProgress({
        eventCount: 10,
        bytesReceived: 1024,
        currentText: "Hello World",
      });

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          eventCount: 10,
          bytesReceived: 1024,
          currentText: "Hello World",
          phase: "streaming",
        }),
      );
    });

    it("should trigger complete hooks with full context", async () => {
      const hooks = createStreamHooks(defaultConfig);
      const completeCallback = vi.fn();

      hooks.onComplete(completeCallback);
      await hooks.triggerComplete({
        text: "Final response",
        finishReason: "stop",
        usage: { input: 10, output: 20, total: 30 },
        totalEvents: 15,
      });

      expect(completeCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Final response",
          finishReason: "stop",
          usage: { input: 10, output: 20, total: 30 },
          phase: "completed",
        }),
      );
    });

    it("should trigger error hooks", async () => {
      const hooks = createStreamHooks(defaultConfig);
      const errorCallback = vi.fn();

      hooks.onError(errorCallback);
      await hooks.triggerError({
        error: new Error("Connection failed"),
        code: "NETWORK_ERROR",
        recoverable: true,
        eventCount: 5,
      });

      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          code: "NETWORK_ERROR",
          recoverable: true,
          phase: "error",
        }),
      );
    });

    it("should trigger event hooks for specific event types", async () => {
      const hooks = createStreamHooks(defaultConfig);
      const textDeltaCallback = vi.fn();
      const wildcardCallback = vi.fn();

      hooks.onEvent("text:delta", textDeltaCallback);
      hooks.onEvent("*", wildcardCallback);

      await hooks.triggerEvent(
        {
          type: "text:delta",
          seq: 1,
          timestamp: Date.now(),
          delta: "Hello",
        },
        0,
      );

      expect(textDeltaCallback).toHaveBeenCalled();
      expect(wildcardCallback).toHaveBeenCalled();
    });
  });

  describe("Hook Ordering (Priority)", () => {
    it("should execute hooks in priority order", async () => {
      const hooks = createStreamHooks(defaultConfig);
      const order: string[] = [];

      hooks.onStart(() => order.push("normal"), { priority: "normal" });
      hooks.onStart(() => order.push("critical"), { priority: "critical" });
      hooks.onStart(() => order.push("low"), { priority: "low" });
      hooks.onStart(() => order.push("high"), { priority: "high" });

      await hooks.triggerStart();

      expect(order).toEqual(["critical", "high", "normal", "low"]);
    });

    it("should allow hook removal", async () => {
      const hooks = createStreamHooks(defaultConfig);
      const callback = vi.fn();

      const hookId = hooks.onStart(callback);
      hooks.removeHook(hookId);

      await hooks.triggerStart();

      expect(callback).not.toHaveBeenCalled();
    });

    it("should allow enabling/disabling hooks", async () => {
      const hooks = createStreamHooks(defaultConfig);
      const callback = vi.fn();

      const hookId = hooks.onStart(callback);

      // Disable hook
      hooks.setHookEnabled(hookId, false);
      await hooks.triggerStart();
      expect(callback).not.toHaveBeenCalled();

      // Re-enable hook
      hooks.setHookEnabled(hookId, true);
      await hooks.triggerStart();
      expect(callback).toHaveBeenCalled();
    });

    it("should continue executing hooks even if one fails", async () => {
      const hooks = createStreamHooks(defaultConfig);
      const firstCallback = vi.fn();
      const failingCallback = vi.fn(() => {
        throw new Error("Hook failed");
      });
      const lastCallback = vi.fn();

      hooks.onStart(firstCallback, { priority: "critical" });
      hooks.onStart(failingCallback, { priority: "high" });
      hooks.onStart(lastCallback, { priority: "normal" });

      await hooks.triggerStart();

      expect(firstCallback).toHaveBeenCalled();
      expect(failingCallback).toHaveBeenCalled();
      expect(lastCallback).toHaveBeenCalled(); // Should still execute
    });
  });

  describe("Checkpoint/Resume", () => {
    it("should create checkpoint on pause", async () => {
      const hooks = createStreamHooks(defaultConfig);

      const checkpointId = await hooks.triggerPause({
        reason: "Human input required",
        text: "Partial response",
        eventCount: 10,
        lastEventSeq: 15,
      });

      expect(checkpointId).toBeDefined();
      expect(checkpointId).toContain("checkpoint");

      const checkpoint = hooks.getCheckpoint(checkpointId);
      expect(checkpoint).toBeDefined();
      expect(checkpoint?.state.text).toBe("Partial response");
      expect(checkpoint?.state.eventCount).toBe(10);
    });

    it("should resume from checkpoint", async () => {
      const hooks = createStreamHooks(defaultConfig);

      const checkpointId = await hooks.triggerPause({
        reason: "Pause",
        text: "Saved text",
        eventCount: 5,
        lastEventSeq: 10,
      });

      // Wait a bit to get measurable pause duration
      await new Promise((r) => setTimeout(r, 10));

      const restored = await hooks.triggerResume(checkpointId);

      expect(restored).toBeDefined();
      expect(restored?.state.text).toBe("Saved text");
    });

    it("should trigger pause and resume hooks", async () => {
      const hooks = createStreamHooks(defaultConfig);
      const pauseCallback = vi.fn();
      const resumeCallback = vi.fn();

      hooks.onPause(pauseCallback);
      hooks.onResume(resumeCallback);

      const checkpointId = await hooks.triggerPause({
        reason: "Test",
        text: "Text",
        eventCount: 1,
        lastEventSeq: 1,
      });

      expect(pauseCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: "paused",
          reason: "Test",
          checkpointId: expect.any(String),
        }),
      );

      await hooks.triggerResume(checkpointId);

      expect(resumeCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: "resuming",
          checkpointId,
        }),
      );
    });

    it("should export and import checkpoints", async () => {
      const hooks1 = createStreamHooks(defaultConfig);

      const checkpointId = await hooks1.triggerPause({
        reason: "Export test",
        text: "Important data",
        eventCount: 100,
        lastEventSeq: 150,
      });

      const exported = hooks1.exportCheckpoint(checkpointId);
      expect(exported).toBeDefined();

      // Import into new hooks instance
      const hooks2 = createStreamHooks(defaultConfig);
      const importedId = hooks2.importCheckpoint(exported!);

      expect(importedId).toBe(checkpointId);

      const restored = hooks2.getCheckpoint(importedId!);
      expect(restored?.state.text).toBe("Important data");
    });

    it("should get all checkpoints", async () => {
      const hooks = createStreamHooks(defaultConfig);

      await hooks.triggerPause({
        reason: "1",
        text: "a",
        eventCount: 1,
        lastEventSeq: 1,
      });
      await hooks.triggerPause({
        reason: "2",
        text: "b",
        eventCount: 2,
        lastEventSeq: 2,
      });

      const all = hooks.getAllCheckpoints();
      expect(all).toHaveLength(2);
    });

    it("should clear and delete checkpoints", async () => {
      const hooks = createStreamHooks(defaultConfig);

      const id1 = await hooks.triggerPause({
        reason: "1",
        text: "a",
        eventCount: 1,
        lastEventSeq: 1,
      });
      await hooks.triggerPause({
        reason: "2",
        text: "b",
        eventCount: 2,
        lastEventSeq: 2,
      });

      // Delete one
      hooks.deleteCheckpoint(id1);
      expect(hooks.getAllCheckpoints()).toHaveLength(1);

      // Clear all
      hooks.clearCheckpoints();
      expect(hooks.getAllCheckpoints()).toHaveLength(0);
    });
  });

  describe("Error Handling and Retry", () => {
    it("should return retry instructions from error hooks", async () => {
      const hooks = createStreamHooks(defaultConfig);

      hooks.onError(() => ({ retry: true, delay: 1000 }));

      const result = await hooks.triggerError({
        error: new Error("Temporary failure"),
        recoverable: true,
        eventCount: 0,
      });

      expect(result.shouldRetry).toBe(true);
      expect(result.delay).toBe(1000);
    });

    it("should not retry when no hook indicates retry", async () => {
      const hooks = createStreamHooks(defaultConfig);

      hooks.onError(() => {
        // Just log, don't return retry
      });

      const result = await hooks.triggerError({
        error: new Error("Fatal error"),
        recoverable: false,
        eventCount: 0,
      });

      expect(result.shouldRetry).toBe(false);
    });

    it("should use createRetryHook for exponential backoff", async () => {
      const hooks = createStreamHooks(defaultConfig);

      const retryHook = createRetryHook({
        maxRetries: 3,
        baseDelay: 100,
      });

      hooks.onError(retryHook);

      // First retry
      const result1 = await hooks.triggerError({
        error: new Error("Error 1"),
        recoverable: true,
        eventCount: 0,
      });

      expect(result1.shouldRetry).toBe(true);
      expect(result1.delay).toBe(100); // baseDelay * 2^0

      // Second retry
      const result2 = await hooks.triggerError({
        error: new Error("Error 2"),
        recoverable: true,
        eventCount: 0,
      });

      expect(result2.shouldRetry).toBe(true);
      expect(result2.delay).toBe(200); // baseDelay * 2^1
    });
  });

  describe("Factory Functions", () => {
    it("should create hooks with defaults", async () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();

      const hooks = createStreamHooksWithDefaults(defaultConfig, {
        onStart,
        onComplete,
      });

      await hooks.triggerStart();
      await hooks.triggerComplete({
        text: "Done",
        finishReason: "stop",
        totalEvents: 1,
      });

      expect(onStart).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });

    it("should create logging hooks", () => {
      const loggingHooks = createLoggingHooks("TestStream");

      expect(loggingHooks.onStart).toBeDefined();
      expect(loggingHooks.onProgress).toBeDefined();
      expect(loggingHooks.onComplete).toBeDefined();
      expect(loggingHooks.onError).toBeDefined();
    });

    it("should create metrics hooks", async () => {
      const collector = {
        recordStart: vi.fn(),
        recordComplete: vi.fn(),
        recordError: vi.fn(),
      };

      const metricsHooks = createMetricsHook(collector);
      const hooks = createStreamHooks(defaultConfig);

      hooks.onStart(metricsHooks.onStart);
      hooks.onComplete(metricsHooks.onComplete);
      hooks.onError(metricsHooks.onError);

      await hooks.triggerStart();
      expect(collector.recordStart).toHaveBeenCalledWith(
        "stream-123",
        "test-provider",
        "test-model",
      );

      await hooks.triggerComplete({
        text: "Done",
        finishReason: "stop",
        totalEvents: 1,
      });
      expect(collector.recordComplete).toHaveBeenCalled();
    });
  });

  describe("State Management", () => {
    it("should track phase transitions", async () => {
      const hooks = createStreamHooks(defaultConfig);

      expect(hooks.getPhase()).toBe("initializing");

      await hooks.triggerStart();
      expect(hooks.getPhase()).toBe("started");

      await hooks.triggerProgress({
        eventCount: 1,
        bytesReceived: 100,
        currentText: "Hi",
      });
      expect(hooks.getPhase()).toBe("streaming");

      await hooks.triggerComplete({
        text: "Done",
        finishReason: "stop",
        totalEvents: 1,
      });
      expect(hooks.getPhase()).toBe("completed");
    });

    it("should manage metadata", () => {
      const hooks = createStreamHooks({
        ...defaultConfig,
        metadata: { userId: "user-1" },
      });

      expect(hooks.getMetadata()).toEqual({ userId: "user-1" });

      hooks.updateMetadata({ requestId: "req-1" });

      expect(hooks.getMetadata()).toEqual({
        userId: "user-1",
        requestId: "req-1",
      });
    });

    it("should count registered hooks", () => {
      const hooks = createStreamHooks(defaultConfig);

      hooks.onStart(() => {});
      hooks.onStart(() => {});
      hooks.onComplete(() => {});
      hooks.onError(() => {});

      const counts = hooks.getHookCounts();

      expect(counts.start).toBe(2);
      expect(counts.complete).toBe(1);
      expect(counts.error).toBe(1);
      expect(counts.progress).toBe(0);
    });
  });
});
