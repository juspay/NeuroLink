/**
 * CLI File Validation Integration Tests
 *
 * Integration tests to verify file validation works correctly
 * when processing multimodal CLI inputs through the actual CLICommandFactory.
 *
 * These tests verify the validation helper is properly integrated
 * into the file processing methods.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

// Type casting to access private methods for testing
type CLICommandFactoryPrivate = {
  processCliImages(
    images?: string | string[],
    quiet?: boolean,
  ): Array<Buffer | string> | undefined;
  processCliCSVFiles(
    csvFiles?: string | string[],
    quiet?: boolean,
  ): Array<Buffer | string> | undefined;
  processCliPDFFiles(
    pdfFiles?: string | string[],
    quiet?: boolean,
  ): Array<Buffer | string> | undefined;
  processCliFiles(
    files?: string | string[],
    quiet?: boolean,
  ): Array<Buffer | string> | undefined;
};

// Import the actual CLICommandFactory
async function getCLICommandFactory() {
  const module = await import(
    "../../../src/cli/factories/commandFactory.js"
  );
  return module.CLICommandFactory as unknown as CLICommandFactoryPrivate;
}

describe("CLI File Validation Integration", () => {
  let testDir: string;
  let validImagePath: string;
  let validPdfPath: string;
  let validCsvPath: string;
  let largeImagePath: string;
  let directoryPath: string;
  let nonExistentPath: string;
  let CLICommandFactory: CLICommandFactoryPrivate;

  beforeEach(async () => {
    // Load the actual CLICommandFactory
    CLICommandFactory = await getCLICommandFactory();

    testDir = fs.mkdtempSync(path.join(tmpdir(), "neurolink-integration-"));

    validImagePath = path.join(testDir, "test.jpg");
    validPdfPath = path.join(testDir, "test.pdf");
    validCsvPath = path.join(testDir, "test.csv");
    largeImagePath = path.join(testDir, "large.jpg");
    directoryPath = path.join(testDir, "dir");
    nonExistentPath = path.join(testDir, "missing.jpg");

    fs.writeFileSync(validImagePath, Buffer.alloc(100));
    fs.writeFileSync(validPdfPath, Buffer.alloc(100));
    fs.writeFileSync(validCsvPath, "data");
    fs.writeFileSync(largeImagePath, Buffer.alloc(15 * 1024 * 1024));
    fs.mkdirSync(directoryPath);

    // Mock logger to suppress warnings during tests
    vi.mock("../../../src/lib/utils/logger.js", () => ({
      logger: {
        always: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
      },
    }));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  describe("processCliImages Integration", () => {
    it("should process valid image file", () => {
      const result = CLICommandFactory.processCliImages(validImagePath);
      expect(result).toEqual([validImagePath]);
    });

    it("should process multiple valid images", () => {
      const images = [validImagePath, validImagePath];
      const result = CLICommandFactory.processCliImages(images);
      expect(result).toEqual(images);
    });

    it("should throw error for non-existent image", () => {
      expect(() => {
        CLICommandFactory.processCliImages(nonExistentPath);
      }).toThrow("File not found");
    });

    it("should throw error for directory", () => {
      expect(() => {
        CLICommandFactory.processCliImages(directoryPath);
      }).toThrow("Path is a directory");
    });

    it("should process URL without validation", () => {
      const url = "https://example.com/image.jpg";
      const result = CLICommandFactory.processCliImages(url);
      expect(result).toEqual([url]);
    });

    it("should handle large file in quiet mode", () => {
      const result = CLICommandFactory.processCliImages(largeImagePath, true);
      expect(result).toEqual([largeImagePath]);
    });

    it("should return undefined for no images", () => {
      const result = CLICommandFactory.processCliImages(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe("processCliPDFFiles Integration", () => {
    it("should process valid PDF file", () => {
      const result = CLICommandFactory.processCliPDFFiles(validPdfPath);
      expect(result).toEqual([validPdfPath]);
    });

    it("should throw error for non-existent PDF", () => {
      expect(() => {
        CLICommandFactory.processCliPDFFiles(nonExistentPath);
      }).toThrow("File not found");
    });

    it("should process URL without validation", () => {
      const url = "https://example.com/document.pdf";
      const result = CLICommandFactory.processCliPDFFiles(url);
      expect(result).toEqual([url]);
    });
  });

  describe("processCliCSVFiles Integration", () => {
    it("should process valid CSV file", () => {
      const result = CLICommandFactory.processCliCSVFiles(validCsvPath);
      expect(result).toEqual([validCsvPath]);
    });

    it("should throw error for non-existent CSV", () => {
      expect(() => {
        CLICommandFactory.processCliCSVFiles(nonExistentPath);
      }).toThrow("File not found");
    });

    it("should process URL without validation", () => {
      const url = "https://example.com/data.csv";
      const result = CLICommandFactory.processCliCSVFiles(url);
      expect(result).toEqual([url]);
    });
  });

  describe("processCliFiles Integration", () => {
    it("should process valid file", () => {
      const result = CLICommandFactory.processCliFiles(validImagePath);
      expect(result).toEqual([validImagePath]);
    });

    it("should throw error for non-existent file", () => {
      expect(() => {
        CLICommandFactory.processCliFiles(nonExistentPath);
      }).toThrow("File not found");
    });

    it("should process URL without validation", () => {
      const url = "https://example.com/file.dat";
      const result = CLICommandFactory.processCliFiles(url);
      expect(result).toEqual([url]);
    });
  });

  describe("Error Message Quality", () => {
    it("should provide helpful error for missing file", () => {
      try {
        CLICommandFactory.processCliImages(nonExistentPath);
        expect.fail("Should have thrown an error");
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain("File not found");
        expect(message).toContain("Troubleshooting steps");
        expect(message).toContain("Check if the file path is correct");
        expect(message).toContain("💡 Tip");
      }
    });

    it("should provide helpful error for directory", () => {
      try {
        CLICommandFactory.processCliImages(directoryPath);
        expect.fail("Should have thrown an error");
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain("Path is a directory");
        expect(message).toContain("Troubleshooting steps");
        expect(message).toContain("--image file1.jpg --image file2.jpg");
      }
    });

    it("should include file path in error", () => {
      try {
        CLICommandFactory.processCliImages(nonExistentPath);
        expect.fail("Should have thrown an error");
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain(nonExistentPath);
      }
    });
  });

  describe("URL Validation Bypass", () => {
    it("should accept HTTP URLs", () => {
      const url = "http://example.com/image.jpg";
      const result = CLICommandFactory.processCliImages(url);
      expect(result).toEqual([url]);
    });

    it("should accept HTTPS URLs", () => {
      const url = "https://example.com/image.jpg";
      const result = CLICommandFactory.processCliImages(url);
      expect(result).toEqual([url]);
    });

    it("should validate non-URL paths", () => {
      expect(() => {
        CLICommandFactory.processCliImages(nonExistentPath);
      }).toThrow();
    });

    it("should handle mixed URLs and file paths", () => {
      const paths = ["https://example.com/1.jpg", validImagePath];
      const result = CLICommandFactory.processCliImages(paths);
      expect(result).toEqual(paths);
    });
  });

  describe("Multiple File Validation", () => {
    it("should validate all files in array", () => {
      const files = [validImagePath, validImagePath];
      const result = CLICommandFactory.processCliImages(files);
      expect(result).toHaveLength(2);
    });

    it("should stop at first invalid file", () => {
      const files = [validImagePath, nonExistentPath, validImagePath];
      expect(() => {
        CLICommandFactory.processCliImages(files);
      }).toThrow("File not found");
    });

    it("should process empty array", () => {
      const result = CLICommandFactory.processCliImages([]);
      expect(result).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle paths with spaces", () => {
      const spacePath = path.join(testDir, "file with spaces.jpg");
      fs.writeFileSync(spacePath, Buffer.alloc(100));

      const result = CLICommandFactory.processCliImages(spacePath);
      expect(result).toEqual([spacePath]);

      fs.unlinkSync(spacePath);
    });

    it("should handle special characters in path", () => {
      const specialPath = path.join(testDir, "file(1).jpg");
      fs.writeFileSync(specialPath, Buffer.alloc(100));

      const result = CLICommandFactory.processCliImages(specialPath);
      expect(result).toEqual([specialPath]);

      fs.unlinkSync(specialPath);
    });
  });
});
