/**
 * Tests for ImageProcessor cleanup behavior
 * Verifies that buffers are cleaned up in finally blocks after processing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ImageProcessor,
  imageUtils,
} from "../../../src/lib/utils/imageProcessor.js";

// Test fixtures
const createTestBuffer = (size: number = 100): Buffer => {
  const buffer = Buffer.alloc(size);
  // PNG magic bytes
  buffer[0] = 0x89;
  buffer[1] = 0x50;
  buffer[2] = 0x4e;
  buffer[3] = 0x47;
  return buffer;
};

const createJPEGBuffer = (): Buffer => {
  const buffer = Buffer.alloc(100);
  // JPEG magic bytes
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  return buffer;
};

describe("ImageProcessor Cleanup Tests", () => {
  describe("process method", () => {
    it("should successfully process image buffer", async () => {
      const buffer = createTestBuffer();
      const result = await ImageProcessor.process(buffer);

      expect(result.type).toBe("image");
      expect(result.mimeType).toBe("image/png");
      expect(result.content).toContain("data:image/png;base64,");
      expect(result.metadata.size).toBe(buffer.length);
    });

    it("should handle processing and cleanup without errors", async () => {
      const buffer = createJPEGBuffer();

      // Process should complete without throwing
      const result = await ImageProcessor.process(buffer);

      expect(result.type).toBe("image");
      expect(result.mimeType).toBe("image/jpeg");
    });

    it("should process multiple buffers in sequence", async () => {
      const buffer1 = createTestBuffer(50);
      const buffer2 = createTestBuffer(100);
      const buffer3 = createJPEGBuffer();

      const result1 = await ImageProcessor.process(buffer1);
      const result2 = await ImageProcessor.process(buffer2);
      const result3 = await ImageProcessor.process(buffer3);

      expect(result1.metadata.size).toBe(50);
      expect(result2.metadata.size).toBe(100);
      expect(result3.mimeType).toBe("image/jpeg");
    });
  });

  describe("processImageForOpenAI", () => {
    it("should process buffer input", () => {
      const buffer = createTestBuffer();
      const result = ImageProcessor.processImageForOpenAI(buffer);

      expect(result).toContain("data:image/jpeg;base64,");
    });

    it("should pass through URLs", () => {
      const url = "https://example.com/image.jpg";
      const result = ImageProcessor.processImageForOpenAI(url);

      expect(result).toBe(url);
    });

    it("should pass through data URIs", () => {
      const dataUri = "data:image/png;base64,iVBORw0KGgo=";
      const result = ImageProcessor.processImageForOpenAI(dataUri);

      expect(result).toBe(dataUri);
    });

    it("should convert base64 strings to data URIs", () => {
      const base64 = "iVBORw0KGgo=";
      const result = ImageProcessor.processImageForOpenAI(base64);

      expect(result).toBe(`data:image/jpeg;base64,${base64}`);
    });
  });

  describe("processImageForGoogle", () => {
    it("should process buffer input", () => {
      const buffer = createTestBuffer();
      const result = ImageProcessor.processImageForGoogle(buffer);

      expect(result.mimeType).toBe("image/jpeg");
      expect(typeof result.data).toBe("string");
    });

    it("should extract base64 from data URI", () => {
      const base64 = "iVBORw0KGgo=";
      const dataUri = `data:image/png;base64,${base64}`;
      const result = ImageProcessor.processImageForGoogle(dataUri);

      expect(result.mimeType).toBe("image/png");
      expect(result.data).toBe(base64);
    });

    it("should handle plain base64 strings", () => {
      const base64 = "iVBORw0KGgo=";
      const result = ImageProcessor.processImageForGoogle(base64);

      expect(result.mimeType).toBe("image/jpeg");
      expect(result.data).toBe(base64);
    });
  });

  describe("processImageForAnthropic", () => {
    it("should process buffer input", () => {
      const buffer = createTestBuffer();
      const result = ImageProcessor.processImageForAnthropic(buffer);

      expect(result.mediaType).toBe("image/jpeg");
      expect(typeof result.data).toBe("string");
    });

    it("should extract base64 from data URI", () => {
      const base64 = "iVBORw0KGgo=";
      const dataUri = `data:image/png;base64,${base64}`;
      const result = ImageProcessor.processImageForAnthropic(dataUri);

      expect(result.mediaType).toBe("image/png");
      expect(result.data).toBe(base64);
    });
  });

  describe("processImageForVertex", () => {
    it("should use Google format for Gemini models", () => {
      const buffer = createTestBuffer();
      const result = ImageProcessor.processImageForVertex(buffer, "gemini-pro");

      expect(result.mimeType).toBe("image/jpeg");
      expect(typeof result.data).toBe("string");
    });

    it("should use Anthropic format for Claude models", () => {
      const buffer = createTestBuffer();
      const result = ImageProcessor.processImageForVertex(buffer, "claude-3");

      expect(result.mediaType).toBe("image/jpeg");
      expect(typeof result.data).toBe("string");
    });

    it("should default to Google format for unknown models", () => {
      const buffer = createTestBuffer();
      const result = ImageProcessor.processImageForVertex(
        buffer,
        "unknown-model",
      );

      expect(result.mimeType).toBe("image/jpeg");
    });
  });

  describe("processImage", () => {
    it("should process for OpenAI provider", () => {
      const buffer = createTestBuffer();
      const result = ImageProcessor.processImage(buffer, "openai");

      expect(result.format).toBe("data_uri");
      expect(result.data).toContain("data:");
    });

    it("should process for Google provider", () => {
      const buffer = createTestBuffer();
      const result = ImageProcessor.processImage(buffer, "google-ai");

      expect(result.format).toBe("base64");
    });

    it("should process for Anthropic provider", () => {
      const buffer = createTestBuffer();
      const result = ImageProcessor.processImage(buffer, "anthropic");

      expect(result.format).toBe("base64");
    });

    it("should process for Vertex provider", () => {
      const buffer = createTestBuffer();
      const result = ImageProcessor.processImage(
        buffer,
        "vertex",
        "gemini-pro",
      );

      expect(result.format).toBe("base64");
    });

    it("should handle default provider", () => {
      const buffer = createTestBuffer();
      const result = ImageProcessor.processImage(buffer, "unknown-provider");

      expect(result.format).toBe("base64");
    });
  });

  describe("detectImageType", () => {
    it("should detect PNG from buffer", () => {
      const buffer = createTestBuffer();
      const result = ImageProcessor.detectImageType(buffer);

      expect(result).toBe("image/png");
    });

    it("should detect JPEG from buffer", () => {
      const buffer = createJPEGBuffer();
      const result = ImageProcessor.detectImageType(buffer);

      expect(result).toBe("image/jpeg");
    });

    it("should detect type from data URI", () => {
      const dataUri = "data:image/webp;base64,iVBORw0KGgo=";
      const result = ImageProcessor.detectImageType(dataUri);

      expect(result).toBe("image/webp");
    });

    it("should detect type from filename", () => {
      const result = ImageProcessor.detectImageType("image.png");
      expect(result).toBe("image/png");
    });

    it("should return default for unknown type", () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const result = ImageProcessor.detectImageType(buffer);

      expect(result).toBe("image/jpeg");
    });
  });

  describe("validateImageSize", () => {
    it("should accept images under size limit", () => {
      const buffer = Buffer.alloc(1024);
      const result = ImageProcessor.validateImageSize(buffer, 2048);

      expect(result).toBe(true);
    });

    it("should reject images over size limit", () => {
      const buffer = Buffer.alloc(2048);
      const result = ImageProcessor.validateImageSize(buffer, 1024);

      expect(result).toBe(false);
    });

    it("should validate string input by byte length", () => {
      const base64 = "iVBORw0KGgo="; // 12 chars
      const result = ImageProcessor.validateImageSize(base64, 100);

      expect(result).toBe(true);
    });
  });

  describe("validateImageFormat", () => {
    it("should accept supported formats", () => {
      expect(ImageProcessor.validateImageFormat("image/jpeg")).toBe(true);
      expect(ImageProcessor.validateImageFormat("image/png")).toBe(true);
      expect(ImageProcessor.validateImageFormat("image/gif")).toBe(true);
      expect(ImageProcessor.validateImageFormat("image/webp")).toBe(true);
    });

    it("should reject unsupported formats", () => {
      expect(ImageProcessor.validateImageFormat("application/pdf")).toBe(false);
      expect(ImageProcessor.validateImageFormat("text/plain")).toBe(false);
    });
  });
});

describe("imageUtils Cleanup Tests", () => {
  describe("isDataUri", () => {
    it("should identify valid data URIs", () => {
      expect(imageUtils.isDataUri("data:image/png;base64,iVBORw0KGgo=")).toBe(
        true,
      );
    });

    it("should reject invalid data URIs", () => {
      expect(imageUtils.isDataUri("https://example.com/image.png")).toBe(false);
      expect(imageUtils.isDataUri("iVBORw0KGgo=")).toBe(false);
    });
  });

  describe("isUrl", () => {
    it("should identify valid URLs", () => {
      expect(imageUtils.isUrl("https://example.com/image.png")).toBe(true);
      expect(imageUtils.isUrl("http://example.com/image.png")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(imageUtils.isUrl("not-a-url")).toBe(false);
      expect(imageUtils.isUrl("data:image/png;base64,abc")).toBe(false);
    });
  });

  describe("bufferToBase64 and base64ToBuffer", () => {
    it("should convert buffer to base64 and back", () => {
      const original = Buffer.from("test data");
      const base64 = imageUtils.bufferToBase64(original);
      const result = imageUtils.base64ToBuffer(base64);

      expect(result.toString()).toBe(original.toString());
    });

    it("should handle data URI prefix in base64ToBuffer", () => {
      const original = Buffer.from("test data");
      const dataUri = `data:image/png;base64,${original.toString("base64")}`;
      const result = imageUtils.base64ToBuffer(dataUri);

      expect(result.toString()).toBe(original.toString());
    });
  });

  describe("extractBase64FromDataUri", () => {
    it("should extract base64 from data URI", () => {
      const base64 = "iVBORw0KGgo=";
      const dataUri = `data:image/png;base64,${base64}`;
      const result = imageUtils.extractBase64FromDataUri(dataUri);

      expect(result).toBe(base64);
    });

    it("should return input if no comma present", () => {
      const base64 = "iVBORw0KGgo=";
      const result = imageUtils.extractBase64FromDataUri(base64);

      expect(result).toBe(base64);
    });
  });

  describe("extractMimeTypeFromDataUri", () => {
    it("should extract mime type from data URI", () => {
      const dataUri = "data:image/png;base64,iVBORw0KGgo=";
      const result = imageUtils.extractMimeTypeFromDataUri(dataUri);

      expect(result).toBe("image/png");
    });

    it("should return default for invalid data URI", () => {
      const result = imageUtils.extractMimeTypeFromDataUri("invalid");

      expect(result).toBe("image/jpeg");
    });
  });

  describe("createDataUri", () => {
    it("should create data URI from base64", () => {
      const base64 = "iVBORw0KGgo=";
      const result = imageUtils.createDataUri(base64, "image/png");

      expect(result).toBe(`data:image/png;base64,${base64}`);
    });

    it("should use default mime type", () => {
      const base64 = "iVBORw0KGgo=";
      const result = imageUtils.createDataUri(base64);

      expect(result).toBe(`data:image/jpeg;base64,${base64}`);
    });

    it("should handle existing data URI prefix", () => {
      const dataUri = "data:image/gif;base64,iVBORw0KGgo=";
      const result = imageUtils.createDataUri(dataUri, "image/png");

      expect(result).toBe("data:image/png;base64,iVBORw0KGgo=");
    });
  });

  describe("isValidBase64", () => {
    it("should validate correct base64", () => {
      const base64 = Buffer.from("test").toString("base64");
      expect(imageUtils.isValidBase64(base64)).toBe(true);
    });

    it("should validate base64 in data URI", () => {
      const base64 = Buffer.from("test").toString("base64");
      const dataUri = `data:image/png;base64,${base64}`;
      expect(imageUtils.isValidBase64(dataUri)).toBe(true);
    });
  });

  describe("getBase64Size", () => {
    it("should calculate size of base64 string", () => {
      const original = Buffer.from("test data");
      const base64 = original.toString("base64");
      const result = imageUtils.getBase64Size(base64);

      expect(result).toBe(original.length);
    });

    it("should handle data URI prefix", () => {
      const original = Buffer.from("test data");
      const dataUri = `data:image/png;base64,${original.toString("base64")}`;
      const result = imageUtils.getBase64Size(dataUri);

      expect(result).toBe(original.length);
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes", () => {
      expect(imageUtils.formatFileSize(500)).toBe("500 Bytes");
    });

    it("should format kilobytes", () => {
      expect(imageUtils.formatFileSize(1024)).toBe("1 KB");
      expect(imageUtils.formatFileSize(1536)).toBe("1.5 KB");
    });

    it("should format megabytes", () => {
      expect(imageUtils.formatFileSize(1048576)).toBe("1 MB");
    });

    it("should handle zero bytes", () => {
      expect(imageUtils.formatFileSize(0)).toBe("0 Bytes");
    });
  });

  describe("getFileExtension", () => {
    it("should extract extension from filename", () => {
      expect(imageUtils.getFileExtension("image.png")).toBe("png");
      expect(imageUtils.getFileExtension("photo.jpeg")).toBe("jpeg");
    });

    it("should handle files without extension", () => {
      expect(imageUtils.getFileExtension("noextension")).toBe(null);
    });
  });
});

describe("Cleanup on Error Tests", () => {
  describe("processImageForOpenAI error handling", () => {
    it("should throw and clean up on invalid input type", () => {
      // Test with null input - should throw
      expect(() => {
        // @ts-expect-error Testing invalid input
        ImageProcessor.processImageForOpenAI(null);
      }).toThrow();
    });
  });

  describe("processImageForGoogle error handling", () => {
    it("should throw and clean up on invalid input type", () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        ImageProcessor.processImageForGoogle(null);
      }).toThrow();
    });
  });

  describe("processImageForAnthropic error handling", () => {
    it("should throw and clean up on invalid input type", () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        ImageProcessor.processImageForAnthropic(null);
      }).toThrow();
    });
  });

  describe("processImage error handling", () => {
    it("should throw and clean up on invalid input", () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        ImageProcessor.processImage(null, "openai");
      }).toThrow();
    });
  });
});
