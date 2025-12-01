import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AudioProcessor,
  audioUtils,
  type TranscriptionOptions,
} from "../../../src/lib/utils/audioProcessor.js";

describe("AudioProcessor", () => {
  describe("transcribeWithGoogle", () => {
    it("should throw 'not yet implemented' error with guidance to use OpenAI", async () => {
      const options: TranscriptionOptions = {
        audio: Buffer.from("test audio data"),
        language: "en-US",
      };

      await expect(
        AudioProcessor.transcribeWithGoogle(options),
      ).rejects.toThrow(
        "Google Speech-to-Text transcription is not yet implemented",
      );

      await expect(
        AudioProcessor.transcribeWithGoogle(options),
      ).rejects.toThrow("Please use the OpenAI provider");
    });

    it("should throw error with clear message about future implementation", async () => {
      const options: TranscriptionOptions = {
        audio: Buffer.from("test"),
      };

      try {
        await AudioProcessor.transcribeWithGoogle(options);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("not yet implemented");
        expect((error as Error).message).toContain("OpenAI provider");
        expect((error as Error).message).toContain("future release");
      }
    });
  });

  describe("detectAudioType", () => {
    it("should detect WAV format", () => {
      const wavHeader = Buffer.from([
        0x52,
        0x49,
        0x46,
        0x46, // RIFF
        0x00,
        0x00,
        0x00,
        0x00, // file size (placeholder)
        0x57,
        0x41,
        0x56,
        0x45, // WAVE
      ]);
      expect(AudioProcessor.detectAudioType(wavHeader)).toBe("audio/wav");
    });

    it("should detect MP3 format with ID3 header", () => {
      const mp3Header = Buffer.from([0x49, 0x44, 0x33]); // ID3
      expect(AudioProcessor.detectAudioType(mp3Header)).toBe("audio/mpeg");
    });

    it("should detect MP3 format with sync bytes", () => {
      const mp3Header = Buffer.from([0xff, 0xfb, 0x00, 0x00]);
      expect(AudioProcessor.detectAudioType(mp3Header)).toBe("audio/mpeg");
    });

    it("should detect OGG format", () => {
      // OGG files need at least 12 bytes for detection, pad with zeros
      const oggHeader = Buffer.from([
        0x4f,
        0x67,
        0x67,
        0x53, // OggS
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);
      expect(AudioProcessor.detectAudioType(oggHeader)).toBe("audio/ogg");
    });

    it("should detect FLAC format", () => {
      // FLAC files need at least 12 bytes for detection, pad with zeros
      const flacHeader = Buffer.from([
        0x66,
        0x4c,
        0x61,
        0x43, // fLaC
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);
      expect(AudioProcessor.detectAudioType(flacHeader)).toBe("audio/flac");
    });

    it("should detect M4A/AAC format", () => {
      // M4A/AAC files need at least 12 bytes for ftyp detection
      const m4aHeader = Buffer.from([
        0x00,
        0x00,
        0x00,
        0x20, // Box size
        0x66,
        0x74,
        0x79,
        0x70, // ftyp
        0x4d,
        0x34,
        0x41,
        0x20, // M4A brand
      ]);
      expect(AudioProcessor.detectAudioType(m4aHeader)).toBe("audio/mp4");
    });

    it("should detect WebM format", () => {
      // WebM files need at least 12 bytes for detection, pad with zeros
      const webmHeader = Buffer.from([
        0x1a,
        0x45,
        0xdf,
        0xa3, // WebM EBML header
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]);
      expect(AudioProcessor.detectAudioType(webmHeader)).toBe("audio/webm");
    });

    it("should return default for unknown format", () => {
      const unknownData = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      expect(AudioProcessor.detectAudioType(unknownData)).toBe("audio/mpeg");
    });

    it("should handle small buffers", () => {
      const smallBuffer = Buffer.from([0x00, 0x01]);
      expect(AudioProcessor.detectAudioType(smallBuffer)).toBe("audio/mpeg");
    });
  });

  describe("validateAudioSize", () => {
    it("should accept audio within size limit", () => {
      const audio = Buffer.alloc(10 * 1024 * 1024); // 10MB
      expect(AudioProcessor.validateAudioSize(audio)).toBe(true);
    });

    it("should reject audio exceeding default size limit (25MB)", () => {
      const audio = Buffer.alloc(26 * 1024 * 1024); // 26MB
      expect(AudioProcessor.validateAudioSize(audio)).toBe(false);
    });

    it("should respect custom size limits", () => {
      const audio = Buffer.alloc(5 * 1024 * 1024); // 5MB
      expect(AudioProcessor.validateAudioSize(audio, 4 * 1024 * 1024)).toBe(
        false,
      );
      expect(AudioProcessor.validateAudioSize(audio, 10 * 1024 * 1024)).toBe(
        true,
      );
    });

    it("should accept empty buffer", () => {
      expect(AudioProcessor.validateAudioSize(Buffer.alloc(0))).toBe(true);
    });
  });

  describe("validateAudioFormat", () => {
    it("should accept supported audio formats", () => {
      const formats = [
        "audio/wav",
        "audio/wave",
        "audio/x-wav",
        "audio/mpeg",
        "audio/mp3",
        "audio/mp4",
        "audio/m4a",
        "audio/ogg",
        "audio/flac",
        "audio/webm",
      ];

      for (const format of formats) {
        expect(AudioProcessor.validateAudioFormat(format)).toBe(true);
      }
    });

    it("should be case insensitive", () => {
      expect(AudioProcessor.validateAudioFormat("AUDIO/WAV")).toBe(true);
      expect(AudioProcessor.validateAudioFormat("Audio/Mpeg")).toBe(true);
    });

    it("should reject unsupported formats", () => {
      expect(AudioProcessor.validateAudioFormat("video/mp4")).toBe(false);
      expect(AudioProcessor.validateAudioFormat("text/plain")).toBe(false);
      expect(AudioProcessor.validateAudioFormat("audio/unknown")).toBe(false);
    });
  });
});

describe("audioUtils", () => {
  describe("isAudioBuffer", () => {
    it("should return true for valid audio buffers", () => {
      const wavHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
      ]);
      expect(audioUtils.isAudioBuffer(wavHeader)).toBe(true);
    });
  });

  describe("getExtensionFromMimeType", () => {
    it("should return correct extensions for known MIME types", () => {
      expect(audioUtils.getExtensionFromMimeType("audio/wav")).toBe("wav");
      expect(audioUtils.getExtensionFromMimeType("audio/mpeg")).toBe("mp3");
      expect(audioUtils.getExtensionFromMimeType("audio/mp4")).toBe("m4a");
      expect(audioUtils.getExtensionFromMimeType("audio/ogg")).toBe("ogg");
      expect(audioUtils.getExtensionFromMimeType("audio/flac")).toBe("flac");
      expect(audioUtils.getExtensionFromMimeType("audio/webm")).toBe("webm");
    });

    it("should be case insensitive", () => {
      expect(audioUtils.getExtensionFromMimeType("AUDIO/WAV")).toBe("wav");
    });

    it("should return 'bin' for unknown MIME types", () => {
      expect(audioUtils.getExtensionFromMimeType("audio/unknown")).toBe("bin");
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      expect(audioUtils.formatFileSize(0)).toBe("0 Bytes");
      expect(audioUtils.formatFileSize(500)).toBe("500 Bytes");
      expect(audioUtils.formatFileSize(1024)).toBe("1 KB");
      expect(audioUtils.formatFileSize(1048576)).toBe("1 MB");
      expect(audioUtils.formatFileSize(1073741824)).toBe("1 GB");
    });

    it("should handle decimal values", () => {
      expect(audioUtils.formatFileSize(1536)).toBe("1.5 KB");
      expect(audioUtils.formatFileSize(2621440)).toBe("2.5 MB");
    });
  });
});
