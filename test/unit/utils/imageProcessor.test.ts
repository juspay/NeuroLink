/**
 * ImageProcessor EXIF Handling Tests
 *
 * Tests for EXIF orientation tag parsing and dimension adjustment
 */

import { describe, it, expect } from "vitest";
import { ImageProcessor } from "../../../src/lib/utils/imageProcessor.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("ImageProcessor EXIF Handling", () => {
  const fixturesDir = path.join(__dirname, "../../fixtures/images");

  // Helper to read fixture file
  const readFixture = (filename: string): Buffer => {
    return fs.readFileSync(path.join(fixturesDir, filename));
  };

  describe("getExifOrientation", () => {
    it("should return null for non-JPEG buffers", () => {
      const pngBuffer = readFixture("test.png");
      expect(ImageProcessor.getExifOrientation(pngBuffer)).toBeNull();
    });

    it("should return null for JPEG without EXIF data", () => {
      const jpegBuffer = readFixture("no-exif.jpg");
      expect(ImageProcessor.getExifOrientation(jpegBuffer)).toBeNull();
    });

    it("should return null for empty buffer", () => {
      expect(ImageProcessor.getExifOrientation(Buffer.alloc(0))).toBeNull();
    });

    it("should return null for buffer with only JPEG header", () => {
      const minimalJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
      expect(ImageProcessor.getExifOrientation(minimalJpeg)).toBeNull();
    });

    it.each([1, 2, 3, 4, 5, 6, 7, 8])(
      "should correctly parse EXIF orientation %i",
      (orientation) => {
        const jpegBuffer = readFixture(`exif-orientation-${orientation}.jpg`);
        expect(ImageProcessor.getExifOrientation(jpegBuffer)).toBe(orientation);
      },
    );
  });

  describe("getRotationFromOrientation", () => {
    it.each([
      [1, 0], // Normal
      [2, 0], // Flipped horizontally
      [3, 180], // Rotated 180
      [4, 180], // Flipped vertically (same as 180 + h-flip)
      [5, 90], // Rotated 90 CW + h-flip
      [6, 90], // Rotated 90 CW
      [7, 270], // Rotated 90 CCW + h-flip
      [8, 270], // Rotated 90 CCW
    ])(
      "should return %i degrees for orientation %i",
      (orientation, expectedRotation) => {
        expect(ImageProcessor.getRotationFromOrientation(orientation)).toBe(
          expectedRotation,
        );
      },
    );

    it("should return 0 for invalid orientations", () => {
      expect(ImageProcessor.getRotationFromOrientation(0)).toBe(0);
      expect(ImageProcessor.getRotationFromOrientation(9)).toBe(0);
      expect(ImageProcessor.getRotationFromOrientation(-1)).toBe(0);
    });
  });

  describe("shouldSwapDimensions", () => {
    it.each([
      [1, false], // Normal
      [2, false], // Flipped horizontally
      [3, false], // Rotated 180
      [4, false], // Flipped vertically
      [5, true], // Rotated 90 CW + h-flip (swap needed)
      [6, true], // Rotated 90 CW (swap needed)
      [7, true], // Rotated 90 CCW + h-flip (swap needed)
      [8, true], // Rotated 90 CCW (swap needed)
    ])("should return %s for orientation %i", (orientation, shouldSwap) => {
      expect(ImageProcessor.shouldSwapDimensions(orientation)).toBe(shouldSwap);
    });
  });

  describe("getRawImageDimensions", () => {
    it("should extract dimensions from PNG without EXIF adjustment", () => {
      const pngBuffer = readFixture("test.png");
      const dimensions = ImageProcessor.getRawImageDimensions(pngBuffer);
      expect(dimensions).toEqual({ width: 3, height: 5 });
    });

    it("should extract dimensions from JPEG", () => {
      const jpegBuffer = readFixture("no-exif.jpg");
      const dimensions = ImageProcessor.getRawImageDimensions(jpegBuffer);
      expect(dimensions).toEqual({ width: 2, height: 4 });
    });

    it("should return null for unsupported formats", () => {
      const invalidBuffer = Buffer.from("not an image");
      expect(ImageProcessor.getRawImageDimensions(invalidBuffer)).toBeNull();
    });
  });

  describe("getOrientationAdjustedDimensions", () => {
    it("should return raw dimensions for PNG (no EXIF)", () => {
      const pngBuffer = readFixture("test.png");
      const result = ImageProcessor.getOrientationAdjustedDimensions(pngBuffer);
      expect(result).toEqual({
        width: 3,
        height: 5,
        orientation: null,
      });
    });

    it("should return raw dimensions for JPEG without EXIF", () => {
      const jpegBuffer = readFixture("no-exif.jpg");
      const result =
        ImageProcessor.getOrientationAdjustedDimensions(jpegBuffer);
      expect(result).toEqual({
        width: 2,
        height: 4,
        orientation: null,
      });
    });

    it.each([1, 2, 3, 4])(
      "should NOT swap dimensions for orientation %i",
      (orientation) => {
        const jpegBuffer = readFixture(`exif-orientation-${orientation}.jpg`);
        const result =
          ImageProcessor.getOrientationAdjustedDimensions(jpegBuffer);
        // Original image is 2x4
        expect(result).toEqual({
          width: 2,
          height: 4,
          orientation,
        });
      },
    );

    it.each([5, 6, 7, 8])(
      "should swap dimensions for orientation %i (90/270 rotation)",
      (orientation) => {
        const jpegBuffer = readFixture(`exif-orientation-${orientation}.jpg`);
        const result =
          ImageProcessor.getOrientationAdjustedDimensions(jpegBuffer);
        // Original image is 2x4, swapped becomes 4x2
        expect(result).toEqual({
          width: 4,
          height: 2,
          orientation,
        });
      },
    );

    it("should return null for invalid image data", () => {
      const invalidBuffer = Buffer.from("invalid image data");
      expect(
        ImageProcessor.getOrientationAdjustedDimensions(invalidBuffer),
      ).toBeNull();
    });
  });

  describe("getImageDimensions (EXIF-aware)", () => {
    it("should return EXIF-adjusted dimensions for JPEG with orientation 6", () => {
      // Orientation 6 = 90 degrees CW rotation, needs swap
      const jpegBuffer = readFixture("exif-orientation-6.jpg");
      const dimensions = ImageProcessor.getImageDimensions(jpegBuffer);
      // Original is 2x4, displayed as 4x2 after 90 degree rotation
      expect(dimensions).toEqual({ width: 4, height: 2 });
    });

    it("should return raw dimensions for JPEG with orientation 1", () => {
      // Orientation 1 = normal, no swap needed
      const jpegBuffer = readFixture("exif-orientation-1.jpg");
      const dimensions = ImageProcessor.getImageDimensions(jpegBuffer);
      expect(dimensions).toEqual({ width: 2, height: 4 });
    });

    it("should return raw dimensions for PNG (no EXIF support in PNG)", () => {
      const pngBuffer = readFixture("test.png");
      const dimensions = ImageProcessor.getImageDimensions(pngBuffer);
      expect(dimensions).toEqual({ width: 3, height: 5 });
    });

    it("should return null for invalid buffer", () => {
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02]);
      expect(ImageProcessor.getImageDimensions(invalidBuffer)).toBeNull();
    });
  });

  describe("ORIENTATION_REQUIRES_SWAP constant", () => {
    it("should contain orientations that require dimension swapping", () => {
      expect(ImageProcessor.ORIENTATION_REQUIRES_SWAP).toEqual([5, 6, 7, 8]);
    });
  });

  describe("Edge cases", () => {
    it("should handle truncated EXIF data gracefully", () => {
      // Create a JPEG with truncated EXIF
      const truncatedJpeg = Buffer.from([
        0xff,
        0xd8, // SOI
        0xff,
        0xe1, // APP1
        0x00,
        0x08, // Length (8 bytes - but data is truncated)
        0x45,
        0x78,
        0x69,
        0x66, // "Exif"
      ]);
      expect(ImageProcessor.getExifOrientation(truncatedJpeg)).toBeNull();
    });

    it("should handle JPEG with non-EXIF APP1 data", () => {
      // APP1 but not EXIF (e.g., XMP data)
      const xmpJpeg = Buffer.from([
        0xff,
        0xd8, // SOI
        0xff,
        0xe1, // APP1
        0x00,
        0x10, // Length
        0x68,
        0x74,
        0x74,
        0x70, // "http" - XMP namespace
        0x3a,
        0x2f,
        0x2f,
        0x6e,
        0x73,
        0x00,
        0xff,
        0xd9, // EOI
      ]);
      expect(ImageProcessor.getExifOrientation(xmpJpeg)).toBeNull();
    });
  });
});
