import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAITTSHandler } from "../../../src/lib/adapters/tts/openaiTTSHandler.js";
import type { TTSOptions } from "../../../src/lib/types/ttsTypes.js";

// Mock the OpenAI client
vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      audio: {
        speech: {
          create: vi.fn(),
        },
      },
    })),
  };
});

describe("OpenAITTSHandler", () => {
  let handler: OpenAITTSHandler;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Create a fresh handler instance
    handler = new OpenAITTSHandler("test-api-key");
    
    // Get reference to the mocked create function
    mockCreate = (handler as any).client.audio.speech.create;
  });

  describe("constructor", () => {
    it("should create handler with provided API key", () => {
      const testHandler = new OpenAITTSHandler("custom-key");
      expect(testHandler).toBeInstanceOf(OpenAITTSHandler);
    });

    it("should create handler with env var API key", () => {
      process.env.OPENAI_API_KEY = "env-key";
      const testHandler = new OpenAITTSHandler();
      expect(testHandler).toBeInstanceOf(OpenAITTSHandler);
    });
  });

  describe("getSupportedVoices", () => {
    it("should return all 6 OpenAI voices", () => {
      const voices = handler.getSupportedVoices();
      expect(voices).toHaveLength(6);
      expect(voices).toEqual(
        expect.arrayContaining([
          "alloy",
          "echo",
          "fable",
          "onyx",
          "nova",
          "shimmer",
        ]),
      );
    });

    it("should return a new array instance", () => {
      const voices1 = handler.getSupportedVoices();
      const voices2 = handler.getSupportedVoices();
      expect(voices1).not.toBe(voices2);
      expect(voices1).toEqual(voices2);
    });
  });

  describe("getSupportedFormats", () => {
    it("should return all 6 supported formats", () => {
      const formats = handler.getSupportedFormats();
      expect(formats).toHaveLength(6);
      expect(formats).toEqual(
        expect.arrayContaining(["mp3", "opus", "aac", "flac", "wav", "pcm"]),
      );
    });

    it("should return a new array instance", () => {
      const formats1 = handler.getSupportedFormats();
      const formats2 = handler.getSupportedFormats();
      expect(formats1).not.toBe(formats2);
      expect(formats1).toEqual(formats2);
    });
  });

  describe("synthesize - successful synthesis", () => {
    beforeEach(() => {
      // Mock successful API response
      const mockArrayBuffer = new ArrayBuffer(1024);
      mockCreate.mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      });
    });

    it("should synthesize text with default options", async () => {
      const result = await handler.synthesize({ text: "Hello, world!" });

      expect(result).toHaveProperty("buffer");
      expect(result).toHaveProperty("format", "mp3");
      expect(result).toHaveProperty("size");
      expect(result).toHaveProperty("duration");
      expect(result).toHaveProperty("voice", "alloy");
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.size).toBe(1024);
    });

    it("should use provided voice", async () => {
      await handler.synthesize({ text: "Test", voice: "nova" });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          voice: "nova",
        }),
      );
    });

    it("should use provided format", async () => {
      await handler.synthesize({ text: "Test", format: "wav" });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: "wav",
        }),
      );
    });

    it("should use tts-1-hd model for HD quality", async () => {
      await handler.synthesize({ text: "Test", quality: "hd" });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "tts-1-hd",
        }),
      );
    });

    it("should use tts-1 model for standard quality", async () => {
      await handler.synthesize({ text: "Test", quality: "standard" });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "tts-1",
        }),
      );
    });

    it("should use provided speed", async () => {
      await handler.synthesize({ text: "Test", speed: 1.5 });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          speed: 1.5,
        }),
      );
    });

    it("should estimate duration based on word count", async () => {
      const text = "one two three four five"; // 5 words
      const result = await handler.synthesize({ text, speed: 1.0 });

      // ~150 words per minute at speed 1.0
      // 5 words = 5/150 * 60 = 2 seconds
      expect(result.duration).toBeCloseTo(2, 1);
    });

    it("should adjust duration based on speed", async () => {
      const text = "one two three four five"; // 5 words
      const result = await handler.synthesize({ text, speed: 2.0 });

      // At 2x speed, duration should be half
      // 5 words = 5/150 * 60 / 2 = 1 second
      expect(result.duration).toBeCloseTo(1, 1);
    });
  });

  describe("validation - text", () => {
    it("should reject missing text", async () => {
      await expect(handler.synthesize({} as TTSOptions)).rejects.toThrow(
        "Text is required",
      );
    });

    it("should reject empty text", async () => {
      await expect(handler.synthesize({ text: "" })).rejects.toThrow(
        "Text is required",
      );
    });

    it("should reject whitespace-only text", async () => {
      await expect(handler.synthesize({ text: "   " })).rejects.toThrow(
        "Text is required",
      );
    });

    it("should reject text over 4096 characters", async () => {
      const longText = "a".repeat(4097);
      await expect(handler.synthesize({ text: longText })).rejects.toThrow(
        "exceeds maximum length",
      );
    });

    it("should accept text at exactly 4096 characters", async () => {
      const mockArrayBuffer = new ArrayBuffer(1024);
      mockCreate.mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      });

      const maxText = "a".repeat(4096);
      const result = await handler.synthesize({ text: maxText });
      expect(result).toHaveProperty("buffer");
    });
  });

  describe("validation - voice", () => {
    it("should reject unsupported voice", async () => {
      await expect(
        handler.synthesize({ text: "test", voice: "invalid-voice" }),
      ).rejects.toThrow("Unsupported voice");
    });

    it("should accept all supported voices", async () => {
      const mockArrayBuffer = new ArrayBuffer(1024);
      mockCreate.mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      });

      const voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

      for (const voice of voices) {
        await expect(
          handler.synthesize({ text: "test", voice }),
        ).resolves.toBeDefined();
      }
    });
  });

  describe("validation - format", () => {
    it("should reject unsupported format", async () => {
      await expect(
        handler.synthesize({
          text: "test",
          // @ts-expect-error - testing invalid format
          format: "invalid-format",
        }),
      ).rejects.toThrow("Unsupported format");
    });

    it("should accept all supported formats", async () => {
      const mockArrayBuffer = new ArrayBuffer(1024);
      mockCreate.mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      });

      const formats = ["mp3", "opus", "aac", "flac", "wav", "pcm"];

      for (const format of formats) {
        await expect(
          handler.synthesize({ text: "test", format: format as any }),
        ).resolves.toBeDefined();
      }
    });
  });

  describe("validation - speed", () => {
    it("should reject speed below 0.25", async () => {
      await expect(
        handler.synthesize({ text: "test", speed: 0.24 }),
      ).rejects.toThrow("Speed must be between 0.25 and 4.0");
    });

    it("should reject speed above 4.0", async () => {
      await expect(
        handler.synthesize({ text: "test", speed: 4.1 }),
      ).rejects.toThrow("Speed must be between 0.25 and 4.0");
    });

    it("should accept speed of exactly 0.25", async () => {
      const mockArrayBuffer = new ArrayBuffer(1024);
      mockCreate.mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      });

      await expect(
        handler.synthesize({ text: "test", speed: 0.25 }),
      ).resolves.toBeDefined();
    });

    it("should accept speed of exactly 4.0", async () => {
      const mockArrayBuffer = new ArrayBuffer(1024);
      mockCreate.mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      });

      await expect(
        handler.synthesize({ text: "test", speed: 4.0 }),
      ).resolves.toBeDefined();
    });

    it("should accept speed within valid range", async () => {
      const mockArrayBuffer = new ArrayBuffer(1024);
      mockCreate.mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      });

      const speeds = [0.5, 1.0, 1.5, 2.0, 3.0];
      for (const speed of speeds) {
        await expect(
          handler.synthesize({ text: "test", speed }),
        ).resolves.toBeDefined();
      }
    });
  });

  describe("error handling", () => {
    it("should handle API errors gracefully", async () => {
      const apiError = new Error("API rate limit exceeded");
      mockCreate.mockRejectedValue(apiError);

      await expect(handler.synthesize({ text: "test" })).rejects.toThrow(
        "API rate limit exceeded",
      );
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network connection failed");
      mockCreate.mockRejectedValue(networkError);

      await expect(handler.synthesize({ text: "test" })).rejects.toThrow(
        "Network connection failed",
      );
    });
  });

  describe("TTSResult structure", () => {
    beforeEach(() => {
      const mockArrayBuffer = new ArrayBuffer(2048);
      mockCreate.mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      });
    });

    it("should return correct TTSResult structure", async () => {
      const result = await handler.synthesize({
        text: "Test message",
        voice: "nova",
        format: "wav",
      });

      // Verify structure matches TTSResult type
      expect(result).toEqual({
        buffer: expect.any(Buffer),
        format: "wav",
        size: 2048,
        duration: expect.any(Number),
        voice: "nova",
        sampleRate: undefined,
      });
    });

    it("should have buffer as Buffer instance", async () => {
      const result = await handler.synthesize({ text: "test" });
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });

    it("should have correct size matching buffer length", async () => {
      const result = await handler.synthesize({ text: "test" });
      expect(result.size).toBe(result.buffer.length);
    });

    it("should have sampleRate as undefined for OpenAI", async () => {
      const result = await handler.synthesize({ text: "test" });
      expect(result.sampleRate).toBeUndefined();
    });
  });
});
