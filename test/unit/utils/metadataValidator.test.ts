import { describe, it, expect } from "vitest";
import {
  validateImageMetadata,
  validateAudioMetadata,
  validateVideoMetadata,
  validateDimensions,
  validateDuration,
  validateFilename,
  IMAGE_CONSTRAINTS,
  AUDIO_CONSTRAINTS,
  VIDEO_CONSTRAINTS,
} from "../../../src/lib/utils/metadataValidator.js";
import type {
  ImageContent,
  AudioContent,
  VideoContent,
} from "../../../src/lib/types/multimodal.js";

describe("metadataValidator", () => {
  describe("Image Metadata Validation", () => {
    it("should validate valid image metadata", () => {
      const content: ImageContent = {
        type: "image",
        data: Buffer.from("test"),
        metadata: {
          dimensions: { width: 1920, height: 1080 },
          filename: "photo.jpg",
          quality: "high",
        },
      };

      const result = validateImageMetadata(content);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject negative image width", () => {
      const content: ImageContent = {
        type: "image",
        data: Buffer.from("test"),
        metadata: {
          dimensions: { width: -1920, height: 1080 },
        },
      };

      const result = validateImageMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toContain("width");
    });

    it("should reject negative image height", () => {
      const content: ImageContent = {
        type: "image",
        data: Buffer.from("test"),
        metadata: {
          dimensions: { width: 1920, height: -1080 },
        },
      };

      const result = validateImageMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toContain("height");
    });

    it("should reject image dimensions exceeding maximum", () => {
      const content: ImageContent = {
        type: "image",
        data: Buffer.from("test"),
        metadata: {
          dimensions: {
            width: IMAGE_CONSTRAINTS.MAX_DIMENSION + 1,
            height: 1080,
          },
        },
      };

      const result = validateImageMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toContain("width");
    });

    it("should reject zero dimensions", () => {
      const content: ImageContent = {
        type: "image",
        data: Buffer.from("test"),
        metadata: {
          dimensions: { width: 0, height: 0 },
        },
      };

      const result = validateImageMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject filename exceeding max length", () => {
      const content: ImageContent = {
        type: "image",
        data: Buffer.from("test"),
        metadata: {
          filename: "a".repeat(IMAGE_CONSTRAINTS.MAX_FILENAME_LENGTH + 1),
        },
      };

      const result = validateImageMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.filename");
    });

    it("should accept image without metadata", () => {
      const content: ImageContent = {
        type: "image",
        data: Buffer.from("test"),
      };

      const result = validateImageMetadata(content);
      expect(result.isValid).toBe(true);
    });

    it("should warn about very long descriptions", () => {
      const content: ImageContent = {
        type: "image",
        data: Buffer.from("test"),
        metadata: {
          description: "x".repeat(15000),
        },
      };

      const result = validateImageMetadata(content);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("Audio Metadata Validation", () => {
    it("should validate valid audio metadata", () => {
      const content: AudioContent = {
        type: "audio",
        data: Buffer.from("test"),
        metadata: {
          duration: 120.5,
          sampleRate: 48000,
          channels: 2,
          language: "en",
          filename: "recording.mp3",
        },
      };

      const result = validateAudioMetadata(content);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject negative audio duration", () => {
      const content: AudioContent = {
        type: "audio",
        data: Buffer.from("test"),
        metadata: {
          duration: -10,
        },
      };

      const result = validateAudioMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.duration");
    });

    it("should reject duration exceeding 24 hours", () => {
      const content: AudioContent = {
        type: "audio",
        data: Buffer.from("test"),
        metadata: {
          duration: AUDIO_CONSTRAINTS.MAX_DURATION + 1,
        },
      };

      const result = validateAudioMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.duration");
    });

    it("should reject invalid sample rate (too low)", () => {
      const content: AudioContent = {
        type: "audio",
        data: Buffer.from("test"),
        metadata: {
          sampleRate: 7999,
        },
      };

      const result = validateAudioMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.sampleRate");
    });

    it("should reject invalid sample rate (too high)", () => {
      const content: AudioContent = {
        type: "audio",
        data: Buffer.from("test"),
        metadata: {
          sampleRate: 200000,
        },
      };

      const result = validateAudioMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.sampleRate");
    });

    it("should reject invalid channel count (0)", () => {
      const content: AudioContent = {
        type: "audio",
        data: Buffer.from("test"),
        metadata: {
          channels: 0,
        },
      };

      const result = validateAudioMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.channels");
    });

    it("should reject invalid channel count (too high)", () => {
      const content: AudioContent = {
        type: "audio",
        data: Buffer.from("test"),
        metadata: {
          channels: 9,
        },
      };

      const result = validateAudioMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.channels");
    });

    it("should reject invalid language code format", () => {
      const content: AudioContent = {
        type: "audio",
        data: Buffer.from("test"),
        metadata: {
          language: "eng", // Should be 2 letters
        },
      };

      const result = validateAudioMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.language");
    });

    it("should reject language code with uppercase", () => {
      const content: AudioContent = {
        type: "audio",
        data: Buffer.from("test"),
        metadata: {
          language: "EN", // Should be lowercase
        },
      };

      const result = validateAudioMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.language");
    });

    it("should accept valid ISO 639-1 language codes", () => {
      const languages = ["en", "es", "fr", "de", "ja", "zh"];

      for (const lang of languages) {
        const content: AudioContent = {
          type: "audio",
          data: Buffer.from("test"),
          metadata: { language: lang },
        };

        const result = validateAudioMetadata(content);
        expect(result.isValid).toBe(true);
      }
    });

    it("should reject transcription exceeding max length", () => {
      const content: AudioContent = {
        type: "audio",
        data: Buffer.from("test"),
        metadata: {
          transcription: "x".repeat(
            AUDIO_CONSTRAINTS.MAX_TRANSCRIPTION_LENGTH + 1,
          ),
        },
      };

      const result = validateAudioMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.transcription");
    });

    it("should accept audio without metadata", () => {
      const content: AudioContent = {
        type: "audio",
        data: Buffer.from("test"),
      };

      const result = validateAudioMetadata(content);
      expect(result.isValid).toBe(true);
    });
  });

  describe("Video Metadata Validation", () => {
    it("should validate valid video metadata", () => {
      const content: VideoContent = {
        type: "video",
        data: Buffer.from("test"),
        metadata: {
          duration: 300,
          dimensions: { width: 1920, height: 1080 },
          frameRate: 30,
          codec: "h264",
          filename: "demo.mp4",
        },
      };

      const result = validateVideoMetadata(content);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject negative video dimensions", () => {
      const content: VideoContent = {
        type: "video",
        data: Buffer.from("test"),
        metadata: {
          dimensions: { width: -1920, height: 1080 },
        },
      };

      const result = validateVideoMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toContain("width");
    });

    it("should reject video dimensions exceeding maximum", () => {
      const content: VideoContent = {
        type: "video",
        data: Buffer.from("test"),
        metadata: {
          dimensions: {
            width: VIDEO_CONSTRAINTS.MAX_DIMENSION + 1,
            height: 1080,
          },
        },
      };

      const result = validateVideoMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toContain("width");
    });

    it("should reject invalid frame rate (too low)", () => {
      const content: VideoContent = {
        type: "video",
        data: Buffer.from("test"),
        metadata: {
          frameRate: 0,
        },
      };

      const result = validateVideoMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.frameRate");
    });

    it("should reject invalid frame rate (too high)", () => {
      const content: VideoContent = {
        type: "video",
        data: Buffer.from("test"),
        metadata: {
          frameRate: 250,
        },
      };

      const result = validateVideoMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.frameRate");
    });

    it("should reject codec exceeding max length", () => {
      const content: VideoContent = {
        type: "video",
        data: Buffer.from("test"),
        metadata: {
          codec: "x".repeat(VIDEO_CONSTRAINTS.MAX_CODEC_LENGTH + 1),
        },
      };

      const result = validateVideoMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.codec");
    });

    it("should reject extractedFrames array exceeding max items (DoS protection)", () => {
      const content: VideoContent = {
        type: "video",
        data: Buffer.from("test"),
        metadata: {
          extractedFrames: new Array(
            VIDEO_CONSTRAINTS.MAX_EXTRACTED_FRAMES + 1,
          ).fill("frame"),
        },
      };

      const result = validateVideoMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.extractedFrames");
      expect(result.errors[0].message).toContain("too large");
      expect(result.errors[0].code).toBe("MAX_LENGTH");
    });

    it("should reject non-string items in extractedFrames", () => {
      const content: VideoContent = {
        type: "video",
        data: Buffer.from("test"),
        metadata: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          extractedFrames: ["frame1", 123 as any, "frame3"],
        },
      };

      const result = validateVideoMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.extractedFrames");
    });

    it("should accept valid extractedFrames array", () => {
      const content: VideoContent = {
        type: "video",
        data: Buffer.from("test"),
        metadata: {
          extractedFrames: ["frame1.jpg", "frame2.jpg", "frame3.jpg"],
        },
      };

      const result = validateVideoMetadata(content);
      expect(result.isValid).toBe(true);
    });

    it("should reject transcription exceeding max length", () => {
      const content: VideoContent = {
        type: "video",
        data: Buffer.from("test"),
        metadata: {
          transcription: "x".repeat(
            VIDEO_CONSTRAINTS.MAX_TRANSCRIPTION_LENGTH + 1,
          ),
        },
      };

      const result = validateVideoMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("metadata.transcription");
    });

    it("should accept video without metadata", () => {
      const content: VideoContent = {
        type: "video",
        data: Buffer.from("test"),
      };

      const result = validateVideoMetadata(content);
      expect(result.isValid).toBe(true);
    });
  });

  describe("Helper Functions", () => {
    describe("validateDimensions", () => {
      it("should validate valid dimensions", () => {
        const result = validateDimensions(
          { width: 1920, height: 1080 },
          "dimensions",
          1,
          16384,
        );
        expect(result).toBeNull();
      });

      it("should return null for undefined dimensions", () => {
        const result = validateDimensions(undefined, "dimensions", 1, 16384);
        expect(result).toBeNull();
      });

      it("should reject NaN width", () => {
        const result = validateDimensions(
          { width: NaN, height: 1080 },
          "dimensions",
          1,
          16384,
        );
        expect(result).not.toBeNull();
        expect(result?.field).toContain("width");
      });

      it("should reject NaN height", () => {
        const result = validateDimensions(
          { width: 1920, height: NaN },
          "dimensions",
          1,
          16384,
        );
        expect(result).not.toBeNull();
        expect(result?.field).toContain("height");
      });
    });

    describe("validateDuration", () => {
      it("should validate valid duration", () => {
        const result = validateDuration(120.5, "duration", 0.001, 86400);
        expect(result).toBeNull();
      });

      it("should return null for undefined duration", () => {
        const result = validateDuration(undefined, "duration", 0.001, 86400);
        expect(result).toBeNull();
      });

      it("should reject NaN duration", () => {
        const result = validateDuration(NaN, "duration", 0.001, 86400);
        expect(result).not.toBeNull();
      });

      it("should reject negative duration", () => {
        const result = validateDuration(-10, "duration", 0.001, 86400);
        expect(result).not.toBeNull();
      });
    });

    describe("validateFilename", () => {
      it("should validate valid filename", () => {
        const result = validateFilename("photo.jpg", "filename", 255);
        expect(result).toBeNull();
      });

      it("should return null for undefined filename", () => {
        const result = validateFilename(undefined, "filename", 255);
        expect(result).toBeNull();
      });

      it("should reject filename exceeding max length", () => {
        const result = validateFilename("a".repeat(256), "filename", 255);
        expect(result).not.toBeNull();
      });

      it("should reject non-string filename", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = validateFilename(123 as any, "filename", 255);
        expect(result).not.toBeNull();
      });
    });
  });

  describe("Edge Cases and Security", () => {
    it("should prevent memory DoS with huge extractedFrames array", () => {
      const content: VideoContent = {
        type: "video",
        data: Buffer.from("test"),
        metadata: {
          extractedFrames: new Array(1000000).fill("frame"),
        },
      };

      const result = validateVideoMetadata(content);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain("1000000");
    });

    it("should handle missing metadata gracefully", () => {
      const imageResult = validateImageMetadata({
        type: "image",
        data: Buffer.from("test"),
      });
      expect(imageResult.isValid).toBe(true);

      const audioResult = validateAudioMetadata({
        type: "audio",
        data: Buffer.from("test"),
      });
      expect(audioResult.isValid).toBe(true);

      const videoResult = validateVideoMetadata({
        type: "video",
        data: Buffer.from("test"),
      });
      expect(videoResult.isValid).toBe(true);
    });

    it("should handle partial metadata gracefully", () => {
      const content: ImageContent = {
        type: "image",
        data: Buffer.from("test"),
        metadata: {
          quality: "high",
          // No dimensions or filename
        },
      };

      const result = validateImageMetadata(content);
      expect(result.isValid).toBe(true);
    });
  });
});
