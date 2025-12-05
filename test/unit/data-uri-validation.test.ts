/**
 * Data URI Validation Tests
 *
 * Tests to validate the strict data URI validation in imageProcessor.ts
 * This addresses the IMG-020 issue: Weak Data URI Validation
 *
 * The tests verify:
 * - Strict data URI regex validation
 * - MIME type format validation (type/subtype)
 * - Base64 content validation
 */

import { describe, it, expect } from "vitest";
import { imageUtils } from "../../src/lib/utils/imageProcessor.js";

describe("Data URI Validation - imageUtils.isDataUri", () => {
  describe("Valid Data URIs", () => {
    it("should accept valid PNG data URI", () => {
      // Minimal valid PNG (1x1 transparent pixel)
      const validPng =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      expect(imageUtils.isDataUri(validPng)).toBe(true);
    });

    it("should accept valid JPEG data URI", () => {
      // Valid base64 encoded JPEG signature
      const validJpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/";
      expect(imageUtils.isDataUri(validJpeg)).toBe(true);
    });

    it("should accept valid GIF data URI", () => {
      // Minimal valid GIF (1x1 pixel)
      const validGif =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      expect(imageUtils.isDataUri(validGif)).toBe(true);
    });

    it("should accept valid WebP data URI", () => {
      const validWebp =
        "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ";
      expect(imageUtils.isDataUri(validWebp)).toBe(true);
    });

    it("should accept valid SVG+XML data URI", () => {
      // Base64 encoded SVG content
      const svgContent = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      ).toString("base64");
      const validSvg = `data:image/svg+xml;base64,${svgContent}`;
      expect(imageUtils.isDataUri(validSvg)).toBe(true);
    });

    it("should accept valid application/pdf data URI", () => {
      // Simple PDF-like base64 content
      const pdfContent = Buffer.from("%PDF-1.4").toString("base64");
      const validPdf = `data:application/pdf;base64,${pdfContent}`;
      expect(imageUtils.isDataUri(validPdf)).toBe(true);
    });

    it("should reject data URI with empty base64 content for security", () => {
      const emptyDataUri = "data:image/png;base64,";
      expect(imageUtils.isDataUri(emptyDataUri)).toBe(false);
    });

    it("should accept data URI with MIME parameters", () => {
      // MIME type with charset parameter
      const textContent = Buffer.from("Hello World").toString("base64");
      const dataUriWithParams = `data:text/plain;charset=UTF-8;base64,${textContent}`;
      expect(imageUtils.isDataUri(dataUriWithParams)).toBe(true);
    });

    it("should accept valid application/octet-stream data URI", () => {
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03]).toString(
        "base64",
      );
      const validBinary = `data:application/octet-stream;base64,${binaryContent}`;
      expect(imageUtils.isDataUri(validBinary)).toBe(true);
    });

    it("should accept data URI with padding characters", () => {
      // Single padding character
      const content1 = Buffer.from("ab").toString("base64"); // "YWI="
      expect(imageUtils.isDataUri(`data:text/plain;base64,${content1}`)).toBe(
        true,
      );

      // Double padding characters
      const content2 = Buffer.from("a").toString("base64"); // "YQ=="
      expect(imageUtils.isDataUri(`data:text/plain;base64,${content2}`)).toBe(
        true,
      );
    });
  });

  describe("Invalid Data URIs - Format Issues", () => {
    it("should reject non-string input", () => {
      expect(imageUtils.isDataUri(null as unknown as string)).toBe(false);
      expect(imageUtils.isDataUri(undefined as unknown as string)).toBe(false);
      expect(imageUtils.isDataUri(123 as unknown as string)).toBe(false);
      expect(imageUtils.isDataUri({} as unknown as string)).toBe(false);
      expect(imageUtils.isDataUri([] as unknown as string)).toBe(false);
    });

    it("should reject empty string", () => {
      expect(imageUtils.isDataUri("")).toBe(false);
    });

    it("should reject string without data: prefix", () => {
      expect(imageUtils.isDataUri("image/png;base64,iVBOR")).toBe(false);
      expect(imageUtils.isDataUri("iVBORw0KGgo")).toBe(false);
    });

    it("should reject data URI without MIME type", () => {
      expect(imageUtils.isDataUri("data:;base64,iVBORw0KGgo")).toBe(false);
    });

    it("should reject data URI without base64 encoding", () => {
      expect(imageUtils.isDataUri("data:image/png,rawdata")).toBe(false);
    });

    it("should reject data URI with only prefix", () => {
      expect(imageUtils.isDataUri("data:")).toBe(false);
    });

    it("should reject plain HTTP URLs", () => {
      expect(imageUtils.isDataUri("http://example.com/image.png")).toBe(false);
      expect(imageUtils.isDataUri("https://example.com/image.png")).toBe(false);
    });

    it("should reject file paths", () => {
      expect(imageUtils.isDataUri("/path/to/image.png")).toBe(false);
      expect(imageUtils.isDataUri("C:\\path\\to\\image.png")).toBe(false);
    });
  });

  describe("Invalid Data URIs - MIME Type Issues", () => {
    it("should reject data URI with invalid MIME type format (missing subtype)", () => {
      expect(imageUtils.isDataUri("data:image;base64,iVBORw0KGgo")).toBe(false);
    });

    it("should reject data URI with invalid MIME type format (missing type)", () => {
      expect(imageUtils.isDataUri("data:/png;base64,iVBORw0KGgo")).toBe(false);
    });

    it("should reject data URI with spaces in MIME type", () => {
      expect(imageUtils.isDataUri("data:image / png;base64,iVBORw0KGgo")).toBe(
        false,
      );
    });

    it("should reject data URI with special characters in MIME type", () => {
      // Invalid characters in MIME type
      expect(imageUtils.isDataUri("data:image/<png>;base64,iVBORw0KGgo")).toBe(
        false,
      );
      expect(imageUtils.isDataUri("data:image/[png];base64,iVBORw0KGgo")).toBe(
        false,
      );
    });

    it("should accept data URI with MIME type starting with alphanumeric", () => {
      // MIME type tokens can start with alphanumeric per RFC 2045
      // While uncommon, types starting with numbers are technically valid
      expect(imageUtils.isDataUri("data:1mage/png;base64,iVBORw0KGgo")).toBe(
        true,
      );
    });
  });

  describe("Invalid Data URIs - Base64 Content Issues", () => {
    it("should reject data URI with invalid base64 characters", () => {
      // Using invalid characters (< and >) in base64 content
      expect(imageUtils.isDataUri("data:image/png;base64,iVBOR<>w0KGgo")).toBe(
        false,
      );
    });

    it("should reject data URI with spaces in base64 content", () => {
      expect(imageUtils.isDataUri("data:image/png;base64,iVBOR w0K Ggo")).toBe(
        false,
      );
    });

    it("should reject data URI with newlines in base64 content", () => {
      expect(imageUtils.isDataUri("data:image/png;base64,iVBOR\nw0KGgo")).toBe(
        false,
      );
    });

    it("should reject data URI with incorrect padding", () => {
      // Three padding characters (invalid - max is 2)
      expect(imageUtils.isDataUri("data:image/png;base64,YWJj===")).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long valid data URIs", () => {
      // Generate a reasonably large valid base64 string (1KB)
      const largeContent = Buffer.alloc(1024, "A").toString("base64");
      const largeDataUri = `data:application/octet-stream;base64,${largeContent}`;
      expect(imageUtils.isDataUri(largeDataUri)).toBe(true);
    });

    it("should accept AVIF image data URI", () => {
      // AVIF is a valid MIME subtype
      const avifContent = Buffer.from([0x00, 0x00, 0x00]).toString("base64");
      const validAvif = `data:image/avif;base64,${avifContent}`;
      expect(imageUtils.isDataUri(validAvif)).toBe(true);
    });

    it("should accept audio MIME types", () => {
      const audioContent = Buffer.from("audio data").toString("base64");
      expect(
        imageUtils.isDataUri(`data:audio/mp3;base64,${audioContent}`),
      ).toBe(true);
      expect(
        imageUtils.isDataUri(`data:audio/wav;base64,${audioContent}`),
      ).toBe(true);
    });

    it("should accept video MIME types", () => {
      const videoContent = Buffer.from("video data").toString("base64");
      expect(
        imageUtils.isDataUri(`data:video/mp4;base64,${videoContent}`),
      ).toBe(true);
    });

    it("should handle data URI with complex but valid MIME parameters", () => {
      const content = Buffer.from("test").toString("base64");
      // Multiple parameters with quoted values
      const complexDataUri = `data:text/plain;charset=UTF-8;name="test file.txt";base64,${content}`;
      expect(imageUtils.isDataUri(complexDataUri)).toBe(true);
    });
  });

  describe("DATA_URI_REGEX constant", () => {
    it("should export DATA_URI_REGEX constant", () => {
      expect(imageUtils.DATA_URI_REGEX).toBeDefined();
      expect(imageUtils.DATA_URI_REGEX).toBeInstanceOf(RegExp);
    });

    it("should capture MIME type and base64 content in regex groups", () => {
      const dataUri =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const match = imageUtils.DATA_URI_REGEX.exec(dataUri);

      expect(match).not.toBeNull();
      expect(match![1]).toBe("image/png");
      expect(match![2]).toContain("iVBORw0KGgo");
    });
  });
});
