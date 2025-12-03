import { describe, it, expect } from "vitest";
import type {
  AudioFormat,
  TTSOptions,
  TTSStreamOptions,
  TTSResult,
  TTSVoice,
  TTSCapabilities,
  TTSMetadata,
  TTSHandler,
  TTSChunk,
  TTSErrorCode,
  TTSStreamProgress,
} from "../../../src/lib/types/tts.js";
import { TTSError } from "../../../src/lib/types/tts.js";

describe("TTS Type Definitions", () => {
  describe("AudioFormat", () => {
    it("should accept valid audio formats", () => {
      const formats: AudioFormat[] = [
        "mp3",
        "wav",
        "ogg",
        "opus",
        "aac",
        "flac",
        "pcm",
        "mulaw",
        "alaw",
      ];

      expect(formats).toHaveLength(9);
      expect(formats).toContain("mp3");
      expect(formats).toContain("opus");
    });
  });

  describe("TTSErrorCode", () => {
    it("should include all expected error codes", () => {
      const errorCodes: TTSErrorCode[] = [
        "INVALID_VOICE",
        "UNSUPPORTED_FORMAT",
        "UNSUPPORTED_LANGUAGE",
        "TEXT_TOO_LONG",
        "INVALID_SSML",
        "RATE_LIMIT_EXCEEDED",
        "AUTHENTICATION_FAILED",
        "NETWORK_ERROR",
        "SYNTHESIS_FAILED",
        "STREAMING_ERROR",
        "INVALID_CONFIGURATION",
        "PROVIDER_ERROR",
        "TIMEOUT",
        "UNKNOWN_ERROR",
      ];

      expect(errorCodes).toHaveLength(14);
      expect(errorCodes).toContain("INVALID_VOICE");
      expect(errorCodes).toContain("SYNTHESIS_FAILED");
    });
  });

  describe("TTSVoice", () => {
    it("should create a valid voice object", () => {
      const voice: TTSVoice = {
        id: "en-US-Neural2-F",
        name: "Jenny",
        language: "en-US",
        gender: "female",
        type: "neural",
        provider: "google-ai",
        supportsSsml: true,
      };

      expect(voice.id).toBe("en-US-Neural2-F");
      expect(voice.name).toBe("Jenny");
      expect(voice.language).toBe("en-US");
      expect(voice.gender).toBe("female");
      expect(voice.type).toBe("neural");
      expect(voice.provider).toBe("google-ai");
      expect(voice.supportsSsml).toBe(true);
    });

    it("should work with minimal required fields", () => {
      const voice: TTSVoice = {
        id: "test-voice",
        name: "Test",
        language: "en-US",
      };

      expect(voice.id).toBe("test-voice");
      expect(voice.gender).toBeUndefined();
      expect(voice.type).toBeUndefined();
    });
  });

  describe("TTSCapabilities", () => {
    it("should create valid capabilities object", () => {
      const capabilities: TTSCapabilities = {
        formats: ["mp3", "wav", "opus"],
        voices: 50,
        languages: ["en-US", "es-ES", "fr-FR"],
        streaming: true,
        ssml: true,
        customVoice: false,
        maxTextLength: 5000,
        supportsPitch: true,
        supportsSpeed: true,
        supportsVolume: true,
      };

      expect(capabilities.formats).toHaveLength(3);
      expect(capabilities.voices).toBe(50);
      expect(capabilities.languages).toHaveLength(3);
      expect(capabilities.streaming).toBe(true);
      expect(capabilities.ssml).toBe(true);
      expect(capabilities.customVoice).toBe(false);
    });
  });

  describe("TTSOptions", () => {
    it("should create valid basic options", () => {
      const options: TTSOptions = {
        text: "Hello, world!",
        voice: "en-US-Neural2-F",
        format: "mp3",
      };

      expect(options.text).toBe("Hello, world!");
      expect(options.voice).toBe("en-US-Neural2-F");
      expect(options.format).toBe("mp3");
    });

    it("should support advanced options", () => {
      const options: TTSOptions = {
        text: "<speak>Hello <break time='500ms'/> world!</speak>",
        voice: "en-US-Neural2-F",
        format: "opus",
        ssml: true,
        speed: 1.2,
        pitch: 0.5,
        volume: 0.8,
        sampleRate: 24000,
        language: "en-US",
        effects: ["reverb", "echo"],
        timeout: 30000,
      };

      expect(options.ssml).toBe(true);
      expect(options.speed).toBe(1.2);
      expect(options.pitch).toBe(0.5);
      expect(options.volume).toBe(0.8);
      expect(options.sampleRate).toBe(24000);
      expect(options.effects).toHaveLength(2);
    });
  });

  describe("TTSStreamOptions", () => {
    it("should extend TTSOptions with streaming configuration", () => {
      const options: TTSStreamOptions = {
        text: "This is a streaming test",
        voice: "test-voice",
        format: "opus",
        chunkSize: 4096,
        bufferSize: 8192,
        enableProgress: true,
        autoStart: true,
        maxConcurrentStreams: 2,
      };

      expect(options.text).toBe("This is a streaming test");
      expect(options.chunkSize).toBe(4096);
      expect(options.bufferSize).toBe(8192);
      expect(options.enableProgress).toBe(true);
      expect(options.autoStart).toBe(true);
      expect(options.maxConcurrentStreams).toBe(2);
    });
  });

  describe("TTSStreamProgress", () => {
    it("should create valid progress tracking object", () => {
      const progress: TTSStreamProgress = {
        bytesProcessed: 1024,
        totalBytes: 4096,
        chunkCount: 5,
        elapsedTime: 500,
        estimatedRemaining: 1500,
        phase: "streaming",
        progress: 25,
      };

      expect(progress.bytesProcessed).toBe(1024);
      expect(progress.totalBytes).toBe(4096);
      expect(progress.chunkCount).toBe(5);
      expect(progress.phase).toBe("streaming");
      expect(progress.progress).toBe(25);
    });
  });

  describe("TTSChunk", () => {
    it("should create valid audio chunk", () => {
      const chunk: TTSChunk = {
        data: Buffer.from("audio data"),
        format: "opus",
        sampleRate: 24000,
        channels: 1,
        encoding: "PCM16LE",
        timestamp: Date.now(),
        sequenceNumber: 1,
        isLast: false,
        size: 1024,
        duration: 100,
      };

      expect(chunk.format).toBe("opus");
      expect(chunk.sampleRate).toBe(24000);
      expect(chunk.channels).toBe(1);
      expect(chunk.encoding).toBe("PCM16LE");
      expect(chunk.sequenceNumber).toBe(1);
      expect(chunk.isLast).toBe(false);
      expect(chunk.size).toBe(1024);
    });
  });

  describe("TTSMetadata", () => {
    it("should create valid metadata object", () => {
      const metadata: TTSMetadata = {
        duration: 3500,
        sampleRate: 24000,
        channels: 1,
        size: 48000,
        format: "mp3",
        voice: "en-US-Neural2-F",
        language: "en-US",
        synthesisTime: 250,
        textLength: 120,
        cost: 0.001,
        model: "tts-1",
        timestamp: Date.now(),
        usedSsml: false,
      };

      expect(metadata.duration).toBe(3500);
      expect(metadata.sampleRate).toBe(24000);
      expect(metadata.channels).toBe(1);
      expect(metadata.size).toBe(48000);
      expect(metadata.format).toBe("mp3");
      expect(metadata.voice).toBe("en-US-Neural2-F");
      expect(metadata.language).toBe("en-US");
      expect(metadata.synthesisTime).toBe(250);
      expect(metadata.textLength).toBe(120);
      expect(metadata.cost).toBe(0.001);
    });
  });

  describe("TTSResult", () => {
    it("should create valid result for non-streaming synthesis", () => {
      const result: TTSResult = {
        audio: Buffer.from("audio data"),
        format: "mp3",
        metadata: {
          duration: 3000,
          sampleRate: 24000,
          size: 48000,
        },
        provider: "google-ai",
        voice: "en-US-Neural2-F",
      };

      expect(result.audio).toBeDefined();
      expect(result.format).toBe("mp3");
      expect(result.metadata.duration).toBe(3000);
      expect(result.provider).toBe("google-ai");
      expect(result.voice).toBe("en-US-Neural2-F");
    });

    it("should support streaming result", () => {
      const result: TTSResult = {
        stream: (async function* () {
          yield {
            data: Buffer.from("chunk1"),
            format: "opus" as AudioFormat,
            sampleRate: 24000,
            channels: 1,
            timestamp: Date.now(),
            sequenceNumber: 1,
            isLast: false,
            size: 1024,
          };
        })(),
        format: "opus",
        metadata: {
          duration: 5000,
        },
      };

      expect(result.stream).toBeDefined();
      expect(result.format).toBe("opus");
    });
  });

  describe("TTSError", () => {
    it("should create error with all properties", () => {
      const error = new TTSError(
        "Voice not found",
        "INVALID_VOICE",
        "google-ai",
        { voiceId: "invalid-id" },
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TTSError);
      expect(error.name).toBe("TTSError");
      expect(error.message).toBe("[google-ai] Voice not found");
      expect(error.code).toBe("INVALID_VOICE");
      expect(error.provider).toBe("google-ai");
      expect(error.details).toEqual({ voiceId: "invalid-id" });
    });

    it("should create error without provider", () => {
      const error = new TTSError("Generic error", "UNKNOWN_ERROR");

      expect(error.message).toBe("Generic error");
      expect(error.code).toBe("UNKNOWN_ERROR");
      expect(error.provider).toBeUndefined();
    });

    it("should default to UNKNOWN_ERROR code", () => {
      const error = new TTSError("Some error");

      expect(error.code).toBe("UNKNOWN_ERROR");
    });

    it("should serialize to JSON", () => {
      const error = new TTSError(
        "Test error",
        "SYNTHESIS_FAILED",
        "test-provider",
        { reason: "test" },
      );

      const json = error.toJSON();

      expect(json.name).toBe("TTSError");
      expect(json.message).toBe("[test-provider] Test error");
      expect(json.code).toBe("SYNTHESIS_FAILED");
      expect(json.provider).toBe("test-provider");
      expect(json.details).toEqual({ reason: "test" });
      expect(json.stack).toBeDefined();
    });

    it("should include cause if provided", () => {
      const originalError = new Error("Original error");
      const error = new TTSError(
        "Wrapped error",
        "NETWORK_ERROR",
        undefined,
        undefined,
        originalError,
      );

      expect(error.cause).toBe(originalError);
    });
  });

  describe("TTSHandler interface", () => {
    it("should define the contract for TTS providers", () => {
      // This test verifies that a mock implementation satisfies the interface
      const mockHandler: TTSHandler = {
        async synthesize(options: TTSOptions): Promise<TTSResult> {
          return {
            audio: Buffer.from("mock audio"),
            format: options.format || "mp3",
            metadata: {
              textLength: options.text.length,
            },
          };
        },

        async synthesizeStream(
          options: TTSStreamOptions,
        ): Promise<TTSResult> {
          return {
            stream: (async function* () {
              yield {
                data: Buffer.from("chunk"),
                format: options.format || "mp3",
                sampleRate: 24000,
                channels: 1,
                timestamp: Date.now(),
                sequenceNumber: 1,
                isLast: true,
                size: 1024,
              };
            })(),
            format: options.format || "mp3",
            metadata: {},
          };
        },

        async listVoices(language?: string): Promise<TTSVoice[]> {
          return [
            {
              id: "test-voice",
              name: "Test Voice",
              language: language || "en-US",
            },
          ];
        },

        async getCapabilities(): Promise<TTSCapabilities> {
          return {
            formats: ["mp3", "wav"],
            voices: 10,
            languages: ["en-US"],
            streaming: true,
            ssml: true,
            customVoice: false,
          };
        },

        async isAvailable(): Promise<boolean> {
          return true;
        },

        async validateOptions(
          options: TTSOptions | TTSStreamOptions,
        ): Promise<boolean> {
          return options.text.length > 0 && options.voice.length > 0;
        },

        getName(): string {
          return "MockTTSHandler";
        },
      };

      // Test that the mock handler works
      expect(mockHandler).toBeDefined();
      expect(mockHandler.getName?.()).toBe("MockTTSHandler");
    });

    it("should work with minimal implementation", async () => {
      const minimalHandler: TTSHandler = {
        async synthesize(): Promise<TTSResult> {
          return {
            audio: Buffer.from("audio"),
            format: "mp3",
            metadata: {},
          };
        },

        async synthesizeStream(): Promise<TTSResult> {
          return {
            format: "mp3",
            metadata: {},
          };
        },

        async listVoices(): Promise<TTSVoice[]> {
          return [];
        },

        async getCapabilities(): Promise<TTSCapabilities> {
          return {
            formats: ["mp3"],
            voices: 0,
            languages: [],
            streaming: false,
            ssml: false,
            customVoice: false,
          };
        },

        async isAvailable(): Promise<boolean> {
          return true;
        },
      };

      const available = await minimalHandler.isAvailable();
      expect(available).toBe(true);

      const capabilities = await minimalHandler.getCapabilities();
      expect(capabilities.formats).toContain("mp3");
    });
  });
});
