/**
 * Tests for MastraModelOutput
 *
 * Tests Pattern 2: Specialized Output Classes
 * - Instantiation and configuration
 * - Event streams (textStream, toolResultStream, etc.)
 * - Promise-based accessors
 * - Piping and transformation
 * - Response conversion
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  MastraModelOutput,
  createMastraModelOutput,
  createMastraModelOutputFromArray,
  createEventStreamFromText,
  type MastraModelOutputConfig,
} from "../../src/lib/core/stream/MastraModelOutput.js";
import type { StreamEventPayload } from "../../src/lib/types/streamEventTypes.js";

// Helper to create test events
function createTestEvents(): StreamEventPayload[] {
  const now = Date.now();
  return [
    {
      type: "message:start",
      seq: 1,
      timestamp: now,
      role: "assistant",
      messageId: "msg-1",
      provider: "test-provider",
      model: "test-model",
    },
    {
      type: "text:start",
      seq: 2,
      timestamp: now + 1,
      model: "test-model",
    },
    {
      type: "text:delta",
      seq: 3,
      timestamp: now + 2,
      delta: "Hello ",
      accumulated: "Hello ",
    },
    {
      type: "text:delta",
      seq: 4,
      timestamp: now + 3,
      delta: "World!",
      accumulated: "Hello World!",
    },
    {
      type: "text:end",
      seq: 5,
      timestamp: now + 4,
      text: "Hello World!",
      charCount: 12,
      wordCount: 2,
    },
    {
      type: "message:end",
      seq: 6,
      timestamp: now + 5,
      messageId: "msg-1",
      finishReason: "stop",
      usage: { input: 10, output: 5, total: 15 },
    },
  ];
}

// Helper to create events with tool calls
function createEventsWithTools(): StreamEventPayload[] {
  const now = Date.now();
  return [
    {
      type: "message:start",
      seq: 1,
      timestamp: now,
      role: "assistant",
      messageId: "msg-1",
    },
    {
      type: "tool:call",
      seq: 2,
      timestamp: now + 1,
      toolCallId: "tc-1",
      toolName: "getWeather",
      args: { city: "NYC" },
    },
    {
      type: "tool:result",
      seq: 3,
      timestamp: now + 2,
      toolCallId: "tc-1",
      toolName: "getWeather",
      result: { temp: 72, condition: "sunny" },
      duration: 100,
      success: true,
    },
    {
      type: "text:delta",
      seq: 4,
      timestamp: now + 3,
      delta: "The weather is sunny.",
    },
    {
      type: "message:end",
      seq: 5,
      timestamp: now + 4,
      messageId: "msg-1",
      finishReason: "stop",
    },
  ];
}

describe("MastraModelOutput", () => {
  const defaultConfig: MastraModelOutputConfig = {
    provider: "test-provider",
    model: "test-model",
    streamId: "stream-123",
  };

  describe("Instantiation", () => {
    it("should create instance with factory function", async () => {
      const events = createTestEvents();
      const stream = (async function* () {
        for (const e of events) {
          yield e;
        }
      })();

      const output = createMastraModelOutput(stream, defaultConfig);

      expect(output.provider).toBe("test-provider");
      expect(output.model).toBe("test-model");
      expect(output.streamId).toBe("stream-123");
    });

    it("should create instance from array", async () => {
      const events = createTestEvents();
      const output = createMastraModelOutputFromArray(events, defaultConfig);

      expect(output.isConsumed).toBe(false);
      expect(output.isCompleted).toBe(false);
    });

    it("should track initial state correctly", () => {
      const output = createMastraModelOutputFromArray([], defaultConfig);

      expect(output.currentText).toBe("");
      expect(output.currentReasoning).toBe("");
      expect(output.currentPartialObject).toBeNull();
      expect(output.hasError).toBe(false);
      expect(output.streamError).toBeNull();
    });
  });

  describe("Event Stream Iteration", () => {
    it("should iterate over all events", async () => {
      const events = createTestEvents();
      const output = createMastraModelOutputFromArray(events, defaultConfig);

      const collected: StreamEventPayload[] = [];
      for await (const event of output) {
        collected.push(event);
      }

      expect(collected).toHaveLength(events.length);
      expect(output.isConsumed).toBe(true);
      expect(output.isCompleted).toBe(true);
    });

    it("should throw if consumed twice without replay", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      // First consumption
      for await (const _ of output) {
        // consume
      }

      // Second consumption should throw
      await expect(async () => {
        for await (const _ of output) {
          // should throw
        }
      }).rejects.toThrow("Stream has already been consumed");
    });

    it("should allow multiple iterations with replay mode", async () => {
      const events = createTestEvents();
      const output = createMastraModelOutputFromArray(events, defaultConfig);
      output.enableReplayMode();

      // First consumption
      const first: StreamEventPayload[] = [];
      for await (const event of output) {
        first.push(event);
      }

      // Second consumption should work
      const second: StreamEventPayload[] = [];
      for await (const event of output) {
        second.push(event);
      }

      expect(first).toHaveLength(events.length);
      expect(second).toHaveLength(events.length);
    });
  });

  describe("Text Stream", () => {
    it("should stream only text deltas", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      const text: string[] = [];
      for await (const chunk of output.textStream()) {
        text.push(chunk);
      }

      expect(text).toEqual(["Hello ", "World!"]);
    });

    it("should stream text deltas with metadata", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      const deltas: Array<{ delta: string; accumulated?: string }> = [];
      for await (const event of output.textDeltaStream()) {
        deltas.push({ delta: event.delta, accumulated: event.accumulated });
      }

      expect(deltas).toHaveLength(2);
      expect(deltas[0].delta).toBe("Hello ");
      expect(deltas[1].accumulated).toBe("Hello World!");
    });
  });

  describe("Tool Streams", () => {
    it("should stream tool calls", async () => {
      const output = createMastraModelOutputFromArray(
        createEventsWithTools(),
        defaultConfig,
      );

      const calls: Array<{ toolName: string; args: unknown }> = [];
      for await (const event of output.toolCallStream()) {
        calls.push({ toolName: event.toolName, args: event.args });
      }

      expect(calls).toHaveLength(1);
      expect(calls[0].toolName).toBe("getWeather");
      expect(calls[0].args).toEqual({ city: "NYC" });
    });

    it("should stream tool results", async () => {
      const output = createMastraModelOutputFromArray(
        createEventsWithTools(),
        defaultConfig,
      );

      const results: Array<{
        toolName: string;
        result: unknown;
        success: boolean;
      }> = [];
      for await (const event of output.toolResultStream()) {
        results.push({
          toolName: event.toolName,
          result: event.result,
          success: event.success,
        });
      }

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].result).toEqual({ temp: 72, condition: "sunny" });
    });
  });

  describe("Promise-Based Accessors", () => {
    it("should return final text after consumption", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      const text = await output.text();
      expect(text).toBe("Hello World!");
    });

    it("should return usage after consumption", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      const usage = await output.getUsage();
      expect(usage).toEqual({ input: 10, output: 5, total: 15 });
    });

    it("should return finish reason", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      const reason = await output.getFinishReason();
      expect(reason).toBe("stop");
    });

    it("should return tool calls and results", async () => {
      const output = createMastraModelOutputFromArray(
        createEventsWithTools(),
        defaultConfig,
      );

      const toolCalls = await output.getToolCalls();
      const toolResults = await output.getToolResults();

      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].toolName).toBe("getWeather");

      expect(toolResults).toHaveLength(1);
      expect(toolResults[0].status).toBe("success");
    });

    it("should return event count", async () => {
      const events = createTestEvents();
      const output = createMastraModelOutputFromArray(events, defaultConfig);

      const count = await output.getEventCount();
      expect(count).toBe(events.length);
    });

    it("should return response time", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      // Add a small delay
      await new Promise((r) => setTimeout(r, 10));

      const responseTime = await output.getResponseTime();
      expect(responseTime).toBeGreaterThan(0);
    });
  });

  describe("Callbacks", () => {
    it("should call onMessageComplete callback", async () => {
      const onMessageComplete = vi.fn();
      const output = createMastraModelOutputFromArray(createTestEvents(), {
        ...defaultConfig,
        onMessageComplete,
      });

      for await (const _ of output) {
        // consume
      }

      expect(onMessageComplete).toHaveBeenCalledWith(
        "Hello World!",
        expect.objectContaining({ total: 15 }),
      );
    });

    it("should call onToolExecution callback", async () => {
      const onToolExecution = vi.fn();
      const output = createMastraModelOutputFromArray(createEventsWithTools(), {
        ...defaultConfig,
        onToolExecution,
      });

      for await (const _ of output) {
        // consume
      }

      expect(onToolExecution).toHaveBeenCalledWith("getWeather", {
        temp: 72,
        condition: "sunny",
      });
    });

    it("should call onTextDelta callback for each delta", async () => {
      const onTextDelta = vi.fn();
      const output = createMastraModelOutputFromArray(createTestEvents(), {
        ...defaultConfig,
        onTextDelta,
      });

      for await (const _ of output) {
        // consume
      }

      expect(onTextDelta).toHaveBeenCalledTimes(2);
      expect(onTextDelta).toHaveBeenNthCalledWith(1, "Hello ", "Hello ");
      expect(onTextDelta).toHaveBeenNthCalledWith(2, "World!", "Hello World!");
    });

    it("should call onError on stream error", async () => {
      const onError = vi.fn();
      const failingStream = (async function* () {
        yield createTestEvents()[0];
        throw new Error("Stream failed");
      })();

      const output = new MastraModelOutput(failingStream, {
        ...defaultConfig,
        onError,
      });

      await expect(async () => {
        for await (const _ of output) {
          // consume
        }
      }).rejects.toThrow("Stream failed");

      expect(onError).toHaveBeenCalled();
      expect(output.hasError).toBe(true);
      expect(output.streamError?.message).toBe("Stream failed");
    });
  });

  describe("Piping and Transformation", () => {
    it("should map events", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      const types: string[] = [];
      for await (const type of output.map((e) => e.type)) {
        types.push(type);
      }

      expect(types).toContain("text:delta");
      expect(types).toContain("message:end");
    });

    it("should filter events", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      const textEvents: StreamEventPayload[] = [];
      for await (const event of output.filter((e) =>
        e.type.startsWith("text:"),
      )) {
        textEvents.push(event);
      }

      expect(textEvents).toHaveLength(4); // start, 2 deltas, end
      expect(textEvents.every((e) => e.type.startsWith("text:"))).toBe(true);
    });

    it("should collect all events", async () => {
      const events = createTestEvents();
      const output = createMastraModelOutputFromArray(events, defaultConfig);

      const collected = await output.collect();
      expect(collected).toHaveLength(events.length);
    });

    it("should reduce events", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      const charCount = await output.reduce(
        (acc, e) =>
          acc +
          (e.type === "text:delta" ? (e as { delta: string }).delta.length : 0),
        0,
      );

      expect(charCount).toBe(12); // "Hello " + "World!"
    });
  });

  describe("Response Conversion", () => {
    it("should convert to Response object", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      const response = output.toResponse();

      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
      expect(response.headers.get("X-NeuroLink-Stream-Id")).toBe("stream-123");
    });

    it("should convert to ReadableStream", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      const readable = output.toReadableStream();
      expect(readable).toBeInstanceOf(ReadableStream);
    });

    it("should convert to text ReadableStream", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      const textStream = output.toTextReadableStream();
      expect(textStream).toBeInstanceOf(ReadableStream);

      const reader = textStream.getReader();
      const chunks: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        chunks.push(value);
      }

      expect(chunks.join("")).toBe("Hello World!");
    });

    it("should convert to legacy result format", async () => {
      const output = createMastraModelOutputFromArray(
        createTestEvents(),
        defaultConfig,
      );

      const legacy = await output.toLegacyResult();

      expect(legacy.provider).toBe("test-provider");
      expect(legacy.model).toBe("test-model");
      expect(legacy.stream).toBeDefined();
    });
  });

  describe("Event Stream from Text", () => {
    it("should create event stream from text", async () => {
      const stream = createEventStreamFromText("Hello World", {
        provider: "test",
        model: "test-model",
        messageId: "msg-1",
        chunkSize: 5,
      });

      const events: StreamEventPayload[] = [];
      for await (const event of stream) {
        events.push(event);
      }

      // Should have message:start, text:start, deltas, text:end, message:end
      expect(events.length).toBeGreaterThan(4);
      expect(events[0].type).toBe("message:start");
      expect(events[events.length - 1].type).toBe("message:end");

      // Check text deltas
      const textDeltas = events.filter((e) => e.type === "text:delta");
      expect(textDeltas.length).toBeGreaterThanOrEqual(2);
    });
  });
});
