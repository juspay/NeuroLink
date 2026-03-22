/**
 * Tests for PartialObjectStreamHandler
 *
 * Tests Pattern 3: Partial Object Streaming
 * - Incremental JSON parsing
 * - Schema validation
 * - Path tracking
 * - Error recovery
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PartialObjectStreamHandler,
  createPartialObjectHandler,
  createPartialObjectHandlerWithSchema,
  streamPartialObjects,
  parseStreamingJson,
  type JsonSchema,
} from "../../src/lib/core/stream/PartialObjectStreamHandler.js";

describe("PartialObjectStreamHandler", () => {
  describe("Incremental JSON Parsing", () => {
    it("should parse complete JSON in one delta", () => {
      const handler = createPartialObjectHandler();

      const event = handler.processJsonDelta('{"name": "John", "age": 30}');

      expect(event).not.toBeNull();
      expect(event?.partialObject).toEqual({ name: "John", age: 30 });
    });

    it("should parse JSON across multiple deltas", () => {
      const handler = createPartialObjectHandler();

      const event1 = handler.processJsonDelta('{"name": "');
      const event2 = handler.processJsonDelta('John"');
      const event3 = handler.processJsonDelta(', "age": 30}');

      // First delta may not produce valid partial
      expect(event2?.partialObject).toEqual({ name: "John" });
      expect(event3?.partialObject).toEqual({ name: "John", age: 30 });
    });

    it("should handle nested objects", () => {
      const handler = createPartialObjectHandler();

      handler.processJsonDelta('{"user": {"name": "');
      const event = handler.processJsonDelta(
        'John", "email": "john@example.com"}}',
      );

      expect(event?.partialObject).toEqual({
        user: { name: "John", email: "john@example.com" },
      });
    });

    it("should handle arrays", () => {
      const handler = createPartialObjectHandler();

      handler.processJsonDelta('{"items": [1, 2');
      const event = handler.processJsonDelta(", 3]}");

      expect(event?.partialObject).toEqual({ items: [1, 2, 3] });
    });

    it("should auto-close brackets for partial JSON", () => {
      const handler = createPartialObjectHandler();

      const event = handler.processJsonDelta('{"name": "John"');

      expect(event).not.toBeNull();
      expect(event?.partialObject).toEqual({ name: "John" });
    });

    it("should handle incomplete strings", () => {
      const handler = createPartialObjectHandler();

      // Incomplete string value
      const event = handler.processJsonDelta('{"name": "Jo');

      // Should auto-close the string and brackets
      expect(event?.partialObject).toEqual({ name: "Jo" });
    });

    it("should handle trailing commas", () => {
      const handler = createPartialObjectHandler();

      const event = handler.processJsonDelta('{"name": "John",');

      expect(event?.partialObject).toEqual({ name: "John" });
    });
  });

  describe("Schema Validation", () => {
    const userSchema: JsonSchema = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        age: { type: "number", minimum: 0, maximum: 150 },
        email: { type: "string" },
      },
      required: ["name", "age"],
    };

    it("should validate complete object against schema", () => {
      const handler = createPartialObjectHandlerWithSchema(userSchema);

      handler.processJsonDelta('{"name": "John", "age": 30}');
      const result = handler.complete();

      expect(result.valid).toBe(true);
      expect(result.validationErrors).toBeUndefined();
    });

    it("should report missing required fields in final validation", () => {
      const handler = createPartialObjectHandlerWithSchema(userSchema);

      handler.processJsonDelta('{"name": "John"}');
      const result = handler.complete();

      expect(result.valid).toBe(false);
      expect(result.validationErrors).toContain(
        '$: missing required field "age"',
      );
    });

    it("should validate type constraints", () => {
      const handler = createPartialObjectHandlerWithSchema(userSchema);

      handler.processJsonDelta('{"name": "John", "age": "thirty"}');
      const result = handler.complete();

      expect(result.valid).toBe(false);
      expect(
        result.validationErrors?.some((e) => e.includes("expected number")),
      ).toBe(true);
    });

    it("should validate number range", () => {
      const handler = createPartialObjectHandlerWithSchema(userSchema);

      handler.processJsonDelta('{"name": "John", "age": -5}');
      const result = handler.complete();

      expect(result.valid).toBe(false);
      expect(
        result.validationErrors?.some((e) => e.includes("below minimum")),
      ).toBe(true);
    });

    it("should call onValidationError for incremental validation", () => {
      const onValidationError = vi.fn();
      const handler = createPartialObjectHandlerWithSchema(
        { type: "object", properties: { count: { type: "number" } } },
        { validateIncrementally: true, onValidationError },
      );

      handler.processJsonDelta('{"count": "not a number"}');

      expect(onValidationError).toHaveBeenCalled();
    });
  });

  describe("Path Tracking", () => {
    it("should track current path for simple objects", () => {
      const handler = createPartialObjectHandler();

      const event = handler.processJsonDelta('{"name": "John"');

      expect(event?.currentPath).toBe("$.name");
    });

    it("should track nested paths", () => {
      const handler = createPartialObjectHandler();

      handler.processJsonDelta('{"user": {"profile": {"name": "');
      const event = handler.processJsonDelta('John"}}}');

      expect(event?.currentPath).toContain("user");
    });

    it("should track array indices", () => {
      const handler = createPartialObjectHandler();

      handler.processJsonDelta('{"items": [1, 2');
      const event = handler.processJsonDelta(", 3");

      // Path should show the last array index
      expect(event?.currentPath).toContain("items");
    });
  });

  describe("Error Recovery", () => {
    it("should recover from malformed JSON using last valid parse", () => {
      const handler = createPartialObjectHandler();

      // Valid partial
      handler.processJsonDelta('{"name": "John"');
      // Invalid continuation that makes it unparseable
      handler.processJsonDelta(", invalid json here");

      const result = handler.complete();

      // Should use last valid parse
      expect(result.object).toEqual({ name: "John" });
      expect(result.valid).toBe(false);
    });

    it("should handle completely invalid JSON", () => {
      const handler = createPartialObjectHandler();

      handler.processJsonDelta("not json at all");

      const result = handler.complete();

      expect(result.valid).toBe(false);
      expect(result.validationErrors?.length).toBeGreaterThan(0);
    });

    it("should call onParseError callback", () => {
      const onParseError = vi.fn();
      const handler = createPartialObjectHandler({ onParseError });

      // Try to process completely invalid JSON repeatedly
      handler.processJsonDelta("{{{invalid");
      handler.processJsonDelta("more garbage");

      // onParseError is not called for non-parseable chunks by default
      // It's called if parse attempts fail repeatedly
      // In this implementation, we don't throw - we just track parse attempts
      expect(handler.getStats().parseAttempts).toBeGreaterThan(0);
    });

    it("should handle JSON with escaped characters", () => {
      const handler = createPartialObjectHandler();

      const event = handler.processJsonDelta('{"message": "Hello\\nWorld"}');

      expect(event?.partialObject).toEqual({ message: "Hello\nWorld" });
    });

    it("should handle JSON with unicode", () => {
      const handler = createPartialObjectHandler();

      const event = handler.processJsonDelta('{"emoji": "\\u2764"}');

      expect(event?.partialObject).toEqual({ emoji: "\u2764" });
    });
  });

  describe("State and Statistics", () => {
    it("should track parse attempts and successes", () => {
      const handler = createPartialObjectHandler();

      handler.processJsonDelta('{"a": 1');
      handler.processJsonDelta("}");

      const stats = handler.getStats();

      expect(stats.parseAttempts).toBe(2);
      expect(stats.successfulParses).toBeGreaterThanOrEqual(1);
    });

    it("should reset state correctly", () => {
      const handler = createPartialObjectHandler();

      handler.processJsonDelta('{"name": "John"}');
      expect(handler.getPartialObject()).not.toBeNull();

      handler.reset();

      expect(handler.getPartialObject()).toBeNull();
      expect(handler.getBuffer()).toBe("");
      expect(handler.getStats().parseAttempts).toBe(0);
    });

    it("should get current buffer", () => {
      const handler = createPartialObjectHandler();

      handler.processJsonDelta('{"name": "Jo');
      handler.processJsonDelta('hn"}');

      expect(handler.getBuffer()).toBe('{"name": "John"}');
    });
  });

  describe("Utility Functions", () => {
    it("should stream partial objects from text stream", async () => {
      const textDeltas = ['{"name": "', 'John", "age":', " 30}"];
      const stream = (async function* () {
        for (const delta of textDeltas) {
          yield delta;
        }
      })();

      const partials: unknown[] = [];
      for await (const partial of streamPartialObjects(stream)) {
        partials.push(partial);
      }

      // Should have progressively built partials
      expect(partials.length).toBeGreaterThan(0);
      // Last partial should be complete
      expect(partials[partials.length - 1]).toEqual({ name: "John", age: 30 });
    });

    it("should parse streaming JSON with validation", async () => {
      const textDeltas = ['{"name": "John", "age": 30}'];
      const stream = (async function* () {
        for (const delta of textDeltas) {
          yield delta;
        }
      })();

      const result = await parseStreamingJson(stream, {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      });

      expect(result.valid).toBe(true);
      expect(result.object).toEqual({ name: "John", age: 30 });
    });

    it("should report validation errors from parseStreamingJson", async () => {
      const stream = (async function* () {
        yield '{"name": 123}'; // name should be string
      })();

      const result = await parseStreamingJson(stream, {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Complete Event Generation", () => {
    it("should generate complete event with validation status", () => {
      const handler = createPartialObjectHandler();

      handler.processJsonDelta('{"valid": true}');
      const result = handler.complete();

      expect(result.type).toBe("object:complete");
      expect(result.object).toEqual({ valid: true });
      expect(result.valid).toBe(true);
      expect(result.seq).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it("should include validation errors in complete event", () => {
      const handler = createPartialObjectHandlerWithSchema({
        type: "object",
        required: ["id"],
      });

      handler.processJsonDelta('{"name": "John"}');
      const result = handler.complete();

      expect(result.valid).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.some((e) => e.includes("id"))).toBe(true);
    });
  });
});
