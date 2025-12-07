import { describe, it, expect } from "vitest";
import { OpenAITTSHandler } from "../../../src/lib/adapters/tts/openaiTTSHandler.js";
import type { TTSOptions } from "../../../src/lib/types/ttsTypes.js";

describe("OpenAITTSHandler", () => {
  describe("constructor", () => {
    it("should create handler with provided API key", () => {
      const handler = new OpenAITTSHandler("custom-key");
      expect(handler).toBeInstanceOf(OpenAITTSHandler);
    });

    it("should create handler with env var API key", () => {
      process.env.OPENAI_API_KEY = "env-key";
      const handler = new OpenAITTSHandler();
      expect(handler).toBeInstanceOf(OpenAITTSHandler);
    });
  });

  describe("getSupportedVoices", () => {
    it("should return all 6 OpenAI voices", () => {
      const handler = new OpenAITTSHandler("test-key");
      const voices = handler.getSupportedVoices();
      expect(voices).toHaveLength(6);
      expect(voices).toContain("alloy");
      expect(voices).toContain("echo");
      expect(voices).toContain("fable");
      expect(voices).toContain("onyx");
      expect(voices).toContain("nova");
      expect(voices).toContain("shimmer");
    });
  });

  describe("getSupportedFormats", () => {
    it("should return all supported formats", () => {
      const handler = new OpenAITTSHandler("test-key");
      const formats = handler.getSupportedFormats();
      expect(formats).toHaveLength(6);
      expect(formats).toContain("mp3");
      expect(formats).toContain("opus");
      expect(formats).toContain("aac");
      expect(formats).toContain("flac");
      expect(formats).toContain("wav");
      expect(formats).toContain("pcm");
    });
  });

  describe("validation", () => {
    it("should reject empty text", async () => {
      const handler = new OpenAITTSHandler("test-key");
      await expect(handler.synthesize({ text: "" })).rejects.toThrow(
        "Text is required",
      );
    });

    it("should reject whitespace-only text", async () => {
      const handler = new OpenAITTSHandler("test-key");
      await expect(handler.synthesize({ text: "   " })).rejects.toThrow(
        "Text is required",
      );
    });

    it("should reject text over 4096 characters", async () => {
      const handler = new OpenAITTSHandler("test-key");
      const longText = "a".repeat(4097);
      await expect(handler.synthesize({ text: longText })).rejects.toThrow(
        "exceeds maximum length",
      );
    });

    it("should reject unsupported voice", async () => {
      const handler = new OpenAITTSHandler("test-key");
      await expect(
        handler.synthesize({ text: "test", voice: "invalid" }),
      ).rejects.toThrow("Unsupported voice");
    });

    it("should accept all supported voices", async () => {
      const handler = new OpenAITTSHandler("test-key");
      const voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

      for (const voice of voices) {
        // This will fail with API error but validation should pass
        try {
          await handler.synthesize({ text: "test", voice });
        } catch (error) {
          // Should not be a validation error
          expect((error as Error).message).not.toContain("Unsupported voice");
        }
      }
    });

    it("should reject unsupported format", async () => {
      const handler = new OpenAITTSHandler("test-key");
      await expect(
        handler.synthesize({
          text: "test",
          // @ts-expect-error - testing invalid format
          format: "invalid",
        }),
      ).rejects.toThrow("Unsupported format");
    });

    it("should reject speed below 0.25", async () => {
      const handler = new OpenAITTSHandler("test-key");
      await expect(
        handler.synthesize({ text: "test", speed: 0.2 }),
      ).rejects.toThrow("Speed must be between 0.25 and 4.0");
    });

    it("should reject speed above 4.0", async () => {
      const handler = new OpenAITTSHandler("test-key");
      await expect(
        handler.synthesize({ text: "test", speed: 4.5 }),
      ).rejects.toThrow("Speed must be between 0.25 and 4.0");
    });

    it("should accept speed of exactly 0.25", async () => {
      const handler = new OpenAITTSHandler("test-key");
      try {
        await handler.synthesize({ text: "test", speed: 0.25 });
      } catch (error) {
        // Should not be a speed validation error
        expect((error as Error).message).not.toContain("Speed must be between");
      }
    });

    it("should accept speed of exactly 4.0", async () => {
      const handler = new OpenAITTSHandler("test-key");
      try {
        await handler.synthesize({ text: "test", speed: 4.0 });
      } catch (error) {
        // Should not be a speed validation error
        expect((error as Error).message).not.toContain("Speed must be between");
      }
    });
  });
});
