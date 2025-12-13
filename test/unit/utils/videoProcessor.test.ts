import { describe, it, expect } from "vitest";
import { VideoProcessor } from "../../../src/lib/utils/videoProcessor.js";

describe("VideoProcessor", () => {
  describe("isValidVideo", () => {
    describe("MP4/MOV format detection", () => {
      it("should detect valid MP4 format with ftyp signature", () => {
        // MP4 file structure: [size][ftyp][...]
        // Creating a minimal MP4 header with "ftyp" at offset 4
        const buffer = Buffer.alloc(12);
        buffer.write("ftyp", 4, "ascii");

        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });

      it("should detect MP4 with various ftyp subtypes (isom)", () => {
        const buffer = Buffer.alloc(20);
        buffer.write("ftyp", 4, "ascii");
        buffer.write("isom", 8, "ascii"); // ISO Base Media file format

        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });

      it("should detect MP4 with ftyp subtype mp42", () => {
        const buffer = Buffer.alloc(20);
        buffer.write("ftyp", 4, "ascii");
        buffer.write("mp42", 8, "ascii"); // MPEG-4 version 2

        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });

      it("should detect MOV format (same as MP4 with ftyp)", () => {
        const buffer = Buffer.alloc(20);
        buffer.write("ftyp", 4, "ascii");
        buffer.write("qt  ", 8, "ascii"); // QuickTime format

        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });
    });

    describe("WebM/MKV format detection", () => {
      it("should detect valid WebM format with EBML signature", () => {
        // WebM/MKV starts with EBML signature: 0x1A 0x45 0xDF 0xA3
        const buffer = Buffer.from([
          0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00,
        ]);

        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });

      it("should detect MKV format (same EBML signature as WebM)", () => {
        // MKV uses the same EBML container format
        const buffer = Buffer.from([
          0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00,
        ]);

        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });

      it("should not detect invalid EBML signature with one byte off", () => {
        const buffer = Buffer.from([
          0x1a,
          0x45,
          0xdf,
          0xa4, // Last byte is 0xA4 instead of 0xA3
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
        ]);

        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });
    });

    describe("AVI format detection", () => {
      it("should detect valid AVI format with RIFF and AVI signatures", () => {
        // AVI structure: RIFF[size]AVI [LIST...]
        const buffer = Buffer.alloc(12);
        buffer.write("RIFF", 0, "ascii");
        buffer.write("AVI ", 8, "ascii");

        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });

      it("should not detect RIFF without AVI signature", () => {
        // RIFF container but not AVI (could be WAV)
        const buffer = Buffer.alloc(12);
        buffer.write("RIFF", 0, "ascii");
        buffer.write("WAVE", 8, "ascii");

        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should not detect AVI signature without RIFF", () => {
        const buffer = Buffer.alloc(12);
        buffer.write("XXXX", 0, "ascii");
        buffer.write("AVI ", 8, "ascii");

        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });
    });

    describe("Short buffer handling", () => {
      it("should return false for empty buffer", () => {
        const buffer = Buffer.alloc(0);
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should return false for buffer with 1 byte", () => {
        const buffer = Buffer.alloc(1);
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should return false for buffer with 4 bytes", () => {
        const buffer = Buffer.alloc(4);
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should return false for buffer with 8 bytes", () => {
        const buffer = Buffer.alloc(8);
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should return false for buffer with 11 bytes (< 12)", () => {
        const buffer = Buffer.alloc(11);
        buffer.write("ftyp", 4, "ascii");
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should handle exactly 12 bytes correctly for MP4", () => {
        const buffer = Buffer.alloc(12);
        buffer.write("ftyp", 4, "ascii");
        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });

      it("should handle exactly 12 bytes correctly for AVI", () => {
        const buffer = Buffer.alloc(12);
        buffer.write("RIFF", 0, "ascii");
        buffer.write("AVI ", 8, "ascii");
        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });

      it("should handle exactly 12 bytes correctly for WebM", () => {
        const buffer = Buffer.from([
          0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00,
        ]);
        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });
    });

    describe("False positives prevention", () => {
      it("should not detect random data as video", () => {
        const buffer = Buffer.from([
          0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a,
          0x0b,
        ]);
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should not detect text file as video", () => {
        const buffer = Buffer.from("This is a text file, not a video");
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should not detect PDF as video", () => {
        const buffer = Buffer.alloc(12);
        buffer.write("%PDF-1.4", 0, "ascii");
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should not detect PNG as video", () => {
        const buffer = Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
          0x00,
        ]);
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should not detect JPEG as video", () => {
        const buffer = Buffer.from([
          0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00,
          0x00,
        ]);
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should not detect ZIP as video", () => {
        const buffer = Buffer.from([
          0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00,
        ]);
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should not detect partial ftyp without proper offset", () => {
        // ftyp at wrong offset (should be at offset 4)
        const buffer = Buffer.alloc(12);
        buffer.write("ftyp", 0, "ascii");
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should not detect partial RIFF without AVI", () => {
        const buffer = Buffer.alloc(12);
        buffer.write("RIFF", 0, "ascii");
        // Missing AVI signature at offset 8
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });
    });

    describe("Edge cases", () => {
      it("should handle buffer with all zeros", () => {
        const buffer = Buffer.alloc(100);
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should handle buffer with all 0xFF", () => {
        const buffer = Buffer.alloc(100);
        buffer.fill(0xff);
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });

      it("should handle very large buffer with valid MP4 signature", () => {
        const buffer = Buffer.alloc(10000);
        buffer.write("ftyp", 4, "ascii");
        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });

      it("should handle buffer with valid signature followed by garbage", () => {
        const buffer = Buffer.alloc(100);
        buffer.write("ftyp", 4, "ascii");
        // Fill rest with random data
        for (let i = 12; i < 100; i++) {
          buffer[i] = Math.floor(Math.random() * 256);
        }
        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });

      it("should handle case sensitivity for ASCII signatures", () => {
        // Test that signatures are case-sensitive
        const buffer = Buffer.alloc(12);
        buffer.write("FTYP", 4, "ascii"); // Uppercase instead of lowercase
        expect(VideoProcessor.isValidVideo(buffer)).toBe(false);
      });
    });

    describe("Multiple format detection", () => {
      it("should prioritize first valid format found (MP4)", () => {
        // Valid MP4 signature
        const buffer = Buffer.alloc(20);
        buffer.write("ftyp", 4, "ascii");
        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });

      it("should detect WebM when MP4 check fails", () => {
        // Valid WebM signature
        const buffer = Buffer.from([
          0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00,
        ]);
        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });

      it("should detect AVI when MP4 and WebM checks fail", () => {
        // Valid AVI signature
        const buffer = Buffer.alloc(20);
        buffer.write("RIFF", 0, "ascii");
        buffer.write("AVI ", 8, "ascii");
        expect(VideoProcessor.isValidVideo(buffer)).toBe(true);
      });
    });
  });
});
