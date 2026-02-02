/**
 * Validation Utilities Tests
 * Comprehensive tests for the server validation utilities
 */

import { describe, expect, it } from "vitest";
import {
  AgentExecuteRequestSchema,
  createErrorResponse,
  type ErrorResponse,
  ServerNameParamSchema,
  SessionIdParamSchema,
  ToolArgumentsSchema,
  ToolExecuteRequestSchema,
  ToolNameParamSchema,
  ToolSearchQuerySchema,
  type ValidationResult,
  validateParams,
  validateQuery,
  validateRequest,
} from "../../../src/lib/server/utils/validation.js";

describe("Validation Utilities", () => {
  describe("AgentExecuteRequestSchema", () => {
    it("should validate string input", () => {
      const result = AgentExecuteRequestSchema.safeParse({
        input: "Hello, AI!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.input).toBe("Hello, AI!");
      }
    });

    it("should validate object input with text", () => {
      const result = AgentExecuteRequestSchema.safeParse({
        input: { text: "Hello, AI!" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data.input as { text: string; images?: string[] }).text,
        ).toBe("Hello, AI!");
      }
    });

    it("should validate object input with images", () => {
      const result = AgentExecuteRequestSchema.safeParse({
        input: {
          text: "Describe this",
          images: ["base64image1", "base64image2"],
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data.input as { text: string; images?: string[] }).images,
        ).toHaveLength(2);
      }
    });

    it("should validate object input with files", () => {
      const result = AgentExecuteRequestSchema.safeParse({
        input: {
          text: "Analyze these files",
          files: ["/path/to/file1.pdf", "/path/to/file2.csv"],
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data.input as { text: string; files?: string[] }).files,
        ).toHaveLength(2);
      }
    });

    it("should validate optional provider", () => {
      const result = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        provider: "openai",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.provider).toBe("openai");
      }
    });

    it("should validate optional model", () => {
      const result = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        model: "gpt-4",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe("gpt-4");
      }
    });

    it("should validate optional systemPrompt", () => {
      const result = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        systemPrompt: "You are a helpful assistant",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.systemPrompt).toBe("You are a helpful assistant");
      }
    });

    it("should validate temperature between 0 and 2", () => {
      const validResult = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        temperature: 0.7,
      });
      expect(validResult.success).toBe(true);

      const invalidLowResult = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        temperature: -0.1,
      });
      expect(invalidLowResult.success).toBe(false);

      const invalidHighResult = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        temperature: 2.5,
      });
      expect(invalidHighResult.success).toBe(false);
    });

    it("should validate temperature at boundaries", () => {
      const zeroResult = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        temperature: 0,
      });
      expect(zeroResult.success).toBe(true);

      const twoResult = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        temperature: 2,
      });
      expect(twoResult.success).toBe(true);
    });

    it("should validate maxTokens as positive number", () => {
      const validResult = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        maxTokens: 1000,
      });
      expect(validResult.success).toBe(true);

      const invalidResult = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        maxTokens: -100,
      });
      expect(invalidResult.success).toBe(false);

      const zeroResult = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        maxTokens: 0,
      });
      expect(zeroResult.success).toBe(false);
    });

    it("should validate optional tools array", () => {
      const result = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        tools: ["calculator", "webSearch"],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tools).toEqual(["calculator", "webSearch"]);
      }
    });

    it("should validate optional stream boolean", () => {
      const result = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        stream: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stream).toBe(true);
      }
    });

    it("should validate optional sessionId and userId", () => {
      const result = AgentExecuteRequestSchema.safeParse({
        input: "Test",
        sessionId: "session-123",
        userId: "user-456",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionId).toBe("session-123");
        expect(result.data.userId).toBe("user-456");
      }
    });

    it("should reject missing input", () => {
      const result = AgentExecuteRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject invalid input type", () => {
      const result = AgentExecuteRequestSchema.safeParse({
        input: 123,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ToolExecuteRequestSchema", () => {
    it("should validate tool execute request", () => {
      const result = ToolExecuteRequestSchema.safeParse({
        name: "calculator",
        arguments: { expression: "2 + 2" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("calculator");
        expect(result.data.arguments).toEqual({ expression: "2 + 2" });
      }
    });

    it("should require tool name", () => {
      const result = ToolExecuteRequestSchema.safeParse({
        arguments: { expression: "2 + 2" },
      });
      expect(result.success).toBe(false);
    });

    it("should require non-empty tool name", () => {
      const result = ToolExecuteRequestSchema.safeParse({
        name: "",
        arguments: {},
      });
      expect(result.success).toBe(false);
    });

    it("should default arguments to empty object", () => {
      const result = ToolExecuteRequestSchema.safeParse({
        name: "calculator",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.arguments).toEqual({});
      }
    });

    it("should validate optional sessionId and userId", () => {
      const result = ToolExecuteRequestSchema.safeParse({
        name: "calculator",
        arguments: {},
        sessionId: "session-123",
        userId: "user-456",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessionId).toBe("session-123");
        expect(result.data.userId).toBe("user-456");
      }
    });
  });

  describe("ToolArgumentsSchema", () => {
    it("should validate empty object", () => {
      const result = ToolArgumentsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should validate object with any keys", () => {
      const result = ToolArgumentsSchema.safeParse({
        key1: "value1",
        key2: 123,
        key3: true,
        key4: { nested: "object" },
      });
      expect(result.success).toBe(true);
    });

    it("should reject non-object values", () => {
      const stringResult = ToolArgumentsSchema.safeParse("string");
      expect(stringResult.success).toBe(false);

      const arrayResult = ToolArgumentsSchema.safeParse(["array"]);
      expect(arrayResult.success).toBe(false);
    });
  });

  describe("SessionIdParamSchema", () => {
    it("should validate sessionId", () => {
      const result = SessionIdParamSchema.safeParse({
        sessionId: "session-123",
      });
      expect(result.success).toBe(true);
    });

    it("should require sessionId", () => {
      const result = SessionIdParamSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should require non-empty sessionId", () => {
      const result = SessionIdParamSchema.safeParse({
        sessionId: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ServerNameParamSchema", () => {
    it("should validate server name", () => {
      const result = ServerNameParamSchema.safeParse({
        name: "github",
      });
      expect(result.success).toBe(true);
    });

    it("should require server name", () => {
      const result = ServerNameParamSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should require non-empty server name", () => {
      const result = ServerNameParamSchema.safeParse({
        name: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ToolNameParamSchema", () => {
    it("should validate tool name", () => {
      const result = ToolNameParamSchema.safeParse({
        name: "calculator",
      });
      expect(result.success).toBe(true);
    });

    it("should require tool name", () => {
      const result = ToolNameParamSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should require non-empty tool name", () => {
      const result = ToolNameParamSchema.safeParse({
        name: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ToolSearchQuerySchema", () => {
    it("should validate empty query", () => {
      const result = ToolSearchQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should validate search query", () => {
      const result = ToolSearchQuerySchema.safeParse({
        q: "calculator",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("calculator");
      }
    });

    it("should validate source filter", () => {
      const result = ToolSearchQuerySchema.safeParse({
        source: "built-in",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe("built-in");
      }
    });

    it("should validate and transform limit", () => {
      const result = ToolSearchQuerySchema.safeParse({
        limit: "50",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("should reject invalid limit (non-numeric)", () => {
      const result = ToolSearchQuerySchema.safeParse({
        limit: "abc",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid limit (too high)", () => {
      const result = ToolSearchQuerySchema.safeParse({
        limit: "150",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid limit (zero)", () => {
      const result = ToolSearchQuerySchema.safeParse({
        limit: "0",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid limit (negative)", () => {
      const result = ToolSearchQuerySchema.safeParse({
        limit: "-10",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createErrorResponse", () => {
    it("should create basic error response", () => {
      const response = createErrorResponse("TEST_ERROR", "Test error message");

      expect(response.error.code).toBe("TEST_ERROR");
      expect(response.error.message).toBe("Test error message");
      expect(response.metadata?.timestamp).toBeDefined();
    });

    it("should include details when provided", () => {
      const details = { field: "name", issue: "required" };
      const response = createErrorResponse(
        "VALIDATION_ERROR",
        "Validation failed",
        details,
      );

      expect(response.error.details).toEqual(details);
    });

    it("should include requestId when provided", () => {
      const response = createErrorResponse(
        "TEST_ERROR",
        "Test error",
        undefined,
        "req-123",
      );

      expect(response.metadata?.requestId).toBe("req-123");
    });

    it("should return valid ISO timestamp", () => {
      const response = createErrorResponse("TEST_ERROR", "Test error");

      const parsedDate = new Date(response.metadata!.timestamp);
      expect(parsedDate.toISOString()).toBe(response.metadata!.timestamp);
    });
  });

  describe("validateRequest", () => {
    it("should return success for valid data", () => {
      const result = validateRequest(AgentExecuteRequestSchema, {
        input: "Hello",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.input).toBe("Hello");
      }
    });

    it("should return error for invalid data", () => {
      const result = validateRequest(AgentExecuteRequestSchema, {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.error.message).toBe("Invalid request body");
      }
    });

    it("should include validation details in error", () => {
      const result = validateRequest(AgentExecuteRequestSchema, {
        input: "Test",
        temperature: 5, // Invalid
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(Array.isArray(result.error.error.details)).toBe(true);
        const details = result.error.error.details as Array<{
          path: string;
          message: string;
          code: string;
        }>;
        expect(details.some((d) => d.path === "temperature")).toBe(true);
      }
    });

    it("should include requestId in error", () => {
      const result = validateRequest(AgentExecuteRequestSchema, {}, "req-456");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.metadata?.requestId).toBe("req-456");
      }
    });
  });

  describe("validateQuery", () => {
    it("should return success for valid query", () => {
      const result = validateQuery(ToolSearchQuerySchema, {
        q: "test",
        limit: "10",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("test");
        expect(result.data.limit).toBe(10);
      }
    });

    it("should return error for invalid query", () => {
      const result = validateQuery(ToolSearchQuerySchema, {
        limit: "invalid",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.error.message).toBe("Invalid query parameters");
      }
    });

    it("should include requestId in error", () => {
      const result = validateQuery(
        ToolSearchQuerySchema,
        { limit: "-1" },
        "req-789",
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.metadata?.requestId).toBe("req-789");
      }
    });
  });

  describe("validateParams", () => {
    it("should return success for valid params", () => {
      const result = validateParams(ToolNameParamSchema, {
        name: "calculator",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("calculator");
      }
    });

    it("should return error for invalid params", () => {
      const result = validateParams(ToolNameParamSchema, {
        name: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.error.message).toBe("Invalid path parameters");
      }
    });

    it("should return error for missing params", () => {
      const result = validateParams(ToolNameParamSchema, {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should include requestId in error", () => {
      const result = validateParams(SessionIdParamSchema, {}, "req-abc");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.metadata?.requestId).toBe("req-abc");
      }
    });
  });

  describe("ErrorResponse type", () => {
    it("should match expected structure", () => {
      const error: ErrorResponse = {
        error: {
          code: "TEST",
          message: "Test message",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: "req-123",
        },
      };

      expect(error.error.code).toBeDefined();
      expect(error.error.message).toBeDefined();
      expect(error.metadata?.timestamp).toBeDefined();
    });

    it("should allow optional details", () => {
      const error: ErrorResponse = {
        error: {
          code: "TEST",
          message: "Test message",
          details: { extra: "info" },
        },
      };

      expect(error.error.details).toEqual({ extra: "info" });
    });
  });

  describe("ValidationResult type", () => {
    it("should handle success case", () => {
      const result: ValidationResult<{ name: string }> = {
        success: true,
        data: { name: "test" },
      };

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("test");
      }
    });

    it("should handle error case", () => {
      const result: ValidationResult<{ name: string }> = {
        success: false,
        error: createErrorResponse("ERROR", "Failed"),
      };

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.error.code).toBe("ERROR");
      }
    });
  });
});
