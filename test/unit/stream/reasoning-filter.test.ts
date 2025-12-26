import { describe, it, expect, beforeEach } from "vitest";
import { StreamHandler } from "../../../src/lib/core/modules/StreamHandler.js";
import { AIProviderName } from "../../../src/lib/constants/enums.js";

/**
 * Reasoning Filter Tests
 *
 * These tests verify the createFilteredFullStream method that filters out
 * reasoning/thinking chunks from AI SDK streams to prevent chain-of-thought
 * tokens from leaking to users.
 *
 * Test coverage addresses PR review comment:
 * "The new createFilteredFullStream method lacks test coverage"
 */
describe("StreamHandler - createFilteredFullStream", () => {
  let streamHandler: StreamHandler;

  beforeEach(() => {
    streamHandler = new StreamHandler(
      AIProviderName.VERTEX,
      "gemini-2.5-flash",
    );
  });

  describe("Filtering reasoning chunks", () => {
    it("should filter out reasoning chunks", async () => {
      async function* mockFullStream() {
        yield { type: "reasoning", text: "Let me think about this..." };
        yield { type: "text-delta", textDelta: "Hello" };
        yield { type: "reasoning", text: "Still thinking..." };
        yield { type: "text-delta", textDelta: " world" };
      }

      const result = streamHandler.createFilteredFullStream({
        fullStream: mockFullStream(),
      });

      const chunks: Array<{ content: string }> = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0].content).toBe("Hello");
      expect(chunks[1].content).toBe(" world");
    });

    it("should filter out reasoning-signature chunks", async () => {
      async function* mockFullStream() {
        yield { type: "reasoning-signature", signature: "abc123" };
        yield { type: "text-delta", textDelta: "Response" };
      }

      const result = streamHandler.createFilteredFullStream({
        fullStream: mockFullStream(),
      });

      const chunks: Array<{ content: string }> = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe("Response");
    });

    it("should filter out redacted-reasoning chunks", async () => {
      async function* mockFullStream() {
        yield { type: "redacted-reasoning", data: "hidden" };
        yield { type: "text-delta", textDelta: "Visible" };
        yield { type: "redacted-reasoning", data: "more hidden" };
        yield { type: "text-delta", textDelta: " content" };
      }

      const result = streamHandler.createFilteredFullStream({
        fullStream: mockFullStream(),
      });

      const chunks: Array<{ content: string }> = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0].content).toBe("Visible");
      expect(chunks[1].content).toBe(" content");
    });

    it("should filter out source chunks", async () => {
      async function* mockFullStream() {
        yield { type: "source", source: { id: "1", text: "citation" } };
        yield { type: "text-delta", textDelta: "Text" };
      }

      const result = streamHandler.createFilteredFullStream({
        fullStream: mockFullStream(),
      });

      const chunks: Array<{ content: string }> = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe("Text");
    });

    it("should filter out tool-call chunks", async () => {
      async function* mockFullStream() {
        yield {
          type: "tool-call",
          toolCall: { toolCallId: "123", toolName: "search", args: {} },
        };
        yield { type: "text-delta", textDelta: "Result" };
      }

      const result = streamHandler.createFilteredFullStream({
        fullStream: mockFullStream(),
      });

      const chunks: Array<{ content: string }> = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe("Result");
    });

    it("should filter out tool-result chunks", async () => {
      async function* mockFullStream() {
        yield {
          type: "tool-result",
          toolResult: { toolCallId: "123", result: "done" },
        };
        yield { type: "text-delta", textDelta: "Done" };
      }

      const result = streamHandler.createFilteredFullStream({
        fullStream: mockFullStream(),
      });

      const chunks: Array<{ content: string }> = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe("Done");
    });
  });

  describe("Passing through valid chunks", () => {
    it("should pass through text-delta chunks", async () => {
      async function* mockFullStream() {
        yield { type: "text-delta", textDelta: "Hello" };
        yield { type: "text-delta", textDelta: " " };
        yield { type: "text-delta", textDelta: "World" };
      }

      const result = streamHandler.createFilteredFullStream({
        fullStream: mockFullStream(),
      });

      const chunks: Array<{ content: string }> = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0].content).toBe("Hello");
      expect(chunks[1].content).toBe(" ");
      expect(chunks[2].content).toBe("World");
    });

    it("should handle string chunks", async () => {
      async function* mockFullStream() {
        yield "Hello";
        yield " ";
        yield "World";
      }

      const result = streamHandler.createFilteredFullStream({
        fullStream: mockFullStream(),
      });

      const chunks: Array<{ content: string }> = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0].content).toBe("Hello");
      expect(chunks[1].content).toBe(" ");
      expect(chunks[2].content).toBe("World");
    });
  });

  describe("Error handling", () => {
    it("should throw error for error chunks", async () => {
      async function* mockFullStream() {
        yield { type: "error", error: { message: "API rate limit exceeded" } };
      }

      const result = streamHandler.createFilteredFullStream({
        fullStream: mockFullStream(),
      });

      await expect(async () => {
        for await (const _chunk of result) {
          // Consume stream
        }
      }).rejects.toThrow("Streaming error: API rate limit exceeded");
    });

    it("should throw error with unknown message if error chunk has no message", async () => {
      async function* mockFullStream() {
        yield { type: "error", error: { code: 500 } };
      }

      const result = streamHandler.createFilteredFullStream({
        fullStream: mockFullStream(),
      });

      await expect(async () => {
        for await (const _chunk of result) {
          // Consume stream
        }
      }).rejects.toThrow("Streaming error: Unknown error");
    });
  });

  describe("Fallback to textStream", () => {
    it("should use textStream when fullStream is unavailable", async () => {
      async function* mockTextStream() {
        yield "Hello";
        yield " ";
        yield "World";
      }

      const result = streamHandler.createFilteredFullStream({
        textStream: mockTextStream(),
      });

      const chunks: Array<{ content: string }> = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0].content).toBe("Hello");
      expect(chunks[1].content).toBe(" ");
      expect(chunks[2].content).toBe("World");
    });

    it("should handle empty textStream", async () => {
      async function* mockTextStream() {}

      const result = streamHandler.createFilteredFullStream({
        textStream: mockTextStream(),
      });

      const chunks: Array<{ content: string }> = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(0);
    });

    it("should handle empty fullStream", async () => {
      async function* mockFullStream() {}

      const result = streamHandler.createFilteredFullStream({
        fullStream: mockFullStream(),
      });

      const chunks: Array<{ content: string }> = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(0);
    });
  });

  describe("Mixed chunk types", () => {
    it("should handle mixed valid and filtered chunks", async () => {
      async function* mockFullStream() {
        yield { type: "reasoning", text: "thinking..." };
        yield { type: "text-delta", textDelta: "Start" };
        yield { type: "reasoning-signature", signature: "sig" };
        yield { type: "text-delta", textDelta: " middle" };
        yield { type: "redacted-reasoning", data: "hidden" };
        yield { type: "text-delta", textDelta: " end" };
        yield { type: "source", source: {} };
      }

      const result = streamHandler.createFilteredFullStream({
        fullStream: mockFullStream(),
      });

      const chunks: Array<{ content: string }> = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks.map((c) => c.content)).toEqual([
        "Start",
        " middle",
        " end",
      ]);
    });
  });
});

/**
 * Test Coverage Summary
 *
 * The tests above verify the createFilteredFullStream method:
 * ✅ Filtering of reasoning chunks
 * ✅ Filtering of reasoning-signature chunks
 * ✅ Filtering of redacted-reasoning chunks
 * ✅ Filtering of source chunks
 * ✅ Filtering of tool-call chunks
 * ✅ Filtering of tool-result chunks
 * ✅ Passing through text-delta chunks
 * ✅ Handling of string chunks
 * ✅ Error handling for error chunks
 * ✅ Fallback to textStream when fullStream is unavailable
 * ✅ Handling of empty streams
 * ✅ Mixed chunk types
 *
 * Implementation reference: src/lib/core/modules/StreamHandler.ts
 */
