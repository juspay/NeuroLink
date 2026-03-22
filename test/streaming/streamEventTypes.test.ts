/**
 * Tests for Stream Event Types
 *
 * Tests Pattern 1: Fine-grained Event Types
 * - Type discrimination
 * - Sequence ordering
 * - Extended thinking events
 * - Structured output events
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  // Type guards
  isTextEvent,
  isToolEvent,
  isReasoningEvent,
  isMessageEvent,
  isObjectEvent,
  isStepEvent,
  isAudioEvent,
  isErrorEvent,
  isProgressEvent,
  isStreamControlEvent,
  isContentEvent,
  isStartEvent,
  isEndEvent,
  // Event creators
  resetSequenceCounter,
  getNextSequence,
  createBaseEvent,
  createTextStartEvent,
  createTextDeltaEvent,
  createTextEndEvent,
  createErrorEvent,
  createMessageStartEvent,
  createMessageEndEvent,
  createToolCallEvent,
  createToolResultEvent,
  createProgressEvent,
  // Constants
  STREAM_EVENT_TYPES,
  // Types
  type StreamEventPayload,
  type TextDeltaPayload,
  type ToolCallPayload,
  type ErrorPayload,
} from "../../src/lib/types/streamEventTypes.js";

describe("Stream Event Types", () => {
  beforeEach(() => {
    resetSequenceCounter();
  });

  describe("Type Discrimination", () => {
    it("should discriminate text events correctly", () => {
      const textStart = createTextStartEvent({ model: "gpt-4o" });
      const textDelta = createTextDeltaEvent("Hello");
      const textEnd = createTextEndEvent("Hello World");

      expect(isTextEvent(textStart)).toBe(true);
      expect(isTextEvent(textDelta)).toBe(true);
      expect(isTextEvent(textEnd)).toBe(true);

      // Should not match other event types
      const error = createErrorEvent("TEST_ERROR", "Test error");
      expect(isTextEvent(error)).toBe(false);
    });

    it("should discriminate tool events correctly", () => {
      const toolCall = createToolCallEvent("tc-1", "getWeather", {
        city: "NYC",
      });
      const toolResult = createToolResultEvent(
        "tc-1",
        "getWeather",
        { temp: 72 },
        100,
        true,
      );

      expect(isToolEvent(toolCall)).toBe(true);
      expect(isToolEvent(toolResult)).toBe(true);

      const textDelta = createTextDeltaEvent("Hello");
      expect(isToolEvent(textDelta)).toBe(false);
    });

    it("should discriminate error events correctly", () => {
      const error = createErrorEvent("NETWORK_ERROR", "Connection failed", {
        category: "network",
        retriable: true,
      });

      expect(isErrorEvent(error)).toBe(true);
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.category).toBe("network");
      expect(error.retriable).toBe(true);

      const textDelta = createTextDeltaEvent("Hello");
      expect(isErrorEvent(textDelta)).toBe(false);
    });

    it("should identify content events", () => {
      const textDelta = createTextDeltaEvent("Hello");
      expect(isContentEvent(textDelta)).toBe(true);

      const textStart = createTextStartEvent();
      expect(isContentEvent(textStart)).toBe(false);
    });

    it("should identify start and end events", () => {
      const textStart = createTextStartEvent();
      const textEnd = createTextEndEvent("Hello");
      const textDelta = createTextDeltaEvent("Hello");

      expect(isStartEvent(textStart)).toBe(true);
      expect(isEndEvent(textEnd)).toBe(true);
      expect(isStartEvent(textDelta)).toBe(false);
      expect(isEndEvent(textDelta)).toBe(false);
    });
  });

  describe("Sequence Ordering", () => {
    it("should generate monotonically increasing sequence numbers", () => {
      const seq1 = getNextSequence();
      const seq2 = getNextSequence();
      const seq3 = getNextSequence();

      expect(seq2).toBeGreaterThan(seq1);
      expect(seq3).toBeGreaterThan(seq2);
    });

    it("should reset sequence counter", () => {
      getNextSequence();
      getNextSequence();
      resetSequenceCounter();

      const seq = getNextSequence();
      expect(seq).toBe(1);
    });

    it("should assign correct sequence to created events", () => {
      resetSequenceCounter();

      const event1 = createTextStartEvent();
      const event2 = createTextDeltaEvent("Hello");
      const event3 = createTextEndEvent("Hello");

      expect(event1.seq).toBe(1);
      expect(event2.seq).toBe(2);
      expect(event3.seq).toBe(3);
    });

    it("should include timestamp in events", () => {
      const before = Date.now();
      const event = createTextDeltaEvent("Hello");
      const after = Date.now();

      expect(event.timestamp).toBeGreaterThanOrEqual(before);
      expect(event.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("Extended Thinking Events", () => {
    it("should discriminate reasoning events", () => {
      const reasoningStart: StreamEventPayload = {
        type: "reasoning:start",
        seq: 1,
        timestamp: Date.now(),
        thinkingLevel: "high",
      };

      const reasoningDelta: StreamEventPayload = {
        type: "reasoning:delta",
        seq: 2,
        timestamp: Date.now(),
        delta: "Let me think...",
        phase: "analysis",
        stepNumber: 1,
      };

      const reasoningEnd: StreamEventPayload = {
        type: "reasoning:end",
        seq: 3,
        timestamp: Date.now(),
        reasoning: "After careful analysis...",
        reasoningTokens: 150,
        thoughtSignature: "abc123",
      };

      expect(isReasoningEvent(reasoningStart)).toBe(true);
      expect(isReasoningEvent(reasoningDelta)).toBe(true);
      expect(isReasoningEvent(reasoningEnd)).toBe(true);

      // Should not match other events
      expect(isReasoningEvent(createTextDeltaEvent("Hello"))).toBe(false);
    });
  });

  describe("Structured Output Events", () => {
    it("should discriminate object events", () => {
      const objectDelta: StreamEventPayload = {
        type: "object:delta",
        seq: 1,
        timestamp: Date.now(),
        partialObject: { name: "John" },
        currentPath: "$.name",
        jsonTextDelta: '"name": "John"',
      };

      const objectComplete: StreamEventPayload = {
        type: "object:complete",
        seq: 2,
        timestamp: Date.now(),
        object: { name: "John", age: 30 },
        valid: true,
      };

      expect(isObjectEvent(objectDelta)).toBe(true);
      expect(isObjectEvent(objectComplete)).toBe(true);
      expect(isObjectEvent(createTextDeltaEvent("Hello"))).toBe(false);
    });

    it("should include validation errors in object:complete", () => {
      const objectComplete: StreamEventPayload = {
        type: "object:complete",
        seq: 1,
        timestamp: Date.now(),
        object: { name: "John" },
        valid: false,
        validationErrors: ["Missing required field: age"],
      };

      expect(objectComplete.type).toBe("object:complete");
      if (objectComplete.type === "object:complete") {
        expect(objectComplete.valid).toBe(false);
        expect(objectComplete.validationErrors).toContain(
          "Missing required field: age",
        );
      }
    });
  });

  describe("Event Creation Utilities", () => {
    it("should create text:delta with accumulated text", () => {
      const delta = createTextDeltaEvent("World", {
        accumulated: "Hello World",
        offset: 6,
      });

      expect(delta.type).toBe("text:delta");
      expect(delta.delta).toBe("World");
      expect(delta.accumulated).toBe("Hello World");
      expect(delta.offset).toBe(6);
    });

    it("should create text:end with word count", () => {
      const end = createTextEndEvent("Hello World from NeuroLink");

      expect(end.type).toBe("text:end");
      expect(end.text).toBe("Hello World from NeuroLink");
      expect(end.charCount).toBe(26);
      expect(end.wordCount).toBe(4);
    });

    it("should create tool:call with arguments", () => {
      const toolCall = createToolCallEvent("tc-123", "searchWeb", {
        query: "weather NYC",
        limit: 5,
      });

      expect(toolCall.type).toBe("tool:call");
      expect(toolCall.toolCallId).toBe("tc-123");
      expect(toolCall.toolName).toBe("searchWeb");
      expect(toolCall.args).toEqual({ query: "weather NYC", limit: 5 });
    });

    it("should create tool:result with duration and success", () => {
      const result = createToolResultEvent(
        "tc-123",
        "searchWeb",
        { results: ["Result 1", "Result 2"] },
        250,
        true,
      );

      expect(result.type).toBe("tool:result");
      expect(result.toolCallId).toBe("tc-123");
      expect(result.duration).toBe(250);
      expect(result.success).toBe(true);
    });

    it("should create message events with proper fields", () => {
      const messageStart = createMessageStartEvent("msg-1", {
        provider: "openai",
        model: "gpt-4o",
        stepNumber: 1,
      });

      const messageEnd = createMessageEndEvent("msg-1", "stop", {
        content: "Hello!",
        usage: { input: 10, output: 5, total: 15 },
      });

      expect(messageStart.type).toBe("message:start");
      expect(messageStart.role).toBe("assistant");
      expect(messageStart.provider).toBe("openai");

      expect(messageEnd.type).toBe("message:end");
      expect(messageEnd.finishReason).toBe("stop");
      expect(messageEnd.usage?.total).toBe(15);
    });

    it("should create progress events", () => {
      const progress = createProgressEvent(1024, 10, 500, "streaming", {
        percent: 50,
        estimatedRemainingMs: 500,
      });

      expect(progress.type).toBe("progress");
      expect(progress.bytesReceived).toBe(1024);
      expect(progress.chunksReceived).toBe(10);
      expect(progress.elapsedMs).toBe(500);
      expect(progress.phase).toBe("streaming");
      expect(progress.percent).toBe(50);
    });
  });

  describe("All Event Types Coverage", () => {
    it("should have all expected event types defined", () => {
      const expectedTypes = [
        "text:start",
        "text:delta",
        "text:end",
        "tool:call:start",
        "tool:call:delta",
        "tool:call",
        "tool:execute:start",
        "tool:result",
        "reasoning:start",
        "reasoning:delta",
        "reasoning:end",
        "message:start",
        "message:end",
        "object:delta",
        "object:complete",
        "step:start",
        "step:end",
        "audio:start",
        "audio:delta",
        "audio:end",
        "error",
        "progress",
        "stream:paused",
        "stream:resumed",
      ];

      for (const type of expectedTypes) {
        expect(STREAM_EVENT_TYPES).toContain(type);
      }

      // Should have at least 20 event types
      expect(STREAM_EVENT_TYPES.length).toBeGreaterThanOrEqual(20);
    });
  });
});
