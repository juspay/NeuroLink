import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { imageUtils } from "../../../src/lib/utils/imageProcessor.js";

describe("imageUtils", () => {
  describe("urlToBase64DataUri", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should reject responses with content-length: 0", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (key: string) => {
            if (key === "content-type") {
              return "image/jpeg";
            }
            if (key === "content-length") {
              return "0";
            }
            return null;
          },
        },
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      });

      await expect(
        imageUtils.urlToBase64DataUri("https://example.com/image.jpg"),
      ).rejects.toThrow("Empty response: content-length is 0");
    });

    it("should accept responses with valid content-length", async () => {
      const mockImageData = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (key: string) => {
            if (key === "content-type") {
              return "image/jpeg";
            }
            if (key === "content-length") {
              return String(mockImageData.length);
            }
            return null;
          },
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockImageData.buffer),
      });

      const result = await imageUtils.urlToBase64DataUri(
        "https://example.com/image.jpg",
      );

      expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it("should accept responses without content-length header", async () => {
      const mockImageData = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (key: string) => {
            if (key === "content-type") {
              return "image/jpeg";
            }
            if (key === "content-length") {
              return null; // No content-length header
            }
            return null;
          },
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockImageData.buffer),
      });

      const result = await imageUtils.urlToBase64DataUri(
        "https://example.com/image.jpg",
      );

      expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it("should reject responses that exceed maxBytes", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (key: string) => {
            if (key === "content-type") {
              return "image/jpeg";
            }
            if (key === "content-length") {
              return "20000000"; // 20MB
            }
            return null;
          },
        },
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(20000000)),
      });

      await expect(
        imageUtils.urlToBase64DataUri("https://example.com/large.jpg"),
      ).rejects.toThrow("Content too large");
    });

    it("should reject non-image content types", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (key: string) => {
            if (key === "content-type") {
              return "text/html";
            }
            if (key === "content-length") {
              return "100";
            }
            return null;
          },
        },
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      });

      await expect(
        imageUtils.urlToBase64DataUri("https://example.com/page.html"),
      ).rejects.toThrow("Unsupported content-type");
    });

    it("should reject non-HTTP protocols", async () => {
      await expect(
        imageUtils.urlToBase64DataUri("file:///etc/passwd"),
      ).rejects.toThrow("Unsupported protocol");

      await expect(
        imageUtils.urlToBase64DataUri("ftp://example.com/image.jpg"),
      ).rejects.toThrow("Unsupported protocol");
    });
  });
});
