import { describe, it, expect, vi, beforeEach } from "vitest";
import { PDFProcessor } from "../../../src/lib/utils/pdfProcessor.js";
import { logger } from "../../../src/lib/utils/logger.js";

// Mock the logger to capture warnings
vi.mock("../../../src/lib/utils/logger.js", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("PDFProcessor.convertToImages", () => {
  describe("empty PDF validation", () => {
    it("should throw error for PDF with 0 pages", async () => {
      // Create a valid PDF header buffer that will pass initial validation
      const validPdfHeader = Buffer.from(
        "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\ntrailer<</Size 3/Root 1 0 R>>\nstartxref\n150\n%%EOF",
      );

      // Mock pdf-to-img to return an empty async iterator (0 pages)
      vi.doMock("pdf-to-img", () => ({
        pdf: vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: async function* () {
            // Empty iterator - no pages
          },
        }),
      }));

      // Re-import to get the mocked version
      const { PDFProcessor: MockedPDFProcessor } = await import(
        "../../../src/lib/utils/pdfProcessor.js"
      );

      await expect(
        MockedPDFProcessor.convertToImages(validPdfHeader),
      ).rejects.toThrow("PDF has 0 pages. Cannot convert empty PDF to images.");

      vi.doUnmock("pdf-to-img");
    });

    it("should succeed for PDF with at least 1 page", async () => {
      const validPdfHeader = Buffer.from(
        "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n200\n%%EOF",
      );

      // Mock pdf-to-img to return a single page
      vi.doMock("pdf-to-img", () => ({
        pdf: vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: async function* () {
            yield Buffer.from("fake-png-data");
          },
        }),
      }));

      const { PDFProcessor: MockedPDFProcessor } = await import(
        "../../../src/lib/utils/pdfProcessor.js"
      );

      const result = await MockedPDFProcessor.convertToImages(validPdfHeader);
      expect(result.pageCount).toBe(1);
      expect(result.images).toHaveLength(1);

      vi.doUnmock("pdf-to-img");
    });

    it("should provide clear error message mentioning 0 pages", async () => {
      const validPdfHeader = Buffer.from(
        "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\ntrailer<</Size 3/Root 1 0 R>>\nstartxref\n150\n%%EOF",
      );

      vi.doMock("pdf-to-img", () => ({
        pdf: vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: async function* () {
            // Empty iterator
          },
        }),
      }));

      const { PDFProcessor: MockedPDFProcessor } = await import(
        "../../../src/lib/utils/pdfProcessor.js"
      );

      try {
        await MockedPDFProcessor.convertToImages(validPdfHeader);
        expect.fail("Should have thrown an error");
      } catch (error) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain("0 pages");
        expect(errorMessage).toContain("empty PDF");
      }

      vi.doUnmock("pdf-to-img");
    });
  });

  describe("format validation", () => {
    // Create a minimal valid PDF buffer for testing
    // This is a minimal PDF that won't actually render, but will help test validation
    const minimalPdfBuffer = Buffer.from(
      "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n200\n%%EOF",
    );

    it('should throw error for unsupported format "gif"', async () => {
      await expect(
        PDFProcessor.convertToImages(minimalPdfBuffer, {
          format: "gif" as "png",
        }),
      ).rejects.toThrow(
        'Invalid format: "gif". Supported formats: "png", "jpeg".',
      );
    });

    it('should throw error for unsupported format "webp"', async () => {
      await expect(
        PDFProcessor.convertToImages(minimalPdfBuffer, {
          format: "webp" as "png",
        }),
      ).rejects.toThrow(
        'Invalid format: "webp". Supported formats: "png", "jpeg".',
      );
    });

    it('should throw error for case-sensitive format "PNG" (uppercase)', async () => {
      await expect(
        PDFProcessor.convertToImages(minimalPdfBuffer, {
          format: "PNG" as "png",
        }),
      ).rejects.toThrow(
        'Invalid format: "PNG". Supported formats: "png", "jpeg".',
      );
    });

    it('should throw error for case-sensitive format "JPEG" (uppercase)', async () => {
      await expect(
        PDFProcessor.convertToImages(minimalPdfBuffer, {
          format: "JPEG" as "png",
        }),
      ).rejects.toThrow(
        'Invalid format: "JPEG". Supported formats: "png", "jpeg".',
      );
    });

    it('should throw error for case-sensitive format "Png" (mixed case)', async () => {
      await expect(
        PDFProcessor.convertToImages(minimalPdfBuffer, {
          format: "Png" as "png",
        }),
      ).rejects.toThrow(
        'Invalid format: "Png". Supported formats: "png", "jpeg".',
      );
    });

    it("should validate format before attempting PDF processing", async () => {
      // This test ensures validation happens early, before expensive PDF operations
      const invalidBuffer = Buffer.from("not-a-pdf");

      await expect(
        PDFProcessor.convertToImages(invalidBuffer, {
          format: "invalid" as "png",
        }),
      ).rejects.toThrow(
        'Invalid format: "invalid". Supported formats: "png", "jpeg".',
      );
    });

    it('should accept valid format "png"', async () => {
      // This will fail during PDF processing, but should pass format validation
      // We're testing that the format validation doesn't reject "png"
      try {
        await PDFProcessor.convertToImages(minimalPdfBuffer, {
          format: "png",
        });
      } catch (error) {
        // Should fail due to canvas/pdfjs dependencies or PDF processing issues,
        // not due to format validation
        expect((error as Error).message).not.toContain("Invalid format");
      }
    });

    it('should accept valid format "jpeg"', async () => {
      // This will fail during PDF processing, but should pass format validation
      // We're testing that the format validation doesn't reject "jpeg"
      try {
        await PDFProcessor.convertToImages(minimalPdfBuffer, {
          format: "jpeg",
        });
      } catch (error) {
        // Should fail due to canvas/pdfjs dependencies or PDF processing issues,
        // not due to format validation
        expect((error as Error).message).not.toContain("Invalid format");
      }
    });

    it("should use default format png when format is not provided", async () => {
      // Test that omitting format uses the default "png" and doesn't throw validation error
      try {
        await PDFProcessor.convertToImages(minimalPdfBuffer);
      } catch (error) {
        // Should fail due to canvas/pdfjs dependencies or PDF processing issues,
        // not due to format validation
        expect((error as Error).message).not.toContain("Invalid format");
      }
    });
  });
});

describe("PDFProcessor.validateAggregateLimits", () => {
  // Helper to create mock PDF buffers of specific sizes
  const createMockPdfBuffer = (sizeInMB: number): Buffer => {
    const sizeInBytes = Math.floor(sizeInMB * 1024 * 1024);
    const buffer = Buffer.alloc(sizeInBytes);
    // Write PDF header to make it look like a valid PDF
    buffer.write("%PDF-1.4", 0);
    return buffer;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("single PDF validation", () => {
    it("should pass for single PDF under limits", () => {
      const pdfFiles = [
        {
          buffer: createMockPdfBuffer(5),
          filename: "doc1.pdf",
          pageCount: 10,
        },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(true);
      expect(result.totalSizeMB).toBeCloseTo(5, 1);
      expect(result.totalPages).toBe(10);
      expect(result.pdfCount).toBe(1);
      expect(result.error).toBeUndefined();
    });
  });

  describe("multiple PDFs under aggregate limits", () => {
    it("should pass for multiple PDFs under aggregate size limit", () => {
      const pdfFiles = [
        {
          buffer: createMockPdfBuffer(10),
          filename: "doc1.pdf",
          pageCount: 20,
        },
        {
          buffer: createMockPdfBuffer(10),
          filename: "doc2.pdf",
          pageCount: 20,
        },
        {
          buffer: createMockPdfBuffer(10),
          filename: "doc3.pdf",
          pageCount: 20,
        },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(true);
      expect(result.totalSizeMB).toBeCloseTo(30, 1);
      expect(result.totalPages).toBe(60);
      expect(result.pdfCount).toBe(3);
    });

    it("should pass for multiple PDFs under aggregate page limit", () => {
      const pdfFiles = [
        { buffer: createMockPdfBuffer(1), filename: "doc1.pdf", pageCount: 30 },
        { buffer: createMockPdfBuffer(1), filename: "doc2.pdf", pageCount: 30 },
        { buffer: createMockPdfBuffer(1), filename: "doc3.pdf", pageCount: 30 },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(true);
      expect(result.totalPages).toBe(90);
    });
  });

  describe("aggregate size limit violations", () => {
    it("should fail when aggregate size exceeds limit", () => {
      const pdfFiles = [
        {
          buffer: createMockPdfBuffer(20),
          filename: "doc1.pdf",
          pageCount: 10,
        },
        {
          buffer: createMockPdfBuffer(20),
          filename: "doc2.pdf",
          pageCount: 10,
        },
        {
          buffer: createMockPdfBuffer(20),
          filename: "doc3.pdf",
          pageCount: 10,
        },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Aggregate PDF size");
      expect(result.error).toContain("exceeds the maximum limit");
      expect(result.error).toContain("50MB");
    });

    it("should include individual PDF sizes in error message", () => {
      const pdfFiles = [
        {
          buffer: createMockPdfBuffer(30),
          filename: "large1.pdf",
          pageCount: 5,
        },
        {
          buffer: createMockPdfBuffer(30),
          filename: "large2.pdf",
          pageCount: 5,
        },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("large1.pdf");
      expect(result.error).toContain("large2.pdf");
      expect(result.error).toContain("30.00MB");
    });
  });

  describe("aggregate page limit violations", () => {
    it("should fail when aggregate pages exceed limit", () => {
      // 5 PDFs with 25 pages each = 125 pages (exceeds 100 page limit)
      const pdfFiles = [
        { buffer: createMockPdfBuffer(1), filename: "doc1.pdf", pageCount: 25 },
        { buffer: createMockPdfBuffer(1), filename: "doc2.pdf", pageCount: 25 },
        { buffer: createMockPdfBuffer(1), filename: "doc3.pdf", pageCount: 25 },
        { buffer: createMockPdfBuffer(1), filename: "doc4.pdf", pageCount: 25 },
        { buffer: createMockPdfBuffer(1), filename: "doc5.pdf", pageCount: 25 },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Aggregate PDF page count");
      expect(result.error).toContain("125");
      expect(result.error).toContain("exceeds the maximum limit");
      expect(result.error).toContain("100 pages");
    });

    it("should bypass per-PDF limit with many small PDFs (the fix scenario)", () => {
      // This tests the exact scenario described in the issue:
      // 100 one-page PDFs should fail aggregate validation even though each passes individual validation
      const pdfFiles = Array.from({ length: 101 }, (_, i) => ({
        buffer: createMockPdfBuffer(0.1), // Small 100KB PDFs
        filename: `small-${i + 1}.pdf`,
        pageCount: 1,
      }));

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("101");
      expect(result.error).toContain("exceeds the maximum limit");
    });

    it("should include individual PDF page counts in error message", () => {
      const pdfFiles = [
        {
          buffer: createMockPdfBuffer(1),
          filename: "many-pages1.pdf",
          pageCount: 60,
        },
        {
          buffer: createMockPdfBuffer(1),
          filename: "many-pages2.pdf",
          pageCount: 60,
        },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("many-pages1.pdf");
      expect(result.error).toContain("many-pages2.pdf");
      expect(result.error).toContain("60 pages");
    });
  });

  describe("warning thresholds", () => {
    it("should warn when approaching size limit (80%)", () => {
      // 40MB = 80% of 50MB limit
      const pdfFiles = [
        {
          buffer: createMockPdfBuffer(20),
          filename: "doc1.pdf",
          pageCount: 10,
        },
        {
          buffer: createMockPdfBuffer(20),
          filename: "doc2.pdf",
          pageCount: 10,
        },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("approaching the limit");
      expect(result.warnings[0]).toContain("50MB");
    });

    it("should warn when approaching page limit (80%)", () => {
      // 80 pages = 80% of 100 page limit
      const pdfFiles = [
        { buffer: createMockPdfBuffer(1), filename: "doc1.pdf", pageCount: 40 },
        { buffer: createMockPdfBuffer(1), filename: "doc2.pdf", pageCount: 40 },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes("page count"))).toBe(true);
      expect(result.warnings.some((w) => w.includes("80"))).toBe(true);
    });

    it("should not warn when well below limits", () => {
      const pdfFiles = [
        { buffer: createMockPdfBuffer(5), filename: "doc1.pdf", pageCount: 10 },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("custom limits", () => {
    it("should respect custom size limit", () => {
      const pdfFiles = [
        { buffer: createMockPdfBuffer(15), filename: "doc1.pdf", pageCount: 5 },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles, {
        maxTotalSizeMB: 10,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("10MB");
    });

    it("should respect custom page limit", () => {
      const pdfFiles = [
        { buffer: createMockPdfBuffer(1), filename: "doc1.pdf", pageCount: 30 },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles, {
        maxTotalPages: 20,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("20 pages");
    });

    it("should respect custom warning threshold", () => {
      const pdfFiles = [
        {
          buffer: createMockPdfBuffer(30),
          filename: "doc1.pdf",
          pageCount: 10,
        },
      ];

      // 30MB = 60% of 50MB, but with 50% threshold should warn
      const result = PDFProcessor.validateAggregateLimits(pdfFiles, {
        warningThreshold: 0.5,
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty PDF array", () => {
      const result = PDFProcessor.validateAggregateLimits([]);

      expect(result.isValid).toBe(true);
      expect(result.totalSizeMB).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.pdfCount).toBe(0);
    });

    it("should handle PDFs with null/undefined page counts", () => {
      const pdfFiles = [
        {
          buffer: createMockPdfBuffer(1),
          filename: "doc1.pdf",
          pageCount: null,
        },
        {
          buffer: createMockPdfBuffer(1),
          filename: "doc2.pdf",
          pageCount: undefined,
        },
        { buffer: createMockPdfBuffer(1), filename: "doc3.pdf", pageCount: 10 },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(true);
      expect(result.totalPages).toBe(10); // Only counts the valid page count
    });

    it("should handle very small PDFs", () => {
      const pdfFiles = [
        {
          buffer: createMockPdfBuffer(0.001),
          filename: "tiny.pdf",
          pageCount: 1,
        },
      ];

      const result = PDFProcessor.validateAggregateLimits(pdfFiles);

      expect(result.isValid).toBe(true);
      expect(result.totalSizeMB).toBeCloseTo(0.001, 3);
    });
  });
});

describe("PDFProcessor.assertAggregateLimits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockPdfBuffer = (sizeInMB: number): Buffer => {
    const sizeInBytes = Math.floor(sizeInMB * 1024 * 1024);
    const buffer = Buffer.alloc(sizeInBytes);
    buffer.write("%PDF-1.4", 0);
    return buffer;
  };

  it("should not throw for valid PDFs", () => {
    const pdfFiles = [
      { buffer: createMockPdfBuffer(5), filename: "doc1.pdf", pageCount: 10 },
    ];

    expect(() => PDFProcessor.assertAggregateLimits(pdfFiles)).not.toThrow();
  });

  it("should throw for invalid aggregate size", () => {
    const pdfFiles = [
      { buffer: createMockPdfBuffer(30), filename: "doc1.pdf", pageCount: 10 },
      { buffer: createMockPdfBuffer(30), filename: "doc2.pdf", pageCount: 10 },
    ];

    expect(() => PDFProcessor.assertAggregateLimits(pdfFiles)).toThrow(
      /Aggregate PDF size.*exceeds/,
    );
  });

  it("should throw for invalid aggregate pages", () => {
    const pdfFiles = Array.from({ length: 20 }, (_, i) => ({
      buffer: createMockPdfBuffer(0.5),
      filename: `doc${i}.pdf`,
      pageCount: 10,
    }));

    expect(() => PDFProcessor.assertAggregateLimits(pdfFiles)).toThrow(
      /Aggregate PDF page count.*exceeds/,
    );
  });

  it("should log warnings when approaching limits", () => {
    const pdfFiles = [
      { buffer: createMockPdfBuffer(20), filename: "doc1.pdf", pageCount: 40 },
      { buffer: createMockPdfBuffer(20), filename: "doc2.pdf", pageCount: 40 },
    ];

    PDFProcessor.assertAggregateLimits(pdfFiles);

    expect(logger.warn).toHaveBeenCalled();
  });

  it("should log success for multiple PDFs", () => {
    const pdfFiles = [
      { buffer: createMockPdfBuffer(5), filename: "doc1.pdf", pageCount: 10 },
      { buffer: createMockPdfBuffer(5), filename: "doc2.pdf", pageCount: 10 },
    ];

    PDFProcessor.assertAggregateLimits(pdfFiles);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Aggregate validation passed"),
    );
  });
});
