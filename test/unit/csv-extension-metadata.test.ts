/**
 * Tests for CSV-023: File Extension in Metadata
 * Validates that CSV metadata includes original file extension
 */

import { describe, it, expect } from "vitest";
import { FileDetector } from "../../src/lib/utils/fileDetector.js";
import { CSVProcessor } from "../../src/lib/utils/csvProcessor.js";
import { readFile } from "fs/promises";
import { join } from "path";

describe("CSV Extension Metadata (CSV-023)", () => {
  const fixturesDir = join(process.cwd(), "test", "fixtures");

  describe("FileDetector with CSV files", () => {
    it("should include extension metadata for .csv files", async () => {
      const csvPath = join(fixturesDir, "basic.csv");
      const result = await FileDetector.detectAndProcess(csvPath);

      expect(result.type).toBe("csv");
      expect(result.metadata.extension).toBe("csv");
    });

    it("should include extension metadata for .tsv files", async () => {
      const tsvPath = join(fixturesDir, "sample.tsv");
      const result = await FileDetector.detectAndProcess(tsvPath);

      expect(result.type).toBe("csv"); // Type is normalized to 'csv'
      expect(result.metadata.extension).toBe("tsv"); // Extension preserves original
    });

    it("should handle extension when processing from buffer", async () => {
      const csvPath = join(fixturesDir, "basic.csv");
      const buffer = await readFile(csvPath);

      // When processing buffer directly, extension comes from options
      const result = await FileDetector.detectAndProcess(buffer);

      expect(result.type).toBe("csv");
      // Extension might be null for buffers without file path context
      expect(result.metadata.extension).toBeDefined();
    });
  });

  describe("CSVProcessor direct usage", () => {
    it("should include extension when provided in options", async () => {
      const csvPath = join(fixturesDir, "basic.csv");
      const buffer = await readFile(csvPath);

      const result = await CSVProcessor.process(buffer, {
        extension: "csv",
        formatStyle: "raw",
      });

      expect(result.metadata.extension).toBe("csv");
    });

    it("should preserve tsv extension in metadata", async () => {
      const tsvPath = join(fixturesDir, "sample.tsv");
      const buffer = await readFile(tsvPath);

      const result = await CSVProcessor.process(buffer, {
        extension: "tsv",
        formatStyle: "raw",
      });

      expect(result.metadata.extension).toBe("tsv");
    });

    it("should handle null extension gracefully", async () => {
      const csvPath = join(fixturesDir, "basic.csv");
      const buffer = await readFile(csvPath);

      const result = await CSVProcessor.process(buffer, {
        extension: null,
        formatStyle: "raw",
      });

      expect(result.metadata.extension).toBeNull();
    });

    it("should work without extension option (backward compatibility)", async () => {
      const csvPath = join(fixturesDir, "basic.csv");
      const buffer = await readFile(csvPath);

      const result = await CSVProcessor.process(buffer, {
        formatStyle: "raw",
      });

      // Should not error, extension should be null by default
      expect(result.metadata.extension).toBeNull();
    });
  });

  describe("Extension metadata for different formats", () => {
    it("should include extension for raw format", async () => {
      const csvPath = join(fixturesDir, "basic.csv");
      const buffer = await readFile(csvPath);

      const result = await CSVProcessor.process(buffer, {
        extension: "csv",
        formatStyle: "raw",
      });

      expect(result.metadata.extension).toBe("csv");
      expect(typeof result.content).toBe("string");
    });

    it("should include extension for json format", async () => {
      const csvPath = join(fixturesDir, "basic.csv");
      const buffer = await readFile(csvPath);

      const result = await CSVProcessor.process(buffer, {
        extension: "csv",
        formatStyle: "json",
      });

      expect(result.metadata.extension).toBe("csv");
      expect(result.metadata.columnNames).toBeDefined();
    });

    it("should include extension for markdown format", async () => {
      const csvPath = join(fixturesDir, "basic.csv");
      const buffer = await readFile(csvPath);

      const result = await CSVProcessor.process(buffer, {
        extension: "csv",
        formatStyle: "markdown",
      });

      expect(result.metadata.extension).toBe("csv");
      expect(typeof result.content).toBe("string");
    });
  });

  describe("Extension detection for various CSV-like files", () => {
    it("should distinguish CSV from TSV based on extension", async () => {
      const csvPath = join(fixturesDir, "basic.csv");
      const tsvPath = join(fixturesDir, "sample.tsv");

      const csvResult = await FileDetector.detectAndProcess(csvPath);
      const tsvResult = await FileDetector.detectAndProcess(tsvPath);

      // Both are type 'csv'
      expect(csvResult.type).toBe("csv");
      expect(tsvResult.type).toBe("csv");

      // But extensions differ
      expect(csvResult.metadata.extension).toBe("csv");
      expect(tsvResult.metadata.extension).toBe("tsv");
    });

    it("should preserve extension through the full processing pipeline", async () => {
      const tsvPath = join(fixturesDir, "sample.tsv");

      const result = await FileDetector.detectAndProcess(tsvPath, {
        csvOptions: {
          formatStyle: "json",
          maxRows: 100,
        },
      });

      expect(result.type).toBe("csv");
      expect(result.metadata.extension).toBe("tsv");
      expect(result.metadata.rowCount).toBeGreaterThan(0);
    });
  });
});
