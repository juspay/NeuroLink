import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CSVProcessor } from "../../../src/lib/utils/csvProcessor.js";
import { logger } from "../../../src/lib/utils/logger.js";
import { writeFile, unlink } from "node:fs/promises";

// Mock the logger
vi.mock("../../../src/lib/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CSVProcessor", () => {
  const sampleCSV = `name,age,city
Alice,30,New York
Bob,25,Los Angeles
Charlie,35,Chicago`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Logging behavior", () => {
    it("should log debug when starting CSV processing", async () => {
      const csvData = Buffer.from("name,age\nAlice,30\nBob,25");
      await CSVProcessor.process(csvData, { formatStyle: "raw" });

      expect(logger.debug).toHaveBeenCalledWith(
        "[CSVProcessor] Starting CSV processing",
        expect.objectContaining({
          contentSize: expect.any(Number),
          formatStyle: "raw",
          maxRows: expect.any(Number),
        }),
      );
    });

    it("should log info on successful processing", async () => {
      const csvData = Buffer.from("name,age\nAlice,30\nBob,25");
      await CSVProcessor.process(csvData, { formatStyle: "raw" });

      expect(logger.info).toHaveBeenCalledWith(
        "[CSVProcessor] ✅ Processed CSV file",
        expect.objectContaining({
          formatStyle: "raw",
          rowCount: 2,
        }),
      );
    });

    it("should log warn when CSV data is truncated", async () => {
      const csvData = Buffer.from(
        "name,age\nAlice,30\nBob,25\nCharlie,35\nDiana,40",
      );
      await CSVProcessor.process(csvData, { formatStyle: "raw", maxRows: 2 });

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("CSV data truncated"),
      );
    });

    it("should log debug when metadata line is detected", async () => {
      const csvData = Buffer.from("SEP=,\nname,age\nAlice,30\nBob,25");
      await CSVProcessor.process(csvData, { formatStyle: "raw" });

      expect(logger.debug).toHaveBeenCalledWith(
        "[CSVProcessor] Detected metadata line, skipping first line",
      );
    });

    it("should not warn when CSV is not truncated", async () => {
      const csvData = Buffer.from("name,age\nAlice,30\nBob,25");
      await CSVProcessor.process(csvData, { formatStyle: "raw", maxRows: 100 });

      expect(logger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining("truncated"),
      );
    });

    it("should log debug with raw format processing details", async () => {
      const csvData = Buffer.from("name,age\nAlice,30\nBob,25");
      await CSVProcessor.process(csvData, { formatStyle: "raw" });

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining("raw format:"),
        expect.objectContaining({
          formatStyle: "raw",
          limitedSize: expect.any(Number),
          originalSize: expect.any(Number),
        }),
      );
    });

    describe("JSON/Markdown format logging", () => {
      it("should log debug when converting to JSON format", async () => {
        const csvData = Buffer.from("name,age\nAlice,30\nBob,25");
        await CSVProcessor.process(csvData, { formatStyle: "json" });

        expect(logger.debug).toHaveBeenCalledWith(
          "[CSVProcessor] Parsing CSV for structured format conversion",
          expect.objectContaining({
            formatStyle: "json",
          }),
        );
      });

      it("should log warn when CSV has empty column headers", async () => {
        const csvData = Buffer.from("name,,city\nAlice,30,NYC\nBob,25,LA");
        await CSVProcessor.process(csvData, { formatStyle: "json" });

        expect(logger.warn).toHaveBeenCalledWith(
          "[CSVProcessor] CSV contains empty or blank column headers",
          expect.objectContaining({
            columnNames: expect.any(Array),
          }),
        );
      });

      it("should log warn when CSV has no data rows", async () => {
        const csvData = Buffer.from("name,age,city");
        await CSVProcessor.process(csvData, { formatStyle: "json" });

        expect(logger.warn).toHaveBeenCalledWith(
          "[CSVProcessor] CSV file contains no data rows",
        );
      });

      it("should log info with format details on completion", async () => {
        const csvData = Buffer.from("name,age\nAlice,30\nBob,25");
        await CSVProcessor.process(csvData, { formatStyle: "json" });

        expect(logger.info).toHaveBeenCalledWith(
          "[CSVProcessor] ✅ Processed CSV file",
          expect.objectContaining({
            formatStyle: "json",
            rowCount: 2,
            columnCount: 2,
          }),
        );
      });

      it("should log debug when converting rows to format", async () => {
        const csvData = Buffer.from("name,age\nAlice,30\nBob,25");
        await CSVProcessor.process(csvData, { formatStyle: "json" });

        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Converting"),
        );
      });
    });

    describe("parseCSVString logging", () => {
      it("should log debug when starting string parsing", async () => {
        const csvString = "name,age\nAlice,30\nBob,25";
        await CSVProcessor.parseCSVString(csvString);

        expect(logger.debug).toHaveBeenCalledWith(
          "[CSVProcessor] Starting string parsing",
          expect.objectContaining({
            inputLength: csvString.length,
            maxRows: expect.any(Number),
          }),
        );
      });

      it("should log debug when parsing is complete", async () => {
        const csvString = "name,age\nAlice,30\nBob,25";
        await CSVProcessor.parseCSVString(csvString);

        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("String parsing complete"),
        );
      });

      it("should log debug when row limit is reached", async () => {
        const csvString = "name,age\nAlice,30\nBob,25\nCharlie,35\nDiana,40";
        await CSVProcessor.parseCSVString(csvString, 2);

        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reached row limit"),
        );
      });

      it("should log debug when metadata line is detected in string", async () => {
        const csvString = "SEP=,\nname,age\nAlice,30\nBob,25";
        await CSVProcessor.parseCSVString(csvString);

        expect(logger.debug).toHaveBeenCalledWith(
          "[CSVProcessor] Detected metadata line in string, skipping",
        );
      });
    });

    describe("parseCSVFile", () => {
      const testFilePath = "/tmp/test-csv-processor.csv";

      beforeEach(async () => {
        // Create a test CSV file
        await writeFile(testFilePath, "name,age\nAlice,30\nBob,25", "utf-8");
      });

      afterEach(async () => {
        // Clean up test file
        try {
          await unlink(testFilePath);
        } catch {
          // Ignore errors if file doesn't exist
        }
      });

      it("should log debug when starting file parsing", async () => {
        await CSVProcessor.parseCSVFile(testFilePath);

        expect(logger.debug).toHaveBeenCalledWith(
          "[CSVProcessor] Starting file parsing",
          expect.objectContaining({
            filePath: testFilePath,
            maxRows: expect.any(Number),
          }),
        );
      });

      it("should log debug when file parsing is complete", async () => {
        await CSVProcessor.parseCSVFile(testFilePath);

        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("File parsing complete"),
        );
      });

      it("should log debug when metadata line is detected in file", async () => {
        await writeFile(
          testFilePath,
          "SEP=,\nname,age\nAlice,30\nBob,25",
          "utf-8",
        );
        await CSVProcessor.parseCSVFile(testFilePath);

        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Detected metadata line in file"),
        );
      });
    });
  });

  describe("sampleDataFormat option", () => {
    it("should return sample data as JSON string by default (backward compatible)", async () => {
      const buffer = Buffer.from(sampleCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
      });

      expect(typeof result.metadata.sampleData).toBe("string");
      const parsed = JSON.parse(result.metadata.sampleData as string);
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toEqual({
        name: "Alice",
        age: "30",
        city: "New York",
      });
    });

    it("should return sample data as object array with explicit format", async () => {
      const buffer = Buffer.from(sampleCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "object",
      });

      expect(result.metadata.sampleData).toBeInstanceOf(Array);
      const sampleData = result.metadata.sampleData as unknown[];
      expect(sampleData).toHaveLength(3);
      expect(sampleData[0]).toHaveProperty("name", "Alice");
    });

    it("should return sample data as JSON string with json format", async () => {
      const buffer = Buffer.from(sampleCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "json",
      });

      expect(typeof result.metadata.sampleData).toBe("string");
      const parsed = JSON.parse(result.metadata.sampleData as string);
      expect(parsed).toHaveLength(3);
      expect(parsed[0].name).toBe("Alice");
    });

    it("should return sample data as CSV string with csv format", async () => {
      const buffer = Buffer.from(sampleCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "csv",
      });

      expect(typeof result.metadata.sampleData).toBe("string");
      const csvOutput = result.metadata.sampleData as string;
      expect(csvOutput).toContain("name,age,city");
      expect(csvOutput).toContain("Alice,30,New York");
      expect(csvOutput).toContain("Bob,25,Los Angeles");
    });

    it("should return sample data as markdown table with markdown format", async () => {
      const buffer = Buffer.from(sampleCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "markdown",
      });

      expect(typeof result.metadata.sampleData).toBe("string");
      const mdOutput = result.metadata.sampleData as string;
      expect(mdOutput).toContain("| name | age | city |");
      expect(mdOutput).toContain("| --- ");
      expect(mdOutput).toContain("| Alice | 30 | New York |");
    });

    it("should handle empty data gracefully for object format", async () => {
      const emptyCSV = "name,age,city";
      const buffer = Buffer.from(emptyCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "object",
      });

      expect(result.metadata.sampleData).toEqual([]);
    });

    it("should handle empty data gracefully for string formats", async () => {
      const emptyCSV = "name,age,city";
      const buffer = Buffer.from(emptyCSV);

      const jsonResult = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "json",
      });
      expect(jsonResult.metadata.sampleData).toBe("No data rows");

      const csvResult = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "csv",
      });
      expect(csvResult.metadata.sampleData).toBe("No data rows");

      const mdResult = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "markdown",
      });
      expect(mdResult.metadata.sampleData).toBe("No data rows");
    });

    it("should limit sample data to first 3 rows", async () => {
      const largeCSV = `id,value
1,a
2,b
3,c
4,d
5,e`;
      const buffer = Buffer.from(largeCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "object",
      });

      const sampleData = result.metadata.sampleData as unknown[];
      expect(sampleData).toHaveLength(3);
      expect(sampleData[0]).toEqual({ id: "1", value: "a" });
      expect(sampleData[2]).toEqual({ id: "3", value: "c" });
    });

    it("should properly escape CSV values with special characters", async () => {
      const specialCSV = `name,description
"Alice","Hello, World"
"Bob","Quote: ""test"""`;
      const buffer = Buffer.from(specialCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "csv",
      });

      const csvOutput = result.metadata.sampleData as string;
      // Verify the CSV output escapes properly
      expect(csvOutput).toContain('"Hello, World"');
      // Double quotes get escaped as "" in CSV
      expect(csvOutput).toContain('""test""');
    });

    it("should work with raw format style (no sample data)", async () => {
      const buffer = Buffer.from(sampleCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "raw",
        sampleDataFormat: "object",
      });

      // Raw format doesn't include sampleData in metadata
      expect(result.metadata.sampleData).toBeUndefined();
    });
  });

  describe("toCSVString", () => {
    it("should include headers when includeHeaders is true", async () => {
      const buffer = Buffer.from(sampleCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "csv",
        includeHeaders: true,
      });

      const csvOutput = result.metadata.sampleData as string;
      expect(csvOutput.split("\n")[0]).toBe("name,age,city");
    });

    it("should exclude headers when includeHeaders is false", async () => {
      const buffer = Buffer.from(sampleCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "csv",
        includeHeaders: false,
      });

      const csvOutput = result.metadata.sampleData as string;
      expect(csvOutput.split("\n")[0]).toBe("Alice,30,New York");
    });
  });

  describe("rowCount consistency across formats", () => {
    it("should have consistent rowCount between raw and json formats", async () => {
      const csvData = Buffer.from("name,age\nAlice,30\nBob,25");

      const rawResult = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });
      const jsonResult = await CSVProcessor.process(csvData, {
        formatStyle: "json",
      });

      expect(rawResult.metadata.rowCount).toBe(2);
      expect(jsonResult.metadata.rowCount).toBe(2);
      expect(rawResult.metadata.rowCount).toEqual(jsonResult.metadata.rowCount);
    });

    it("should exclude trailing empty lines from rowCount in raw format", async () => {
      const csvData = Buffer.from("name,age\nAlice,30\nBob,25\n");

      const rawResult = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });
      const jsonResult = await CSVProcessor.process(csvData, {
        formatStyle: "json",
      });

      expect(rawResult.metadata.rowCount).toBe(2);
      expect(jsonResult.metadata.rowCount).toBe(2);
      expect(rawResult.metadata.totalLines).toBe(4); // header + 2 data + 1 empty
    });

    it("should exclude multiple trailing empty lines from rowCount", async () => {
      const csvData = Buffer.from("name,age\nAlice,30\nBob,25\n\n\n");

      const rawResult = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });
      const jsonResult = await CSVProcessor.process(csvData, {
        formatStyle: "json",
      });

      expect(rawResult.metadata.rowCount).toBe(2);
      expect(jsonResult.metadata.rowCount).toBe(2);
      expect(rawResult.metadata.totalLines).toBe(6); // header + 2 data + 3 empty
    });

    it("should handle CSV with only header and empty lines", async () => {
      const csvData = Buffer.from("name,age\n\n");

      const rawResult = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });
      const jsonResult = await CSVProcessor.process(csvData, {
        formatStyle: "json",
      });

      expect(rawResult.metadata.rowCount).toBe(0);
      expect(jsonResult.metadata.rowCount).toBe(0);
      expect(rawResult.metadata.totalLines).toBe(3); // header + 2 empty
    });

    it("should include totalLines in raw format metadata", async () => {
      const csvData = Buffer.from("name,age\nAlice,30\nBob,25\nCharlie,35");

      const rawResult = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      expect(rawResult.metadata.totalLines).toBe(4); // header + 3 data rows
      expect(rawResult.metadata.rowCount).toBe(3);
    });

    it("should handle metadata line with consistent rowCount", async () => {
      const csvData = Buffer.from("SEP=,\nname,age\nAlice,30\nBob,25");

      const rawResult = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });
      const jsonResult = await CSVProcessor.process(csvData, {
        formatStyle: "json",
      });

      expect(rawResult.metadata.rowCount).toBe(2);
      expect(jsonResult.metadata.rowCount).toBe(2);
      expect(rawResult.metadata.totalLines).toBe(3); // header + 2 data (metadata excluded)
    });

    it("should maintain consistency with row limiting", async () => {
      const csvData = Buffer.from(
        "name,age\nAlice,30\nBob,25\nCharlie,35\nDiana,40",
      );

      const rawResult = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
        maxRows: 2,
      });
      const jsonResult = await CSVProcessor.process(csvData, {
        formatStyle: "json",
        maxRows: 2,
      });

      expect(rawResult.metadata.rowCount).toBe(2);
      expect(jsonResult.metadata.rowCount).toBe(2);
      expect(rawResult.metadata.totalLines).toBe(3); // header + 2 data rows
    });

    it("should handle whitespace-only lines as empty", async () => {
      const csvData = Buffer.from("name,age\nAlice,30\n   \nBob,25\n\t");

      const rawResult = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });
      const jsonResult = await CSVProcessor.process(csvData, {
        formatStyle: "json",
      });

      expect(rawResult.metadata.rowCount).toBe(2);
      expect(jsonResult.metadata.rowCount).toBe(2);
      expect(rawResult.metadata.totalLines).toBe(5); // header + 2 data + 2 whitespace
    });
  });

  describe("CSV-009: Single-column CSV support", () => {
    it("should process single-column CSV with IDs", async () => {
      const csvData = Buffer.from("ID123\nID456\nID789\nID101");

      const rawResult = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });
      const jsonResult = await CSVProcessor.process(csvData, {
        formatStyle: "json",
      });

      expect(rawResult.type).toBe("csv");
      expect(rawResult.metadata.columnCount).toBe(1);
      expect(rawResult.metadata.rowCount).toBeGreaterThanOrEqual(3);
      expect(rawResult.content).toContain("ID123");

      expect(jsonResult.type).toBe("csv");
      expect(jsonResult.metadata.columnCount).toBe(1);
    });

    it("should process single-column CSV with names", async () => {
      const csvData = Buffer.from(
        "Alice Johnson\nBob Smith\nCharlie Brown\nDiana Martinez",
      );

      const rawResult = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      expect(rawResult.type).toBe("csv");
      expect(rawResult.metadata.columnCount).toBe(1);
      expect(rawResult.metadata.rowCount).toBeGreaterThanOrEqual(3);
      expect(rawResult.content).toContain("Alice Johnson");
      expect(rawResult.content).toContain("Bob Smith");
    });

    it("should process single-column CSV with emails", async () => {
      const csvData = Buffer.from(
        "alice@example.com\nbob.smith@company.org\ncharlie.brown@mail.com",
      );

      const jsonResult = await CSVProcessor.process(csvData, {
        formatStyle: "json",
      });

      expect(jsonResult.type).toBe("csv");
      expect(jsonResult.metadata.columnCount).toBe(1);
      // First row becomes header, so 2 data rows
      expect(jsonResult.metadata.rowCount).toBe(2);
      expect(jsonResult.content).toContain("alice@example.com");
    });

    it("should process single-column CSV with cities (varied lengths)", async () => {
      const csvData = Buffer.from(
        "New York\nLos Angeles\nChicago\nHouston\nPhoenix\nPhiladelphia",
      );

      const rawResult = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      expect(rawResult.type).toBe("csv");
      expect(rawResult.metadata.columnCount).toBe(1);
      // First row becomes header, so 5 data rows
      expect(rawResult.metadata.rowCount).toBe(5);
      expect(rawResult.content).toContain("New York");
      expect(rawResult.content).toContain("Philadelphia");
    });

    it("should respect maxRows for single-column CSVs", async () => {
      const csvData = Buffer.from("Item1\nItem2\nItem3\nItem4\nItem5\nItem6");

      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
        maxRows: 3,
      });

      expect(result.metadata.rowCount).toBe(3);
      expect(result.content).toContain("Item1");
      expect(result.content).toContain("Item3");
      expect(result.content).not.toContain("Item6");
    });

    it("should handle single-column CSV in markdown format", async () => {
      const csvData = Buffer.from("Product\nLaptop\nMouse\nKeyboard");

      const result = await CSVProcessor.process(csvData, {
        formatStyle: "markdown",
      });

      expect(result.type).toBe("csv");
      expect(result.metadata.columnCount).toBe(1);
      expect(result.content).toContain("Product");
      expect(result.content).toContain("Laptop");
    });

    it("should log success for single-column CSV processing", async () => {
      const csvData = Buffer.from("Value1\nValue2\nValue3");
      await CSVProcessor.process(csvData, { formatStyle: "raw" });

      expect(logger.info).toHaveBeenCalledWith(
        "[CSVProcessor] ✅ Processed CSV file",
        expect.objectContaining({
          formatStyle: "raw",
          columnCount: 1,
        }),
      );
    });
  });
});
