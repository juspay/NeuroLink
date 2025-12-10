/**
 * CSV Processor Unit Tests
 * Tests for CSV processing with different format styles
 */

import { describe, it, expect } from "vitest";
import { CSVProcessor } from "../../src/lib/utils/csvProcessor.js";

describe("CSVProcessor", () => {
  describe("Row Count Consistency", () => {
    it("should count data rows consistently for raw format", async () => {
      const csvData =
        "name,age,city\nAlice,30,New York\nBob,25,London\nCharlie,35,Tokyo";
      const buffer = Buffer.from(csvData);

      const result = await CSVProcessor.process(buffer, {
        formatStyle: "raw",
      });

      // Should have 3 data rows (excluding header)
      expect(result.metadata.rowCount).toBe(3);
      expect(result.type).toBe("csv");
    });

    it("should count data rows consistently for json format", async () => {
      const csvData =
        "name,age,city\nAlice,30,New York\nBob,25,London\nCharlie,35,Tokyo";
      const buffer = Buffer.from(csvData);

      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
      });

      // Should have 3 data rows (excluding header)
      expect(result.metadata.rowCount).toBe(3);
      expect(result.type).toBe("csv");
    });

    it("should count data rows consistently for markdown format", async () => {
      const csvData =
        "name,age,city\nAlice,30,New York\nBob,25,London\nCharlie,35,Tokyo";
      const buffer = Buffer.from(csvData);

      const result = await CSVProcessor.process(buffer, {
        formatStyle: "markdown",
      });

      // Should have 3 data rows (excluding header)
      expect(result.metadata.rowCount).toBe(3);
      expect(result.type).toBe("csv");
    });

    it("should have same rowCount across all formats", async () => {
      const csvData =
        "name,age,city\nAlice,30,New York\nBob,25,London\nCharlie,35,Tokyo";
      const buffer = Buffer.from(csvData);

      const rawResult = await CSVProcessor.process(buffer, {
        formatStyle: "raw",
      });
      const jsonResult = await CSVProcessor.process(buffer, {
        formatStyle: "json",
      });
      const markdownResult = await CSVProcessor.process(buffer, {
        formatStyle: "markdown",
      });

      expect(rawResult.metadata.rowCount).toBe(jsonResult.metadata.rowCount);
      expect(rawResult.metadata.rowCount).toBe(
        markdownResult.metadata.rowCount,
      );
      expect(jsonResult.metadata.rowCount).toBe(3);
    });

    it("should include totalLines field for raw format", async () => {
      const csvData =
        "name,age,city\nAlice,30,New York\nBob,25,London\nCharlie,35,Tokyo";
      const buffer = Buffer.from(csvData);

      const result = await CSVProcessor.process(buffer, {
        formatStyle: "raw",
      });

      // Should have totalLines field showing all lines including header
      expect(result.metadata.totalLines).toBe(4);
      expect(result.metadata.rowCount).toBe(3);
    });

    it("should handle metadata line correctly in raw format", async () => {
      const csvData = "SEP=,\nname,age,city\nAlice,30,New York\nBob,25,London";
      const buffer = Buffer.from(csvData);

      const result = await CSVProcessor.process(buffer, {
        formatStyle: "raw",
      });

      // Should skip metadata line and count data rows only
      expect(result.metadata.rowCount).toBe(2);
      expect(result.metadata.totalLines).toBe(3); // header + 2 data rows
    });
  });

  describe("Row Limiting", () => {
    it("should respect maxRows parameter in raw format", async () => {
      const csvData =
        "name,age\nAlice,30\nBob,25\nCharlie,35\nDavid,40\nEve,45";
      const buffer = Buffer.from(csvData);

      const result = await CSVProcessor.process(buffer, {
        formatStyle: "raw",
        maxRows: 2,
      });

      // Should have 2 data rows (limited by maxRows)
      expect(result.metadata.rowCount).toBe(2);
      expect(result.metadata.totalLines).toBe(3); // header + 2 data rows
    });

    it("should respect maxRows parameter in json format", async () => {
      const csvData =
        "name,age\nAlice,30\nBob,25\nCharlie,35\nDavid,40\nEve,45";
      const buffer = Buffer.from(csvData);

      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        maxRows: 2,
      });

      // Should have 2 data rows (limited by maxRows)
      expect(result.metadata.rowCount).toBe(2);
    });
  });
});
