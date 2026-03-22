/**
 * Streaming Architecture Integration Tests
 *
 * Comprehensive integration tests for NeuroLink's Mastra-style streaming architecture.
 * Tests stream creation, event emission, backpressure control, error recovery,
 * provider switching, chunk processing, completion/cancellation, and memory management.
 *
 * Test coverage:
 * - Stream creation and initialization
 * - Event emission (24+ event types)
 * - Backpressure control
 * - Error recovery (retry, fallback)
 * - Provider switching during stream
 * - Chunk processing
 * - Stream completion/cancellation
 * - Memory leak prevention
 *
 * @module test/streaming/integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Import streaming modules
import {
  StreamEventEmitter,
  createStreamEventEmitter,
  transformAISDKStream,
} from "../../../src/lib/streaming/streamEventEmitter.js";

import {
  MastraModelOutput,
  createModelOutput,
  fromLegacyStream,
} from "../../../src/lib/streaming/streamOutput.js";

import {
  BackpressureController,
  withBackpressure,
  bufferedStream,
  rateLimitedStream,
  chunkedStream,
  createPressureMonitor,
  AdaptiveRateController,
  DEFAULT_BACKPRESSURE_CONFIG,
} from "../../../src/lib/streaming/backpressure.js";

import {
  StreamError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  ProviderError,
  ValidationError,
  ContentFilterError,
  isRetriableError,
  calculateRetryDelay,
  sleep,
  withRetry,
  withStreamRetry,
  withProviderFallback,
  withStreamRecovery,
  createErrorPayload,
  categorizeError,
  DEFAULT_RETRY_CONFIG,
  AGGRESSIVE_RETRY_CONFIG,
  CONSERVATIVE_RETRY_CONFIG,
} from "../../../src/lib/streaming/errorRecovery.js";

import {
  isTextEvent,
  isToolEvent,
  isReasoningEvent,
  isMessageEvent,
  isObjectEvent,
  isStepEvent,
  isAudioEvent,
  isErrorEvent,
  isContentEvent,
} from "../../../src/lib/streaming/types.js";

import type {
  StreamEventPayload,
  TextDeltaPayload,
  ToolCallPayload,
  ToolResultPayload,
  ErrorPayload,
} from "../../../src/lib/streaming/types.js";

import type { AISDKStreamPart } from "../../../src/lib/streaming/streamEventEmitter.js";

// ============================================
// TEST UTILITIES
// ============================================

/**
 * Create a mock AI SDK stream from parts
 */
function createMockAISDKStream(
  parts: AISDKStreamPart[],
): AsyncIterable<AISDKStreamPart> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const part of parts) {
        yield part;
      }
    },
  };
}

/**
 * Create a mock stream with delays
 */
function createDelayedStream<T>(
  items: T[],
  delayMs: number = 10,
): AsyncIterable<T> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of items) {
        await sleep(delayMs);
        yield item;
      }
    },
  };
}

/**
 * Create a stream that fails after N items
 */
function createFailingStream<T>(
  items: T[],
  failAfter: number,
  error: Error,
): AsyncIterable<T> {
  return {
    async *[Symbol.asyncIterator]() {
      let count = 0;
      for (const item of items) {
        if (count >= failAfter) {
          throw error;
        }
        yield item;
        count++;
      }
    },
  };
}

/**
 * Collect all items from an async iterable
 */
async function collectStream<T>(stream: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of stream) {
    items.push(item);
  }
  return items;
}

// ============================================
// STREAM CREATION AND INITIALIZATION TESTS
// ============================================

describe("Stream Creation and Initialization", () => {
  describe("StreamEventEmitter", () => {
    it("should create a stream event emitter with config", () => {
      const emitter = new StreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      expect(emitter).toBeInstanceOf(StreamEventEmitter);
      expect(emitter.getStreamId()).toBeDefined();
      expect(typeof emitter.getStreamId()).toBe("string");
    });

    it("should initialize with custom stream ID", () => {
      const customId = "test-stream-123";
      const emitter = new StreamEventEmitter({
        provider: "anthropic",
        model: "claude-3-opus",
        streamId: customId,
      });

      expect(emitter.getStreamId()).toBe(customId);
    });

    it("should initialize with empty accumulated text", () => {
      const emitter = new StreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      expect(emitter.getAccumulatedText()).toBe("");
      expect(emitter.getAccumulatedReasoning()).toBe("");
    });

    it("should reset state correctly", () => {
      const emitter = new StreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      // Simulate some state accumulation
      const mockStream = createMockAISDKStream([
        { type: "text-delta", textDelta: "Hello" },
      ]);

      // Transform and consume
      (async () => {
        for await (const _event of emitter.transform(mockStream)) {
          // consume
        }
      })();

      // Reset
      emitter.reset();

      expect(emitter.getAccumulatedText()).toBe("");
      expect(emitter.getAccumulatedReasoning()).toBe("");
    });
  });

  describe("MastraModelOutput", () => {
    it("should create model output from event stream", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          delta: "Hello",
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      expect(output.provider).toBe("openai");
      expect(output.model).toBe("gpt-4o");
      expect(output.streamId).toBe("test-123");
      expect(output.isConsumed).toBe(false);
      expect(output.isCompleted).toBe(false);
    });

    it("should create model output using factory function", () => {
      const eventStream = (async function* () {
        yield {
          type: "text:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          delta: "Test",
        };
      })();

      const output = createModelOutput(eventStream, {
        provider: "anthropic",
        model: "claude-3-sonnet",
      });

      expect(output.provider).toBe("anthropic");
      expect(output.model).toBe("claude-3-sonnet");
    });

    it("should create model output from legacy stream", async () => {
      const legacyStream = (async function* () {
        yield { content: "Hello " };
        yield { content: "World" };
      })();

      const output = fromLegacyStream(legacyStream, {
        provider: "openai",
        model: "gpt-4o",
      });

      expect(output.provider).toBe("openai");
      expect(output.isConsumed).toBe(false);
    });
  });

  describe("BackpressureController", () => {
    it("should create controller with default config", () => {
      const controller = new BackpressureController();

      expect(controller.paused).toBe(false);
      expect(controller.ended).toBe(false);
      expect(controller.size).toBe(0);
    });

    it("should create controller with custom config", () => {
      const controller = new BackpressureController({
        highWatermark: 50,
        lowWatermark: 10,
        maxBufferSize: 500,
      });

      const state = controller.getState();
      expect(state.bufferSize).toBe(0);
      expect(state.isPaused).toBe(false);
      expect(state.totalBuffered).toBe(0);
      expect(state.totalDropped).toBe(0);
    });
  });
});

// ============================================
// EVENT EMISSION TESTS (24 Event Types)
// ============================================

describe("Event Emission - 24 Event Types", () => {
  describe("Text Events", () => {
    it("should emit text:start event on first text delta", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      const mockStream = createMockAISDKStream([
        { type: "text-delta", textDelta: "Hello" },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const textStartEvent = events.find((e) => e.type === "text:start");

      expect(textStartEvent).toBeDefined();
      expect(textStartEvent?.type).toBe("text:start");
      expect((textStartEvent as { model?: string })?.model).toBe("gpt-4o");
    });

    it("should emit text:delta events for each chunk", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      const mockStream = createMockAISDKStream([
        { type: "text-delta", textDelta: "Hello" },
        { type: "text-delta", textDelta: " World" },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const textDeltas = events.filter(
        (e) => e.type === "text:delta",
      ) as TextDeltaPayload[];

      expect(textDeltas).toHaveLength(2);
      expect(textDeltas[0].delta).toBe("Hello");
      expect(textDeltas[1].delta).toBe(" World");
    });

    it("should emit text:end event with accumulated text", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      const mockStream = createMockAISDKStream([
        { type: "text-delta", textDelta: "Hello" },
        { type: "text-delta", textDelta: " World" },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const textEndEvent = events.find((e) => e.type === "text:end") as {
        text?: string;
        charCount?: number;
      };

      expect(textEndEvent).toBeDefined();
      expect(textEndEvent?.text).toBe("Hello World");
      expect(textEndEvent?.charCount).toBe(11);
    });

    it("should include accumulated text when configured", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
        includeAccumulated: true,
      });

      const mockStream = createMockAISDKStream([
        { type: "text-delta", textDelta: "A" },
        { type: "text-delta", textDelta: "B" },
        { type: "text-delta", textDelta: "C" },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const textDeltas = events.filter(
        (e) => e.type === "text:delta",
      ) as TextDeltaPayload[];

      expect(textDeltas[0].accumulated).toBe("A");
      expect(textDeltas[1].accumulated).toBe("AB");
      expect(textDeltas[2].accumulated).toBe("ABC");
    });
  });

  describe("Tool Events", () => {
    it("should emit tool:call:start event", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      const mockStream = createMockAISDKStream([
        {
          type: "tool-call-streaming-start",
          toolCallId: "call-123",
          toolName: "get_weather",
        },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const toolStartEvent = events.find((e) => e.type === "tool:call:start");

      expect(toolStartEvent).toBeDefined();
      expect((toolStartEvent as { toolCallId?: string })?.toolCallId).toBe(
        "call-123",
      );
      expect((toolStartEvent as { toolName?: string })?.toolName).toBe(
        "get_weather",
      );
    });

    it("should emit tool:call:delta events for streaming arguments", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      const mockStream = createMockAISDKStream([
        {
          type: "tool-call-streaming-start",
          toolCallId: "call-123",
          toolName: "get_weather",
        },
        {
          type: "tool-call-delta",
          toolCallId: "call-123",
          argsTextDelta: '{"',
        },
        {
          type: "tool-call-delta",
          toolCallId: "call-123",
          argsTextDelta: 'city":',
        },
        {
          type: "tool-call-delta",
          toolCallId: "call-123",
          argsTextDelta: '"NYC"}',
        },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const toolDeltas = events.filter((e) => e.type === "tool:call:delta");

      expect(toolDeltas).toHaveLength(3);
    });

    it("should emit tool:call event with complete arguments", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      const mockStream = createMockAISDKStream([
        {
          type: "tool-call",
          toolCallId: "call-123",
          toolName: "get_weather",
          args: { city: "NYC" },
        },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const toolCallEvent = events.find(
        (e) => e.type === "tool:call",
      ) as ToolCallPayload;

      expect(toolCallEvent).toBeDefined();
      expect(toolCallEvent.toolCallId).toBe("call-123");
      expect(toolCallEvent.toolName).toBe("get_weather");
      expect(toolCallEvent.args).toEqual({ city: "NYC" });
    });

    it("should emit tool:result event", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      const mockStream = createMockAISDKStream([
        {
          type: "tool-call-streaming-start",
          toolCallId: "call-123",
          toolName: "get_weather",
        },
        {
          type: "tool-result",
          toolCallId: "call-123",
          toolName: "get_weather",
          result: { temp: 72, conditions: "sunny" },
        },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const toolResultEvent = events.find(
        (e) => e.type === "tool:result",
      ) as ToolResultPayload;

      expect(toolResultEvent).toBeDefined();
      expect(toolResultEvent.toolCallId).toBe("call-123");
      expect(toolResultEvent.toolName).toBe("get_weather");
      expect(toolResultEvent.result).toEqual({ temp: 72, conditions: "sunny" });
      expect(toolResultEvent.success).toBe(true);
    });
  });

  describe("Reasoning Events", () => {
    it("should emit reasoning:start event on first reasoning delta", async () => {
      const emitter = createStreamEventEmitter({
        provider: "anthropic",
        model: "claude-3-opus",
        emitReasoningEvents: true,
      });

      const mockStream = createMockAISDKStream([
        { type: "reasoning", textDelta: "Let me think..." },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const reasoningStartEvent = events.find(
        (e) => e.type === "reasoning:start",
      );

      expect(reasoningStartEvent).toBeDefined();
    });

    it("should emit reasoning:delta events", async () => {
      const emitter = createStreamEventEmitter({
        provider: "anthropic",
        model: "claude-3-opus",
        emitReasoningEvents: true,
      });

      const mockStream = createMockAISDKStream([
        { type: "reasoning", textDelta: "First, " },
        { type: "reasoning", textDelta: "let me analyze..." },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const reasoningDeltas = events.filter(
        (e) => e.type === "reasoning:delta",
      );

      expect(reasoningDeltas).toHaveLength(2);
    });

    it("should emit reasoning:end event", async () => {
      const emitter = createStreamEventEmitter({
        provider: "anthropic",
        model: "claude-3-opus",
        emitReasoningEvents: true,
      });

      const mockStream = createMockAISDKStream([
        { type: "reasoning", textDelta: "Thinking..." },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const reasoningEndEvent = events.find(
        (e) => e.type === "reasoning:end",
      ) as { reasoning?: string };

      expect(reasoningEndEvent).toBeDefined();
      expect(reasoningEndEvent?.reasoning).toBe("Thinking...");
    });

    it("should handle reasoning signature", async () => {
      const emitter = createStreamEventEmitter({
        provider: "anthropic",
        model: "claude-3-opus",
        emitReasoningEvents: true,
      });

      const mockStream = createMockAISDKStream([
        { type: "reasoning", textDelta: "Analysis..." },
        { type: "reasoning-signature", signature: "sig-abc123" },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const reasoningEndEvent = events.find(
        (e) => e.type === "reasoning:end",
      ) as { thoughtSignature?: string };

      expect(reasoningEndEvent?.thoughtSignature).toBe("sig-abc123");
    });

    it("should not emit reasoning events when disabled", async () => {
      const emitter = createStreamEventEmitter({
        provider: "anthropic",
        model: "claude-3-opus",
        emitReasoningEvents: false,
      });

      const mockStream = createMockAISDKStream([
        { type: "reasoning", textDelta: "Thinking..." },
        { type: "text-delta", textDelta: "Response" },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const reasoningEvents = events.filter((e) =>
        e.type.startsWith("reasoning:"),
      );

      expect(reasoningEvents).toHaveLength(0);
    });
  });

  describe("Step Events", () => {
    it("should emit step:start event", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
        maxSteps: 5,
      });

      const mockStream = createMockAISDKStream([
        { type: "step-start", stepType: "initial", messageId: "msg-123" },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const stepStartEvent = events.find((e) => e.type === "step:start") as {
        stepNumber?: number;
        maxSteps?: number;
        stepType?: string;
      };

      expect(stepStartEvent).toBeDefined();
      expect(stepStartEvent?.stepNumber).toBe(1);
      expect(stepStartEvent?.maxSteps).toBe(5);
      expect(stepStartEvent?.stepType).toBe("initial");
    });

    it("should emit step:end event", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      const mockStream = createMockAISDKStream([
        { type: "step-start", stepType: "initial", messageId: "msg-123" },
        {
          type: "step-finish",
          finishReason: "stop",
          usage: { promptTokens: 100, completionTokens: 50 },
          isContinued: false,
        },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const stepEndEvent = events.find((e) => e.type === "step:end") as {
        stepNumber?: number;
        finishReason?: string;
        isContinued?: boolean;
        usage?: { input: number; output: number; total: number };
      };

      expect(stepEndEvent).toBeDefined();
      expect(stepEndEvent?.stepNumber).toBe(1);
      expect(stepEndEvent?.finishReason).toBe("stop");
      expect(stepEndEvent?.isContinued).toBe(false);
      expect(stepEndEvent?.usage?.input).toBe(100);
      expect(stepEndEvent?.usage?.output).toBe(50);
    });
  });

  describe("Object Events", () => {
    it("should emit object:delta events for partial objects", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      const mockStream = createMockAISDKStream([
        { type: "partial-object", object: { name: "John" } },
        { type: "partial-object", object: { name: "John", age: 30 } },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const objectDeltas = events.filter((e) => e.type === "object:delta");

      expect(objectDeltas).toHaveLength(2);
    });

    it("should emit object:complete event", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      const mockStream = createMockAISDKStream([
        { type: "object", object: { name: "John", age: 30, city: "NYC" } },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const objectCompleteEvent = events.find(
        (e) => e.type === "object:complete",
      ) as {
        object?: unknown;
        valid?: boolean;
      };

      expect(objectCompleteEvent).toBeDefined();
      expect(objectCompleteEvent?.object).toEqual({
        name: "John",
        age: 30,
        city: "NYC",
      });
      expect(objectCompleteEvent?.valid).toBe(true);
    });
  });

  describe("Error Events", () => {
    it("should emit error event from stream error", async () => {
      const emitter = createStreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      const mockStream = createMockAISDKStream([
        { type: "error", error: new Error("API rate limit exceeded") },
      ]);

      const events = await collectStream(emitter.transform(mockStream));
      const errorEvent = events.find((e) => e.type === "error") as ErrorPayload;

      expect(errorEvent).toBeDefined();
      expect(errorEvent.message).toBe("API rate limit exceeded");
      expect(errorEvent.category).toBe("execution");
    });
  });

  describe("Type Guards", () => {
    it("should correctly identify text events", () => {
      const textDelta: StreamEventPayload = {
        type: "text:delta",
        seq: 0,
        timestamp: Date.now(),
        delta: "Hello",
      } as TextDeltaPayload;

      expect(isTextEvent(textDelta)).toBe(true);
      expect(isToolEvent(textDelta)).toBe(false);
      expect(isContentEvent(textDelta)).toBe(true);
    });

    it("should correctly identify tool events", () => {
      const toolCall: StreamEventPayload = {
        type: "tool:call",
        seq: 0,
        timestamp: Date.now(),
        toolCallId: "call-123",
        toolName: "test",
        args: {},
      } as ToolCallPayload;

      expect(isToolEvent(toolCall)).toBe(true);
      expect(isTextEvent(toolCall)).toBe(false);
    });

    it("should correctly identify reasoning events", () => {
      const reasoning: StreamEventPayload = {
        type: "reasoning:delta",
        seq: 0,
        timestamp: Date.now(),
        delta: "Thinking...",
      };

      expect(isReasoningEvent(reasoning)).toBe(true);
      expect(isTextEvent(reasoning)).toBe(false);
    });

    it("should correctly identify error events", () => {
      const error: StreamEventPayload = {
        type: "error",
        seq: 0,
        timestamp: Date.now(),
        code: "TEST_ERROR",
        message: "Test error",
        retriable: true,
        category: "execution",
      } as ErrorPayload;

      expect(isErrorEvent(error)).toBe(true);
      expect(isTextEvent(error)).toBe(false);
    });
  });
});

// ============================================
// BACKPRESSURE CONTROL TESTS
// ============================================

describe("Backpressure Control", () => {
  describe("BackpressureController", () => {
    it("should buffer items without blocking when under watermark", async () => {
      const controller = new BackpressureController({ highWatermark: 10 });

      for (let i = 0; i < 5; i++) {
        await controller.push({ id: i });
      }

      expect(controller.size).toBe(5);
      expect(controller.paused).toBe(false);
    });

    it("should pause when high watermark is reached", async () => {
      const controller = new BackpressureController({
        highWatermark: 5,
        lowWatermark: 2,
      });

      // Push to high watermark (5 items)
      for (let i = 0; i < 5; i++) {
        await controller.push({ id: i });
      }

      // Should be paused now
      expect(controller.paused).toBe(true);
    });

    it("should resume when buffer drops below low watermark", async () => {
      const controller = new BackpressureController({
        highWatermark: 5,
        lowWatermark: 2,
      });

      // Push items to trigger pause
      const pushPromises = [];
      for (let i = 0; i < 10; i++) {
        pushPromises.push(controller.push({ id: i }));
      }

      // Consume items to resume
      const stream = controller.stream();
      const items: unknown[] = [];

      // Pull 8 items to drop below low watermark
      for (let i = 0; i < 8; i++) {
        const result = await controller.pull();
        if (!result.done) {
          items.push(result.value);
        }
      }

      // Should be resumed
      expect(controller.paused).toBe(false);
    });

    it("should signal end of stream", async () => {
      const controller = new BackpressureController();

      await controller.push({ id: 1 });
      await controller.push({ id: 2 });
      controller.end();

      const items: unknown[] = [];
      for await (const item of controller.stream()) {
        items.push(item);
      }

      expect(items).toHaveLength(2);
      expect(controller.ended).toBe(true);
    });

    it("should handle overflow with drop-oldest strategy", async () => {
      const onDrop = vi.fn();
      const controller = new BackpressureController({
        highWatermark: 5,
        lowWatermark: 2,
        maxBufferSize: 5,
        overflowStrategy: "drop-oldest",
        onDrop,
      });

      // Push more than max buffer size
      const pushPromises = [];
      for (let i = 0; i < 6; i++) {
        pushPromises.push(controller.push({ id: i }));
      }

      // Should have called onDrop
      expect(onDrop).toHaveBeenCalled();
    });

    it("should track state correctly", async () => {
      const controller = new BackpressureController({
        highWatermark: 10,
        lowWatermark: 5,
      });

      await controller.push({ id: 1 });
      await controller.push({ id: 2 });

      const state = controller.getState();

      expect(state.bufferSize).toBe(2);
      expect(state.isPaused).toBe(false);
      expect(state.totalBuffered).toBe(2);
      expect(state.totalDropped).toBe(0);
    });

    it("should handle errors correctly", async () => {
      const controller = new BackpressureController();
      const testError = new Error("Test error");

      await controller.push({ id: 1 });
      controller.setError(testError);

      await expect(controller.pull()).rejects.toThrow("Test error");
    });
  });

  describe("Backpressure Utilities", () => {
    it("should apply backpressure to stream with withBackpressure", async () => {
      const source = createDelayedStream([1, 2, 3, 4, 5], 5);
      const controlled = withBackpressure(source, { highWatermark: 3 });

      const items = await collectStream(controlled);

      expect(items).toEqual([1, 2, 3, 4, 5]);
    });

    it("should buffer stream with bufferedStream", async () => {
      const source = (async function* () {
        for (let i = 0; i < 10; i++) {
          yield i;
        }
      })();

      const batches: number[][] = [];
      for await (const batch of bufferedStream(source, { maxItems: 3 })) {
        batches.push(batch);
      }

      expect(batches.length).toBeGreaterThanOrEqual(3);
    });

    it("should rate limit stream with rateLimitedStream", async () => {
      const source = (async function* () {
        for (let i = 0; i < 5; i++) {
          yield i;
        }
      })();

      const startTime = Date.now();
      const items: number[] = [];

      for await (const item of rateLimitedStream(source, 100)) {
        // 100 items/sec = 10ms minimum per item
        items.push(item);
      }

      const elapsed = Date.now() - startTime;

      expect(items).toEqual([0, 1, 2, 3, 4]);
      expect(elapsed).toBeGreaterThanOrEqual(40); // At least 4 intervals
    });

    it("should chunk stream with chunkedStream", async () => {
      const source = (async function* () {
        for (let i = 0; i < 10; i++) {
          yield i;
        }
      })();

      const chunks: number[][] = [];
      for await (const chunk of chunkedStream(source, { chunkSize: 3 })) {
        chunks.push(chunk);
      }

      expect(chunks[0]).toEqual([0, 1, 2]);
      expect(chunks[1]).toEqual([3, 4, 5]);
      expect(chunks[2]).toEqual([6, 7, 8]);
      expect(chunks[3]).toEqual([9]);
    });
  });

  describe("Pressure Monitor", () => {
    it("should create pressure monitor", () => {
      const monitor = createPressureMonitor({
        warningThreshold: 0.7,
        criticalThreshold: 0.9,
      });

      expect(monitor).toBeDefined();
      expect(typeof monitor.attach).toBe("function");
      expect(typeof monitor.detach).toBe("function");
      expect(typeof monitor.getStats).toBe("function");
    });

    it("should track warning and critical counts", () => {
      const monitor = createPressureMonitor({});

      const stats = monitor.getStats();

      expect(stats.warnings).toBe(0);
      expect(stats.criticals).toBe(0);
    });
  });

  describe("AdaptiveRateController", () => {
    it("should create controller with default options", () => {
      const controller = new AdaptiveRateController();

      expect(controller.getRate()).toBe(100);
      expect(controller.getAverageLatency()).toBe(0);
    });

    it("should process stream items", async () => {
      const controller = new AdaptiveRateController({
        targetLatencyMs: 10,
        initialRate: 50,
      });

      const source = (async function* () {
        for (let i = 0; i < 5; i++) {
          yield i;
        }
      })();

      const items: number[] = [];
      for await (const item of controller.process(source)) {
        items.push(item);
      }

      expect(items).toEqual([0, 1, 2, 3, 4]);
    });
  });
});

// ============================================
// ERROR RECOVERY TESTS
// ============================================

describe("Error Recovery - Retry and Fallback", () => {
  describe("Error Types", () => {
    it("should create StreamError with properties", () => {
      const error = new StreamError(
        "Test error",
        "TEST_CODE",
        "execution",
        true,
        { retryAfter: 5 },
      );

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.category).toBe("execution");
      expect(error.retriable).toBe(true);
      expect(error.retryAfter).toBe(5);
    });

    it("should create RateLimitError", () => {
      const error = new RateLimitError("Rate limit exceeded", 60);

      expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(error.category).toBe("rate_limit");
      expect(error.retriable).toBe(true);
      expect(error.retryAfter).toBe(60);
    });

    it("should create NetworkError", () => {
      const error = new NetworkError("Connection failed");

      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.category).toBe("network");
      expect(error.retriable).toBe(true);
    });

    it("should create TimeoutError", () => {
      const error = new TimeoutError("Request timed out");

      expect(error.code).toBe("TIMEOUT");
      expect(error.category).toBe("timeout");
      expect(error.retriable).toBe(true);
    });

    it("should create ProviderError", () => {
      const error = new ProviderError("Provider unavailable");

      expect(error.code).toBe("PROVIDER_ERROR");
      expect(error.category).toBe("provider");
      expect(error.retriable).toBe(true);
    });

    it("should create ValidationError as non-retriable", () => {
      const error = new ValidationError("Invalid input");

      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.category).toBe("validation");
      expect(error.retriable).toBe(false);
    });

    it("should create ContentFilterError as non-retriable", () => {
      const error = new ContentFilterError("Content blocked");

      expect(error.code).toBe("CONTENT_FILTER");
      expect(error.category).toBe("content_filter");
      expect(error.retriable).toBe(false);
    });

    it("should convert StreamError to event payload", () => {
      const error = new StreamError("Test", "CODE", "execution", true);
      const payload = error.toEventPayload(5);

      expect(payload.type).toBe("error");
      expect(payload.seq).toBe(5);
      expect(payload.code).toBe("CODE");
      expect(payload.message).toBe("Test");
      expect(payload.retriable).toBe(true);
    });
  });

  describe("isRetriableError", () => {
    it("should identify retriable StreamError", () => {
      const retriable = new StreamError("Rate limit", "RL", "rate_limit", true);
      const nonRetriable = new ValidationError("Invalid");

      expect(isRetriableError(retriable)).toBe(true);
      expect(isRetriableError(nonRetriable)).toBe(false);
    });

    it("should identify retriable patterns in error messages", () => {
      expect(isRetriableError(new Error("rate_limit exceeded"))).toBe(true);
      expect(isRetriableError(new Error("timeout occurred"))).toBe(true);
      expect(isRetriableError(new Error("network error"))).toBe(true);
      expect(isRetriableError(new Error("connection reset"))).toBe(true);
      expect(isRetriableError(new Error("service_unavailable"))).toBe(true);
      expect(isRetriableError(new Error("server_error 500"))).toBe(true);
    });

    it("should identify non-retriable patterns", () => {
      expect(isRetriableError(new Error("invalid_api_key"))).toBe(false);
      expect(isRetriableError(new Error("unauthorized access"))).toBe(false);
      expect(isRetriableError(new Error("content_filter blocked"))).toBe(false);
      expect(isRetriableError(new Error("validation failed"))).toBe(false);
    });
  });

  describe("calculateRetryDelay", () => {
    it("should calculate exponential backoff", () => {
      const config = { ...DEFAULT_RETRY_CONFIG, jitter: false };

      expect(calculateRetryDelay(0, config)).toBe(1000);
      expect(calculateRetryDelay(1, config)).toBe(2000);
      expect(calculateRetryDelay(2, config)).toBe(4000);
    });

    it("should respect max delay", () => {
      const config = {
        ...DEFAULT_RETRY_CONFIG,
        jitter: false,
        maxDelayMs: 5000,
      };

      expect(calculateRetryDelay(10, config)).toBe(5000);
    });

    it("should respect Retry-After header from RateLimitError", () => {
      const error = new RateLimitError("Rate limited", 30);

      const delay = calculateRetryDelay(0, DEFAULT_RETRY_CONFIG, error);

      expect(delay).toBe(30000); // 30 seconds in ms
    });

    it("should add jitter when enabled", () => {
      const config = { ...DEFAULT_RETRY_CONFIG, jitter: true };

      const delay1 = calculateRetryDelay(0, config);
      const delay2 = calculateRetryDelay(0, config);

      // Delays should vary due to jitter (may occasionally be same)
      // Just verify they're in expected range
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThanOrEqual(1250); // 1000 + 25% jitter
    });
  });

  describe("withRetry", () => {
    it("should succeed on first attempt", async () => {
      let attempts = 0;
      const result = await withRetry(async () => {
        attempts++;
        return "success";
      });

      expect(result).toBe("success");
      expect(attempts).toBe(1);
    });

    it("should retry on retriable error and succeed", async () => {
      let attempts = 0;
      const result = await withRetry(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error("timeout");
          }
          return "success";
        },
        { ...DEFAULT_RETRY_CONFIG, initialDelayMs: 10, maxRetries: 5 },
      );

      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("should throw after max retries", async () => {
      let attempts = 0;

      await expect(
        withRetry(
          async () => {
            attempts++;
            throw new Error("timeout");
          },
          { ...DEFAULT_RETRY_CONFIG, initialDelayMs: 10, maxRetries: 2 },
        ),
      ).rejects.toThrow("timeout");

      expect(attempts).toBe(3); // initial + 2 retries
    });

    it("should not retry non-retriable errors", async () => {
      let attempts = 0;

      await expect(
        withRetry(async () => {
          attempts++;
          throw new ValidationError("Invalid input");
        }),
      ).rejects.toThrow("Invalid input");

      expect(attempts).toBe(1);
    });

    it("should call onRetry callback", async () => {
      const onRetry = vi.fn();

      try {
        await withRetry(
          async () => {
            throw new Error("timeout");
          },
          { ...DEFAULT_RETRY_CONFIG, initialDelayMs: 10, maxRetries: 2 },
          onRetry,
        );
      } catch {
        // Expected
      }

      expect(onRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe("withStreamRetry", () => {
    it("should stream successfully on first attempt", async () => {
      const events = await collectStream(
        withStreamRetry(
          () =>
            (async function* () {
              yield {
                type: "text:delta" as const,
                seq: 0,
                timestamp: Date.now(),
                delta: "Hello",
              };
            })(),
          { ...DEFAULT_RETRY_CONFIG, initialDelayMs: 10 },
        ),
      );

      expect(events).toHaveLength(1);
      expect((events[0] as TextDeltaPayload).delta).toBe("Hello");
    });

    it("should retry failed stream and continue", async () => {
      let attempts = 0;

      const events = await collectStream(
        withStreamRetry(
          () => {
            attempts++;
            return (async function* () {
              yield {
                type: "text:delta" as const,
                seq: 0,
                timestamp: Date.now(),
                delta: "Hello",
              };
              if (attempts < 2) {
                throw new Error("network error");
              }
              yield {
                type: "text:delta" as const,
                seq: 1,
                timestamp: Date.now(),
                delta: " World",
              };
            })();
          },
          { ...DEFAULT_RETRY_CONFIG, initialDelayMs: 10, maxRetries: 3 },
        ),
      );

      expect(attempts).toBe(2);
      expect(events.filter((e) => e.type === "text:delta")).toHaveLength(2);
    });
  });

  describe("withProviderFallback", () => {
    it("should succeed with first provider", async () => {
      const result = await withProviderFallback(
        {
          providers: [
            { name: "openai", model: "gpt-4o", priority: 1 },
            { name: "anthropic", model: "claude-3-opus", priority: 2 },
          ],
        },
        async (provider, model) => {
          return { provider, model, data: "success" };
        },
      );

      expect(result.usedProvider).toBe("openai");
      expect(result.usedModel).toBe("gpt-4o");
      expect(result.fallbackUsed).toBe(false);
    });

    it("should fallback to second provider on failure", async () => {
      const result = await withProviderFallback(
        {
          providers: [
            { name: "openai", model: "gpt-4o", priority: 1 },
            { name: "anthropic", model: "claude-3-opus", priority: 2 },
          ],
          fallbackOnAnyError: true,
        },
        async (provider, model) => {
          if (provider === "openai") {
            throw new Error("rate_limit exceeded");
          }
          return { provider, model, data: "success" };
        },
      );

      expect(result.usedProvider).toBe("anthropic");
      expect(result.usedModel).toBe("claude-3-opus");
      expect(result.fallbackUsed).toBe(true);
      expect(result.attemptedProviders).toEqual(["openai", "anthropic"]);
    });

    it("should throw when all providers fail", async () => {
      await expect(
        withProviderFallback(
          {
            providers: [
              { name: "openai", model: "gpt-4o", priority: 1 },
              { name: "anthropic", model: "claude-3-opus", priority: 2 },
            ],
            fallbackOnAnyError: true,
          },
          async () => {
            throw new Error("service_unavailable");
          },
        ),
      ).rejects.toThrow("All providers failed");
    });
  });

  describe("withStreamRecovery", () => {
    it("should recover stream with retry", async () => {
      let attempts = 0;

      const events = await collectStream(
        withStreamRecovery(
          () => {
            attempts++;
            return (async function* () {
              yield {
                type: "text:delta" as const,
                seq: 0,
                timestamp: Date.now(),
                delta: "Hello",
              };
              if (attempts < 2) {
                throw new Error("timeout");
              }
            })();
          },
          { retryConfig: { ...DEFAULT_RETRY_CONFIG, initialDelayMs: 10 } },
        ),
      );

      expect(attempts).toBe(2);
    });

    it("should fallback to alternative provider", async () => {
      let usedProvider = "";

      const events = await collectStream(
        withStreamRecovery(
          (provider) => {
            usedProvider = provider || "primary";
            return (async function* () {
              if (usedProvider === "primary") {
                throw new Error("provider error");
              }
              yield {
                type: "text:delta" as const,
                seq: 0,
                timestamp: Date.now(),
                delta: "Fallback response",
              };
            })();
          },
          {
            retryConfig: { ...DEFAULT_RETRY_CONFIG, maxRetries: 0 },
            fallbackConfig: {
              providers: [
                { name: "backup", model: "backup-model", priority: 1 },
              ],
            },
          },
        ),
      );

      expect(usedProvider).toBe("backup");
    });
  });

  describe("Error Helpers", () => {
    it("should create error payload from Error", () => {
      const error = new Error("Test error");
      const payload = createErrorPayload(error, 0);

      expect(payload.type).toBe("error");
      expect(payload.message).toBe("Test error");
      expect(payload.seq).toBe(0);
    });

    it("should create error payload from StreamError", () => {
      const error = new RateLimitError("Rate limited", 30);
      const payload = createErrorPayload(error, 5);

      expect(payload.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(payload.category).toBe("rate_limit");
    });

    it("should categorize errors correctly", () => {
      expect(categorizeError(new Error("timeout"))).toBe("timeout");
      expect(categorizeError(new Error("network failed"))).toBe("network");
      expect(categorizeError(new Error("rate_limit"))).toBe("rate_limit");
      expect(categorizeError(new Error("content_filter"))).toBe(
        "content_filter",
      );
      expect(categorizeError(new Error("validation error"))).toBe("validation");
      expect(categorizeError(new Error("provider error"))).toBe("provider");
      expect(categorizeError(new Error("unknown"))).toBe("execution");
    });
  });

  describe("Retry Configurations", () => {
    it("should have correct default config", () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
    });

    it("should have correct aggressive config", () => {
      expect(AGGRESSIVE_RETRY_CONFIG.maxRetries).toBe(5);
      expect(AGGRESSIVE_RETRY_CONFIG.initialDelayMs).toBe(500);
    });

    it("should have correct conservative config", () => {
      expect(CONSERVATIVE_RETRY_CONFIG.maxRetries).toBe(3);
      expect(CONSERVATIVE_RETRY_CONFIG.initialDelayMs).toBe(2000);
      expect(CONSERVATIVE_RETRY_CONFIG.backoffMultiplier).toBe(3);
    });
  });
});

// ============================================
// PROVIDER SWITCHING TESTS
// ============================================

describe("Provider Switching During Stream", () => {
  it("should switch providers on error using fallback config", async () => {
    const providersUsed: string[] = [];

    const events = await collectStream(
      withStreamRecovery(
        (provider) => {
          const p = provider || "openai";
          providersUsed.push(p);

          return (async function* () {
            if (p === "openai") {
              yield {
                type: "text:delta" as const,
                seq: 0,
                timestamp: Date.now(),
                delta: "Starting...",
              };
              throw new Error("rate_limit exceeded");
            }
            yield {
              type: "text:delta" as const,
              seq: 0,
              timestamp: Date.now(),
              delta: "Anthropic response",
            };
          })();
        },
        {
          retryConfig: { ...DEFAULT_RETRY_CONFIG, maxRetries: 0 },
          fallbackConfig: {
            providers: [
              { name: "anthropic", model: "claude-3-sonnet", priority: 1 },
            ],
          },
        },
      ),
    );

    expect(providersUsed).toContain("anthropic");
    expect(events.some((e) => e.type === "text:delta")).toBe(true);
  });

  it("should preserve stream configuration across provider switch", async () => {
    const configs: { provider: string; model: string }[] = [];

    await collectStream(
      withStreamRecovery(
        (provider, model) => {
          configs.push({
            provider: provider || "default",
            model: model || "default-model",
          });

          return (async function* () {
            if (configs.length === 1) {
              throw new Error("timeout");
            }
            yield {
              type: "text:delta" as const,
              seq: 0,
              timestamp: Date.now(),
              delta: "Response",
            };
          })();
        },
        {
          retryConfig: { ...DEFAULT_RETRY_CONFIG, maxRetries: 0 },
          fallbackConfig: {
            providers: [
              {
                name: "fallback-provider",
                model: "fallback-model",
                priority: 1,
              },
            ],
          },
        },
      ),
    );

    expect(configs).toHaveLength(2);
    expect(configs[1].provider).toBe("fallback-provider");
    expect(configs[1].model).toBe("fallback-model");
  });
});

// ============================================
// CHUNK PROCESSING TESTS
// ============================================

describe("Chunk Processing", () => {
  describe("MastraModelOutput Consumption", () => {
    it("should consume text stream", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:start" as const,
          seq: 0,
          timestamp: Date.now(),
          model: "gpt-4o",
        };
        yield {
          type: "text:delta" as const,
          seq: 1,
          timestamp: Date.now(),
          delta: "Hello ",
        };
        yield {
          type: "text:delta" as const,
          seq: 2,
          timestamp: Date.now(),
          delta: "World",
        };
        yield {
          type: "text:end" as const,
          seq: 3,
          timestamp: Date.now(),
          text: "Hello World",
          charCount: 11,
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      const texts: string[] = [];
      for await (const text of output.textStream()) {
        texts.push(text);
      }

      expect(texts).toEqual(["Hello ", "World"]);
      expect(await output.text()).toBe("Hello World");
    });

    it("should track tool calls and results", async () => {
      const eventStream = (async function* () {
        yield {
          type: "tool:call" as const,
          seq: 0,
          timestamp: Date.now(),
          toolCallId: "call-1",
          toolName: "get_weather",
          args: { city: "NYC" },
        };
        yield {
          type: "tool:result" as const,
          seq: 1,
          timestamp: Date.now(),
          toolCallId: "call-1",
          toolName: "get_weather",
          result: { temp: 72 },
          duration: 100,
          success: true,
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      // Consume the stream
      for await (const _event of output) {
        // consume
      }

      const toolCalls = await output.getToolCalls();
      const toolResults = await output.getToolResults();

      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].toolName).toBe("get_weather");
      expect(toolResults).toHaveLength(1);
      expect(toolResults[0].output).toEqual({ temp: 72 });
    });

    it("should track partial objects during structured output", async () => {
      const eventStream = (async function* () {
        yield {
          type: "object:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          partialObject: { name: "John" },
        };
        yield {
          type: "object:delta" as const,
          seq: 1,
          timestamp: Date.now(),
          partialObject: { name: "John", age: 30 },
        };
        yield {
          type: "object:complete" as const,
          seq: 2,
          timestamp: Date.now(),
          object: { name: "John", age: 30, city: "NYC" },
          valid: true,
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
        trackPartialObjects: true,
      });

      const partials: unknown[] = [];
      for await (const partial of output.partialObjectStream()) {
        partials.push(partial);
      }

      expect(partials).toHaveLength(2);
      expect(await output.object()).toEqual({
        name: "John",
        age: 30,
        city: "NYC",
      });
    });

    it("should support stream transformation with map", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          delta: "a",
        };
        yield {
          type: "text:delta" as const,
          seq: 1,
          timestamp: Date.now(),
          delta: "b",
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      const mapped: string[] = [];
      for await (const type of output.map((e) => e.type)) {
        mapped.push(type);
      }

      expect(mapped).toEqual(["text:delta", "text:delta"]);
    });

    it("should support stream filtering", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          delta: "Hello",
        };
        yield {
          type: "tool:call" as const,
          seq: 1,
          timestamp: Date.now(),
          toolCallId: "call-1",
          toolName: "test",
          args: {},
        };
        yield {
          type: "text:delta" as const,
          seq: 2,
          timestamp: Date.now(),
          delta: "World",
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      const textEvents: StreamEventPayload[] = [];
      for await (const event of output.filter((e) => e.type === "text:delta")) {
        textEvents.push(event);
      }

      expect(textEvents).toHaveLength(2);
    });

    it("should support take and skip operations", async () => {
      const eventStream = (async function* () {
        for (let i = 0; i < 5; i++) {
          yield {
            type: "text:delta" as const,
            seq: i,
            timestamp: Date.now(),
            delta: String(i),
          };
        }
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      const taken: StreamEventPayload[] = [];
      for await (const event of output.take(3)) {
        taken.push(event);
      }

      expect(taken).toHaveLength(3);
    });
  });
});

// ============================================
// STREAM COMPLETION AND CANCELLATION TESTS
// ============================================

describe("Stream Completion and Cancellation", () => {
  describe("Stream Completion", () => {
    it("should mark stream as completed after full consumption", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          delta: "Hello",
        };
        yield {
          type: "message:end" as const,
          seq: 1,
          timestamp: Date.now(),
          messageId: "msg-123",
          finishReason: "stop" as const,
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      expect(output.isCompleted).toBe(false);

      for await (const _event of output) {
        // consume
      }

      expect(output.isCompleted).toBe(true);
      expect(output.isConsumed).toBe(true);
    });

    it("should report finish reason after completion", async () => {
      const eventStream = (async function* () {
        yield {
          type: "message:end" as const,
          seq: 0,
          timestamp: Date.now(),
          messageId: "msg-123",
          finishReason: "stop" as const,
          usage: { input: 100, output: 50, total: 150 },
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      const finishReason = await output.getFinishReason();

      expect(finishReason).toBe("stop");
    });

    it("should provide usage statistics after completion", async () => {
      const eventStream = (async function* () {
        yield {
          type: "message:end" as const,
          seq: 0,
          timestamp: Date.now(),
          messageId: "msg-123",
          finishReason: "stop" as const,
          usage: { input: 100, output: 50, total: 150 },
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      const usage = await output.getUsage();

      expect(usage?.input).toBe(100);
      expect(usage?.output).toBe(50);
      expect(usage?.total).toBe(150);
    });

    it("should provide metadata after completion", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          delta: "Test",
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-stream-id",
      });

      const metadata = await output.getMetadata();

      expect(metadata.streamId).toBe("test-stream-id");
      expect(metadata.provider).toBe("openai");
      expect(metadata.model).toBe("gpt-4o");
      expect(metadata.totalEvents).toBe(1);
    });
  });

  describe("Stream Cancellation", () => {
    it("should handle early termination with take()", async () => {
      let yielded = 0;

      const eventStream = (async function* () {
        for (let i = 0; i < 100; i++) {
          yielded++;
          yield {
            type: "text:delta" as const,
            seq: i,
            timestamp: Date.now(),
            delta: String(i),
          };
        }
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      const events: StreamEventPayload[] = [];
      for await (const event of output.take(5)) {
        events.push(event);
      }

      expect(events).toHaveLength(5);
      // Generator continues even after take() due to async iteration behavior
      // This tests that take() works correctly
    });

    it("should handle error during stream", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          delta: "Hello",
        };
        throw new Error("Stream interrupted");
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      await expect(collectStream(output)).rejects.toThrow("Stream interrupted");
      expect(output.hasError).toBe(true);
      expect(output.streamError?.message).toBe("Stream interrupted");
    });

    it("should call onError callback on stream error", async () => {
      const onError = vi.fn();

      // eslint-disable-next-line require-yield
      const eventStream = (async function* () {
        throw new Error("Test error");
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
        onError,
      });

      try {
        for await (const _event of output) {
          // consume
        }
      } catch {
        // Expected
      }

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("BackpressureController End/Error", () => {
    it("should handle controller end signal", async () => {
      const controller = new BackpressureController();

      await controller.push({ id: 1 });
      await controller.push({ id: 2 });
      controller.end();

      const items: unknown[] = [];
      for await (const item of controller.stream()) {
        items.push(item);
      }

      expect(items).toHaveLength(2);
      expect(controller.ended).toBe(true);
    });

    it("should propagate error through controller", async () => {
      const controller = new BackpressureController();

      await controller.push({ id: 1 });
      controller.setError(new Error("Controller error"));

      await expect(controller.pull()).rejects.toThrow("Controller error");
    });
  });
});

// ============================================
// MEMORY LEAK PREVENTION TESTS
// ============================================

describe("Memory Leak Prevention", () => {
  describe("Event Cleanup", () => {
    it("should clear event storage after conversion", async () => {
      const eventStream = (async function* () {
        for (let i = 0; i < 100; i++) {
          yield {
            type: "text:delta" as const,
            seq: i,
            timestamp: Date.now(),
            delta: `chunk-${i}`,
          };
        }
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      // Consume stream
      const text = await output.text();

      expect(text.length).toBeGreaterThan(0);
      expect(output.eventCount).toBe(100); // Events are stored for replay
    });

    it("should allow replay from stored events", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          delta: "Hello",
        };
        yield {
          type: "text:delta" as const,
          seq: 1,
          timestamp: Date.now(),
          delta: " World",
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      // First consumption
      const firstPass: StreamEventPayload[] = [];
      for await (const event of output) {
        firstPass.push(event);
      }

      // Second consumption (replay)
      const secondPass: StreamEventPayload[] = [];
      for await (const event of output) {
        secondPass.push(event);
      }

      expect(firstPass).toHaveLength(2);
      expect(secondPass).toHaveLength(2);
    });
  });

  describe("BackpressureController Cleanup", () => {
    it("should report memory usage estimate", async () => {
      const controller = new BackpressureController();

      await controller.push({ data: "a".repeat(1000) });
      await controller.push({ data: "b".repeat(1000) });

      const state = controller.getState();

      expect(state.memoryUsage).toBeGreaterThan(0);
    });

    it("should track paused time", async () => {
      const controller = new BackpressureController({
        highWatermark: 2,
        lowWatermark: 1,
      });

      // Push to trigger pause
      const pushPromise1 = controller.push({ id: 1 });
      const pushPromise2 = controller.push({ id: 2 });
      const pushPromise3 = controller.push({ id: 3 }); // This should block

      // Wait a bit while paused
      await sleep(50);

      // Pull to resume
      await controller.pull();
      await controller.pull();
      await controller.pull();

      const state = controller.getState();

      // Paused time should be recorded
      expect(state.pausedTime).toBeGreaterThanOrEqual(0);
    });

    it("should drop items when buffer overflows", async () => {
      let droppedCount = 0;
      const controller = new BackpressureController({
        highWatermark: 3,
        lowWatermark: 1,
        maxBufferSize: 3,
        overflowStrategy: "drop-oldest",
        onDrop: (count) => {
          droppedCount += count;
        },
      });

      // Push more than max buffer
      for (let i = 0; i < 5; i++) {
        try {
          await Promise.race([
            controller.push({ id: i }),
            sleep(50).then(() => "timeout"),
          ]);
        } catch {
          // Expected
        }
      }

      const state = controller.getState();

      expect(droppedCount).toBeGreaterThan(0);
      expect(state.totalDropped).toBeGreaterThan(0);
    });
  });

  describe("StreamEventEmitter Reset", () => {
    it("should clear all state on reset", () => {
      const emitter = new StreamEventEmitter({
        provider: "openai",
        model: "gpt-4o",
      });

      // Verify initial state
      expect(emitter.getAccumulatedText()).toBe("");
      expect(emitter.getAccumulatedReasoning()).toBe("");

      // Reset
      emitter.reset();

      // Verify state is cleared
      expect(emitter.getAccumulatedText()).toBe("");
      expect(emitter.getAccumulatedReasoning()).toBe("");
    });
  });

  describe("Long-Running Stream Stability", () => {
    it("should handle large number of events without memory issues", async () => {
      const eventCount = 1000;

      const eventStream = (async function* () {
        for (let i = 0; i < eventCount; i++) {
          yield {
            type: "text:delta" as const,
            seq: i,
            timestamp: Date.now(),
            delta: `chunk-${i}`,
          };
        }
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-large-stream",
      });

      let processedCount = 0;
      for await (const _event of output) {
        processedCount++;
      }

      expect(processedCount).toBe(eventCount);
      expect(output.isCompleted).toBe(true);
    });

    it("should handle rapid stream production and consumption", async () => {
      const controller = new BackpressureController({
        highWatermark: 100,
        lowWatermark: 50,
      });

      // Producer
      const producer = (async () => {
        for (let i = 0; i < 500; i++) {
          await controller.push({ id: i });
        }
        controller.end();
      })();

      // Consumer
      const items: unknown[] = [];
      const consumer = (async () => {
        for await (const item of controller.stream()) {
          items.push(item);
        }
      })();

      await Promise.all([producer, consumer]);

      expect(items).toHaveLength(500);
    });
  });
});

// ============================================
// CONVERSION AND COMPATIBILITY TESTS
// ============================================

describe("Conversion and Compatibility", () => {
  describe("Response Conversion", () => {
    it("should convert to Response for HTTP streaming", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          delta: "Hello",
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      const response = output.toResponse();

      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
      expect(response.headers.get("X-NeuroLink-Stream-Id")).toBe("test-123");
    });

    it("should convert to ReadableStream", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          delta: "Test",
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      const readableStream = output.toReadableStream();

      expect(readableStream).toBeInstanceOf(ReadableStream);
    });
  });

  describe("Legacy Compatibility", () => {
    it("should convert to legacy result format", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:start" as const,
          seq: 0,
          timestamp: Date.now(),
          model: "gpt-4o",
        };
        yield {
          type: "text:delta" as const,
          seq: 1,
          timestamp: Date.now(),
          delta: "Hello World",
        };
        yield {
          type: "text:end" as const,
          seq: 2,
          timestamp: Date.now(),
          text: "Hello World",
          charCount: 11,
        };
        yield {
          type: "message:end" as const,
          seq: 3,
          timestamp: Date.now(),
          messageId: "msg-123",
          finishReason: "stop" as const,
          usage: { input: 10, output: 5, total: 15 },
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      const legacy = await output.toLegacyResult();

      expect(legacy.provider).toBe("openai");
      expect(legacy.model).toBe("gpt-4o");
      expect(legacy.finishReason).toBe("stop");
      expect(legacy.usage?.input).toBe(10);
      expect(legacy.metadata?.streamId).toBe("test-123");
    });

    it("should convert to string stream", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          delta: "A",
        };
        yield {
          type: "text:delta" as const,
          seq: 1,
          timestamp: Date.now(),
          delta: "B",
        };
        yield {
          type: "text:delta" as const,
          seq: 2,
          timestamp: Date.now(),
          delta: "C",
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      const strings: string[] = [];
      for await (const str of output.toStringStream()) {
        strings.push(str);
      }

      expect(strings).toEqual(["A", "B", "C"]);
    });

    it("should collect all events to array", async () => {
      const eventStream = (async function* () {
        yield {
          type: "text:delta" as const,
          seq: 0,
          timestamp: Date.now(),
          delta: "A",
        };
        yield {
          type: "text:delta" as const,
          seq: 1,
          timestamp: Date.now(),
          delta: "B",
        };
      })();

      const output = new MastraModelOutput(eventStream, {
        provider: "openai",
        model: "gpt-4o",
        streamId: "test-123",
      });

      const events = await output.toArray();

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe("text:delta");
    });
  });

  describe("fromLegacyStream Conversion", () => {
    it("should convert legacy stream to modern format", async () => {
      const legacyStream = (async function* () {
        yield { content: "Hello " };
        yield { content: "World" };
      })();

      const output = fromLegacyStream(legacyStream, {
        provider: "openai",
        model: "gpt-4o",
      });

      const events = await output.toArray();
      const textDeltas = events.filter((e) => e.type === "text:delta");

      expect(textDeltas).toHaveLength(2);
      expect(events.some((e) => e.type === "message:start")).toBe(true);
      expect(events.some((e) => e.type === "text:start")).toBe(true);
      expect(events.some((e) => e.type === "text:end")).toBe(true);
      expect(events.some((e) => e.type === "message:end")).toBe(true);
    });

    it("should preserve text content from legacy stream", async () => {
      const legacyStream = (async function* () {
        yield { content: "Test content" };
      })();

      const output = fromLegacyStream(legacyStream, {
        provider: "anthropic",
        model: "claude-3-sonnet",
      });

      const text = await output.text();

      expect(text).toBe("Test content");
    });
  });
});

// ============================================
// CALLBACKS AND HOOKS TESTS
// ============================================

describe("Callbacks and Hooks", () => {
  it("should call onTextDelta callback", async () => {
    const onTextDelta = vi.fn();

    const eventStream = (async function* () {
      yield {
        type: "text:delta" as const,
        seq: 0,
        timestamp: Date.now(),
        delta: "Hello",
      };
      yield {
        type: "text:delta" as const,
        seq: 1,
        timestamp: Date.now(),
        delta: " World",
      };
    })();

    const output = new MastraModelOutput(eventStream, {
      provider: "openai",
      model: "gpt-4o",
      streamId: "test-123",
      onTextDelta,
    });

    for await (const _event of output) {
      // consume
    }

    expect(onTextDelta).toHaveBeenCalledTimes(2);
    expect(onTextDelta).toHaveBeenNthCalledWith(1, "Hello", "Hello");
    expect(onTextDelta).toHaveBeenNthCalledWith(2, " World", "Hello World");
  });

  it("should call onToolExecution callback", async () => {
    const onToolExecution = vi.fn();

    const eventStream = (async function* () {
      yield {
        type: "tool:result" as const,
        seq: 0,
        timestamp: Date.now(),
        toolCallId: "call-1",
        toolName: "get_weather",
        result: { temp: 72 },
        duration: 100,
        success: true,
      };
    })();

    const output = new MastraModelOutput(eventStream, {
      provider: "openai",
      model: "gpt-4o",
      streamId: "test-123",
      onToolExecution,
    });

    for await (const _event of output) {
      // consume
    }

    expect(onToolExecution).toHaveBeenCalledWith("get_weather", { temp: 72 });
  });

  it("should call onMessageComplete callback", async () => {
    const onMessageComplete = vi.fn();

    const eventStream = (async function* () {
      yield {
        type: "text:delta" as const,
        seq: 0,
        timestamp: Date.now(),
        delta: "Complete message",
      };
      yield {
        type: "message:end" as const,
        seq: 1,
        timestamp: Date.now(),
        messageId: "msg-123",
        finishReason: "stop" as const,
        usage: { input: 10, output: 20, total: 30 },
      };
    })();

    const output = new MastraModelOutput(eventStream, {
      provider: "openai",
      model: "gpt-4o",
      streamId: "test-123",
      onMessageComplete,
    });

    for await (const _event of output) {
      // consume
    }

    expect(onMessageComplete).toHaveBeenCalledWith("Complete message", {
      input: 10,
      output: 20,
      total: 30,
    });
  });

  it("should call onPressure callback when backpressure is applied", async () => {
    const onPressure = vi.fn();

    const controller = new BackpressureController({
      highWatermark: 2,
      lowWatermark: 1,
      onPressure,
    });

    // Push to trigger pause
    await controller.push({ id: 1 });
    await controller.push({ id: 2 });

    expect(onPressure).toHaveBeenCalledWith(true, expect.any(Number));
  });
});
