/**
 * TTSProcessor Unit Tests
 *
 * Comprehensive unit tests for TTSProcessor class covering all methods,
 * error handling, validation, handler registration, and edge cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TTSProcessor,
  TTSError,
  TTS_ERROR_CODES,
  type TTSHandler,
} from "../../src/lib/utils/ttsProcessor.js";
import type {
  TTSOptions,
  TTSResult,
  TTSVoice,
} from "../../src/lib/types/ttsTypes.js";
import { ErrorCategory, ErrorSeverity } from "../../src/lib/constants/enums.js";
import { logger } from "../../src/lib/utils/logger.js";

// Mock the logger
vi.mock("../../src/lib/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("TTSProcessor", () => {
  // Mock handlers for testing
  const createMockHandler = (
    options: {
      configured?: boolean;
      maxTextLength?: number;
      synthesizeImpl?: (
        text: string,
        options: TTSOptions,
      ) => Promise<TTSResult>;
      getVoicesImpl?: (languageCode?: string) => Promise<TTSVoice[]>;
    } = {},
  ): TTSHandler => {
    const {
      configured = true,
      maxTextLength,
      synthesizeImpl,
      getVoicesImpl,
    } = options;

    return {
      synthesize:
        synthesizeImpl ??
        vi.fn().mockResolvedValue({
          buffer: Buffer.from("mock audio data"),
          format: "mp3" as const,
          size: 15,
          voice: "en-US-Neural2-C",
          metadata: {
            latency: 500,
            provider: "test-provider",
          },
        }),
      isConfigured: vi.fn().mockReturnValue(configured),
      getVoices: getVoicesImpl ?? vi.fn().mockResolvedValue([]),
      maxTextLength,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the handlers registry before each test
    // We need to access the private handlers map via reflection
    // @ts-expect-error - Accessing private property for testing
    TTSProcessor["handlers"].clear();
  });

  describe("registerHandler", () => {
    it("should add handler to registry", () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("test-provider", handler);

      expect(TTSProcessor.supports("test-provider")).toBe(true);
      expect(logger.debug).toHaveBeenCalledWith(
        "[TTSProcessor] Registered TTS handler for provider: test-provider",
      );
    });

    it("should normalize provider names to lowercase", () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("Test-Provider", handler);

      expect(TTSProcessor.supports("test-provider")).toBe(true);
      expect(TTSProcessor.supports("Test-Provider")).toBe(true);
      expect(TTSProcessor.supports("TEST-PROVIDER")).toBe(true);
    });

    it("should throw error if provider name is empty", () => {
      const handler = createMockHandler();
      expect(() => TTSProcessor.registerHandler("", handler)).toThrow(
        "Provider name is required",
      );
    });

    it("should throw error if handler is not provided", () => {
      // @ts-expect-error - Testing invalid input
      expect(() => TTSProcessor.registerHandler("test", null)).toThrow(
        "Handler is required",
      );
    });

    it("should warn when overwriting existing handler", () => {
      const handler1 = createMockHandler();
      const handler2 = createMockHandler();

      TTSProcessor.registerHandler("test-provider", handler1);
      TTSProcessor.registerHandler("test-provider", handler2);

      expect(logger.warn).toHaveBeenCalledWith(
        "[TTSProcessor] Overwriting existing handler for provider: test-provider",
      );
    });

    it("should allow multiple different providers", () => {
      const handler1 = createMockHandler();
      const handler2 = createMockHandler();
      const handler3 = createMockHandler();

      TTSProcessor.registerHandler("provider-1", handler1);
      TTSProcessor.registerHandler("provider-2", handler2);
      TTSProcessor.registerHandler("provider-3", handler3);

      expect(TTSProcessor.supports("provider-1")).toBe(true);
      expect(TTSProcessor.supports("provider-2")).toBe(true);
      expect(TTSProcessor.supports("provider-3")).toBe(true);
    });
  });

  describe("supports", () => {
    it("should return true for registered providers", () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("registered-provider", handler);

      expect(TTSProcessor.supports("registered-provider")).toBe(true);
    });

    it("should return false for unregistered providers", () => {
      expect(TTSProcessor.supports("unregistered-provider")).toBe(false);
      expect(logger.debug).toHaveBeenCalledWith(
        "[TTSProcessor] Provider unregistered-provider is not supported",
      );
    });

    it("should handle empty provider name gracefully", () => {
      expect(TTSProcessor.supports("")).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        "[TTSProcessor] Provider name is required for supports check",
      );
    });

    it("should be case-insensitive", () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("Test-Provider", handler);

      expect(TTSProcessor.supports("test-provider")).toBe(true);
      expect(TTSProcessor.supports("TEST-PROVIDER")).toBe(true);
      expect(TTSProcessor.supports("Test-Provider")).toBe(true);
    });
  });

  describe("synthesize - validation", () => {
    it("should validate empty text", async () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("test-provider", handler);

      await expect(
        TTSProcessor.synthesize("", "test-provider", { voice: "test-voice" }),
      ).rejects.toThrow(TTSError);

      await expect(
        TTSProcessor.synthesize("", "test-provider", { voice: "test-voice" }),
      ).rejects.toMatchObject({
        code: TTS_ERROR_CODES.EMPTY_TEXT,
        message: "Text is required for TTS synthesis",
      });

      expect(logger.error).toHaveBeenCalledWith(
        "[TTSProcessor] Text is required for synthesis",
      );
    });

    it("should trim whitespace and validate", async () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("test-provider", handler);

      await expect(
        TTSProcessor.synthesize("   ", "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toThrow(TTSError);

      await expect(
        TTSProcessor.synthesize("  \n  ", "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toMatchObject({
        code: TTS_ERROR_CODES.EMPTY_TEXT,
      });
    });

    it("should validate text length against default max", async () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("test-provider", handler);

      const longText = "a".repeat(3001); // Default max is 3000

      await expect(
        TTSProcessor.synthesize(longText, "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toThrow(TTSError);

      await expect(
        TTSProcessor.synthesize(longText, "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toMatchObject({
        code: TTS_ERROR_CODES.TEXT_TOO_LONG,
        message: expect.stringContaining("exceeds maximum allowed length"),
      });
    });

    it("should validate text length against handler-specific max", async () => {
      const handler = createMockHandler({ maxTextLength: 100 });
      TTSProcessor.registerHandler("test-provider", handler);

      const longText = "a".repeat(101);

      await expect(
        TTSProcessor.synthesize(longText, "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toThrow(TTSError);

      await expect(
        TTSProcessor.synthesize(longText, "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toMatchObject({
        code: TTS_ERROR_CODES.TEXT_TOO_LONG,
      });

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          "Text exceeds maximum length of 100 characters",
        ),
      );
    });

    it("should accept text at exactly max length", async () => {
      const handler = createMockHandler({ maxTextLength: 100 });
      TTSProcessor.registerHandler("test-provider", handler);

      const exactText = "a".repeat(100);

      const result = await TTSProcessor.synthesize(exactText, "test-provider", {
        voice: "test-voice",
      });

      expect(result).toBeDefined();
      expect(handler.synthesize).toHaveBeenCalledWith(exactText, {
        voice: "test-voice",
      });
    });

    it("should throw error for unsupported provider", async () => {
      await expect(
        TTSProcessor.synthesize("Hello", "unsupported-provider", {
          voice: "test-voice",
        }),
      ).rejects.toThrow(TTSError);

      await expect(
        TTSProcessor.synthesize("Hello", "unsupported-provider", {
          voice: "test-voice",
        }),
      ).rejects.toMatchObject({
        code: TTS_ERROR_CODES.PROVIDER_NOT_SUPPORTED,
        message: expect.stringContaining("is not supported"),
      });

      expect(logger.error).toHaveBeenCalledWith(
        '[TTSProcessor] Provider "unsupported-provider" is not registered',
      );
    });

    it("should throw error for unconfigured provider", async () => {
      const handler = createMockHandler({ configured: false });
      TTSProcessor.registerHandler("unconfigured-provider", handler);

      await expect(
        TTSProcessor.synthesize("Hello", "unconfigured-provider", {
          voice: "test-voice",
        }),
      ).rejects.toThrow(TTSError);

      await expect(
        TTSProcessor.synthesize("Hello", "unconfigured-provider", {
          voice: "test-voice",
        }),
      ).rejects.toMatchObject({
        code: TTS_ERROR_CODES.PROVIDER_NOT_CONFIGURED,
        message: expect.stringContaining("is not configured"),
      });

      expect(logger.warn).toHaveBeenCalledWith(
        '[TTSProcessor] Provider "unconfigured-provider" is not properly configured',
      );
    });
  });

  describe("synthesize - execution", () => {
    it("should call handler.synthesize() with correct parameters", async () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("test-provider", handler);

      const options: TTSOptions = {
        voice: "en-US-Neural2-C",
        format: "mp3",
        speed: 1.2,
        pitch: 0.5,
      };

      await TTSProcessor.synthesize("Hello world", "test-provider", options);

      expect(handler.synthesize).toHaveBeenCalledWith("Hello world", options);
    });

    it("should trim text before passing to handler", async () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("test-provider", handler);

      await TTSProcessor.synthesize("  Hello world  \n", "test-provider", {
        voice: "test-voice",
      });

      expect(handler.synthesize).toHaveBeenCalledWith("Hello world", {
        voice: "test-voice",
      });
    });

    it("should return enriched TTSResult with metadata", async () => {
      const mockResult: TTSResult = {
        buffer: Buffer.from("audio data"),
        format: "mp3",
        size: 10,
        metadata: {
          latency: 300,
          provider: "test-provider",
        },
      };

      const handler = createMockHandler({
        synthesizeImpl: vi.fn().mockResolvedValue(mockResult),
      });
      TTSProcessor.registerHandler("test-provider", handler);

      const result = await TTSProcessor.synthesize("Hello", "test-provider", {
        voice: "en-US-Neural2-C",
      });

      expect(result).toEqual({
        buffer: mockResult.buffer,
        format: "mp3",
        size: 10,
        voice: "en-US-Neural2-C",
        metadata: {
          latency: 300,
          provider: "test-provider",
        },
      });
    });

    it("should use voice from result if not in options", async () => {
      const mockResult: TTSResult = {
        buffer: Buffer.from("audio"),
        format: "mp3",
        size: 5,
        voice: "result-voice",
        metadata: { latency: 100 },
      };

      const handler = createMockHandler({
        synthesizeImpl: vi.fn().mockResolvedValue(mockResult),
      });
      TTSProcessor.registerHandler("test-provider", handler);

      const result = await TTSProcessor.synthesize("Hello", "test-provider", {
        format: "mp3",
      });

      expect(result.voice).toBe("result-voice");
    });

    it("should use voice from result when present (result.voice ?? options.voice)", async () => {
      const mockResult: TTSResult = {
        buffer: Buffer.from("audio"),
        format: "mp3",
        size: 5,
        voice: "result-voice",
        metadata: { latency: 100 },
      };

      const handler = createMockHandler({
        synthesizeImpl: vi.fn().mockResolvedValue(mockResult),
      });
      TTSProcessor.registerHandler("test-provider", handler);

      const result = await TTSProcessor.synthesize("Hello", "test-provider", {
        voice: "option-voice",
      });

      // Implementation uses: result.voice ?? options.voice
      // So if result has a voice, it takes precedence
      expect(result.voice).toBe("result-voice");
    });

    it("should log debug on synthesis start", async () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("test-provider", handler);

      await TTSProcessor.synthesize("Hello", "test-provider", {
        voice: "test-voice",
      });

      expect(logger.debug).toHaveBeenCalledWith(
        "[TTSProcessor] Starting synthesis with provider: test-provider",
      );
    });

    it("should log info on successful synthesis", async () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("test-provider", handler);

      await TTSProcessor.synthesize("Hello", "test-provider", {
        voice: "test-voice",
      });

      expect(logger.info).toHaveBeenCalledWith(
        "[TTSProcessor] Successfully synthesized 15 bytes of audio",
      );
    });
  });

  describe("synthesize - error handling", () => {
    it("should re-throw TTSError from handler", async () => {
      const ttsError = new TTSError({
        code: TTS_ERROR_CODES.SYNTHESIS_FAILED,
        message: "Custom TTS error",
        severity: ErrorSeverity.HIGH,
      });

      const handler = createMockHandler({
        synthesizeImpl: vi.fn().mockRejectedValue(ttsError),
      });
      TTSProcessor.registerHandler("test-provider", handler);

      await expect(
        TTSProcessor.synthesize("Hello", "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toThrow(ttsError);

      // Should not wrap the error
      await expect(
        TTSProcessor.synthesize("Hello", "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toMatchObject({
        code: TTS_ERROR_CODES.SYNTHESIS_FAILED,
        message: "Custom TTS error",
      });
    });

    it("should wrap non-TTSError in TTSError", async () => {
      const genericError = new Error("Generic error");

      const handler = createMockHandler({
        synthesizeImpl: vi.fn().mockRejectedValue(genericError),
      });
      TTSProcessor.registerHandler("test-provider", handler);

      await expect(
        TTSProcessor.synthesize("Hello", "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toThrow(TTSError);

      await expect(
        TTSProcessor.synthesize("Hello", "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toMatchObject({
        code: TTS_ERROR_CODES.SYNTHESIS_FAILED,
        message: expect.stringContaining("Generic error"),
      });
    });

    it("should wrap string errors in TTSError", async () => {
      const handler = createMockHandler({
        synthesizeImpl: vi.fn().mockRejectedValue("String error"),
      });
      TTSProcessor.registerHandler("test-provider", handler);

      await expect(
        TTSProcessor.synthesize("Hello", "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toMatchObject({
        code: TTS_ERROR_CODES.SYNTHESIS_FAILED,
        message: expect.stringContaining("String error"),
      });
    });

    it("should handle null/undefined errors gracefully", async () => {
      const handler = createMockHandler({
        synthesizeImpl: vi.fn().mockRejectedValue(null),
      });
      TTSProcessor.registerHandler("test-provider", handler);

      await expect(
        TTSProcessor.synthesize("Hello", "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toMatchObject({
        code: TTS_ERROR_CODES.SYNTHESIS_FAILED,
        message: expect.stringContaining("Unknown error"),
      });
    });

    it("should log error on synthesis failure", async () => {
      const handler = createMockHandler({
        synthesizeImpl: vi.fn().mockRejectedValue(new Error("Test error")),
      });
      TTSProcessor.registerHandler("test-provider", handler);

      await expect(
        TTSProcessor.synthesize("Hello", "test-provider", {
          voice: "test-voice",
        }),
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Synthesis failed for provider"),
      );
    });

    it("should include context in wrapped errors", async () => {
      const handler = createMockHandler({
        synthesizeImpl: vi.fn().mockRejectedValue(new Error("Test error")),
      });
      TTSProcessor.registerHandler("test-provider", handler);

      try {
        await TTSProcessor.synthesize("Hello world", "test-provider", {
          voice: "test-voice",
          format: "mp3",
        });
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        const ttsError = error as TTSError;
        expect(ttsError.context).toMatchObject({
          provider: "test-provider",
          textLength: 11,
          options: {
            voice: "test-voice",
            format: "mp3",
          },
        });
      }
    });

    it("should mark wrapped errors as retriable", async () => {
      const handler = createMockHandler({
        synthesizeImpl: vi.fn().mockRejectedValue(new Error("Network error")),
      });
      TTSProcessor.registerHandler("test-provider", handler);

      try {
        await TTSProcessor.synthesize("Hello", "test-provider", {
          voice: "test-voice",
        });
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        const ttsError = error as TTSError;
        expect(ttsError.retriable).toBe(true);
      }
    });
  });

  describe("TTSError class", () => {
    it("should create TTSError with required fields", () => {
      const error = new TTSError({
        code: TTS_ERROR_CODES.EMPTY_TEXT,
        message: "Test error message",
      });

      expect(error).toBeInstanceOf(TTSError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("TTSError");
      expect(error.code).toBe(TTS_ERROR_CODES.EMPTY_TEXT);
      expect(error.message).toBe("Test error message");
    });

    it("should use default category and severity", () => {
      const error = new TTSError({
        code: TTS_ERROR_CODES.EMPTY_TEXT,
        message: "Test error",
      });

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retriable).toBe(false);
    });

    it("should accept custom category and severity", () => {
      const error = new TTSError({
        code: TTS_ERROR_CODES.SYNTHESIS_FAILED,
        message: "Test error",
        category: ErrorCategory.EXECUTION,
        severity: ErrorSeverity.HIGH,
        retriable: true,
      });

      expect(error.category).toBe(ErrorCategory.EXECUTION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retriable).toBe(true);
    });

    it("should include context and original error", () => {
      const originalError = new Error("Original error");
      const error = new TTSError({
        code: TTS_ERROR_CODES.SYNTHESIS_FAILED,
        message: "Wrapped error",
        context: { provider: "test", textLength: 100 },
        originalError,
      });

      // When originalError is provided, NeuroLinkError constructor adds originalMessage to context
      expect(error.context).toEqual({
        provider: "test",
        textLength: 100,
        originalMessage: "Original error",
      });
      // Note: originalError is not exposed as a property on NeuroLinkError
    });
  });

  describe("TTS_ERROR_CODES", () => {
    it("should have all required error codes", () => {
      expect(TTS_ERROR_CODES.EMPTY_TEXT).toBe("TTS_EMPTY_TEXT");
      expect(TTS_ERROR_CODES.TEXT_TOO_LONG).toBe("TTS_TEXT_TOO_LONG");
      expect(TTS_ERROR_CODES.PROVIDER_NOT_SUPPORTED).toBe(
        "TTS_PROVIDER_NOT_SUPPORTED",
      );
      expect(TTS_ERROR_CODES.PROVIDER_NOT_CONFIGURED).toBe(
        "TTS_PROVIDER_NOT_CONFIGURED",
      );
      expect(TTS_ERROR_CODES.SYNTHESIS_FAILED).toBe("TTS_SYNTHESIS_FAILED");
      expect(TTS_ERROR_CODES.INVALID_INPUT).toBe("TTS_INVALID_INPUT");
    });
  });

  describe("Edge cases and integration scenarios", () => {
    it("should handle multiple concurrent synthesis requests", async () => {
      const handler = createMockHandler({
        synthesizeImpl: async (text: string) => ({
          buffer: Buffer.from(`audio for: ${text}`),
          format: "mp3" as const,
          size: text.length,
          metadata: { latency: 100 },
        }),
      });
      TTSProcessor.registerHandler("test-provider", handler);

      const results = await Promise.all([
        TTSProcessor.synthesize("Text 1", "test-provider", {
          voice: "voice-1",
        }),
        TTSProcessor.synthesize("Text 2", "test-provider", {
          voice: "voice-2",
        }),
        TTSProcessor.synthesize("Text 3", "test-provider", {
          voice: "voice-3",
        }),
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].buffer.toString()).toContain("Text 1");
      expect(results[1].buffer.toString()).toContain("Text 2");
      expect(results[2].buffer.toString()).toContain("Text 3");
    });

    it("should handle handler with optional getVoices method", async () => {
      const handler = createMockHandler();
      delete (handler as Partial<TTSHandler>).getVoices;
      TTSProcessor.registerHandler("test-provider", handler);

      // Should still be able to synthesize
      const result = await TTSProcessor.synthesize("Hello", "test-provider", {
        voice: "test-voice",
      });
      expect(result).toBeDefined();
    });

    it("should preserve all metadata fields from handler result", async () => {
      const mockResult: TTSResult = {
        buffer: Buffer.from("audio"),
        format: "wav",
        size: 5,
        voice: "test-voice",
        duration: 2.5,
        sampleRate: 44100,
        metadata: {
          latency: 300,
          provider: "test",
          customField: "custom-value",
        },
      };

      const handler = createMockHandler({
        synthesizeImpl: vi.fn().mockResolvedValue(mockResult),
      });
      TTSProcessor.registerHandler("test-provider", handler);

      const result = await TTSProcessor.synthesize("Hello", "test-provider", {
        voice: "different-voice",
      });

      expect(result.duration).toBe(2.5);
      expect(result.sampleRate).toBe(44100);
      expect(result.metadata?.customField).toBe("custom-value");
    });

    it("should handle very long valid text", async () => {
      const handler = createMockHandler({ maxTextLength: 5000 });
      TTSProcessor.registerHandler("test-provider", handler);

      const longText = "a".repeat(5000);
      const result = await TTSProcessor.synthesize(longText, "test-provider", {
        voice: "test-voice",
      });

      expect(result).toBeDefined();
      expect(handler.synthesize).toHaveBeenCalledWith(longText, {
        voice: "test-voice",
      });
    });

    it("should handle unicode text correctly", async () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("test-provider", handler);

      const unicodeText = "Hello 世界 🌍 مرحبا";
      await TTSProcessor.synthesize(unicodeText, "test-provider", {
        voice: "test-voice",
      });

      expect(handler.synthesize).toHaveBeenCalledWith(unicodeText, {
        voice: "test-voice",
      });
    });

    it("should handle newlines and special characters in text", async () => {
      const handler = createMockHandler();
      TTSProcessor.registerHandler("test-provider", handler);

      const specialText = "Line 1\nLine 2\tTabbed\r\nWindows line";
      await TTSProcessor.synthesize(specialText, "test-provider", {
        voice: "test-voice",
      });

      expect(handler.synthesize).toHaveBeenCalledWith(specialText, {
        voice: "test-voice",
      });
    });
  });
});
