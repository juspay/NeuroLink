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

  describe("Column metadata analysis", () => {
    it("should detect integer column type", async () => {
      const csvData = Buffer.from(
        "id,name\n1,Alice\n2,Bob\n3,Charlie\n4,Diana\n5,Eve",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      expect(result.metadata.columnMetadata).toBeDefined();
      const idColumn = result.metadata.columnMetadata?.find(
        (col) => col.name === "id",
      );
      expect(idColumn?.detectedType).toBe("integer");
      expect(idColumn?.typeConfidence).toBeGreaterThanOrEqual(70);
    });

    it("should detect float/number column type", async () => {
      const csvData = Buffer.from(
        "price,item\n19.99,Widget\n29.50,Gadget\n9.99,Tool",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const priceColumn = result.metadata.columnMetadata?.find(
        (col) => col.name === "price",
      );
      expect(priceColumn?.detectedType).toBe("float");
      expect(priceColumn?.minValue).toBe(9.99);
      expect(priceColumn?.maxValue).toBe(29.5);
      expect(priceColumn?.avgValue).toBeDefined();
    });

    it("should consolidate integers and floats as number type", async () => {
      // Mix of integers and floats should be classified as "number", not "mixed"
      // 0 and 1 are now correctly detected as integers (numeric check runs before boolean)
      const csvData = Buffer.from("value\n0\n2.5\n1\n4.5\n50\n6.5\n70\n8.5");
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const valueColumn = result.metadata.columnMetadata?.find(
        (col) => col.name === "value",
      );
      expect(valueColumn?.detectedType).toBe("number");
      // Should NOT trigger mixed_types warning since it's all numeric
      const mixedWarning = result.metadata.dataQualityWarnings?.find(
        (w) => w.type === "mixed_types" && w.column === "value",
      );
      expect(mixedWarning).toBeUndefined();
    });

    it("should detect string column type", async () => {
      const csvData = Buffer.from("name,city\nAlice,New York\nBob,Los Angeles");
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const nameColumn = result.metadata.columnMetadata?.find(
        (col) => col.name === "name",
      );
      expect(nameColumn?.detectedType).toBe("string");
    });

    it("should detect date column type with format", async () => {
      const csvData = Buffer.from(
        "date,event\n2024-01-15,Meeting\n2024-02-20,Conference",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const dateColumn = result.metadata.columnMetadata?.find(
        (col) => col.name === "date",
      );
      expect(dateColumn?.detectedType).toBe("date");
      expect(dateColumn?.dateFormat).toBe("YYYY-MM-DD");
    });

    it("should detect email column type", async () => {
      const csvData = Buffer.from(
        "email,name\nalice@example.com,Alice\nbob@test.org,Bob",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const emailColumn = result.metadata.columnMetadata?.find(
        (col) => col.name === "email",
      );
      expect(emailColumn?.detectedType).toBe("email");
    });

    it("should detect boolean column type", async () => {
      const csvData = Buffer.from(
        "active,name\ntrue,Alice\nfalse,Bob\nyes,Charlie",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const activeColumn = result.metadata.columnMetadata?.find(
        (col) => col.name === "active",
      );
      expect(activeColumn?.detectedType).toBe("boolean");
    });

    it("should detect mixed types with low confidence", async () => {
      const csvData = Buffer.from("value\n123\nhello\n456\nworld\ntrue");
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const valueColumn = result.metadata.columnMetadata?.find(
        (col) => col.name === "value",
      );
      expect(valueColumn?.detectedType).toBe("mixed");
      expect(valueColumn?.typeConfidence).toBeLessThan(70);
    });

    it("should calculate null count correctly", async () => {
      const csvData = Buffer.from(
        "name,value\nAlice,10\nBob,\nCharlie,30\nDiana,",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const valueColumn = result.metadata.columnMetadata?.find(
        (col) => col.name === "value",
      );
      expect(valueColumn?.nullCount).toBe(2);
    });

    it("should calculate unique count correctly", async () => {
      const csvData = Buffer.from(
        "status\nactive\npending\nactive\nclosed\nactive",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const statusColumn = result.metadata.columnMetadata?.find(
        (col) => col.name === "status",
      );
      expect(statusColumn?.uniqueCount).toBe(3); // active, pending, closed
    });

    it("should include sample values", async () => {
      const csvData = Buffer.from(
        "color\nred\nblue\ngreen\nyellow\norange\npurple",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const colorColumn = result.metadata.columnMetadata?.find(
        (col) => col.name === "color",
      );
      expect(colorColumn?.sampleValues).toBeDefined();
      expect(colorColumn?.sampleValues?.length).toBeLessThanOrEqual(5);
    });

    it("should detect column name issues", async () => {
      const csvData = Buffer.from(" name with spaces ,123starts\nAlice,test");
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const col1 = result.metadata.columnMetadata?.find(
        (col) => col.name === " name with spaces ",
      );
      const col2 = result.metadata.columnMetadata?.find(
        (col) => col.name === "123starts",
      );

      expect(col1?.nameIssues).toContain("Leading or trailing whitespace");
      expect(col2?.nameIssues).toContain("Starts with a number");
    });
  });

  describe("Data quality warnings", () => {
    it("should warn about high null rate", async () => {
      const csvData = Buffer.from(
        "name,value\nAlice,\nBob,\nCharlie,\nDiana,10\nEve,",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      expect(result.metadata.dataQualityWarnings).toBeDefined();
      const nullWarning = result.metadata.dataQualityWarnings?.find(
        (w) => w.type === "high_null_rate" && w.column === "value",
      );
      expect(nullWarning).toBeDefined();
      expect(nullWarning?.message).toContain("empty/null values");
    });

    it("should warn about mixed types", async () => {
      const csvData = Buffer.from("data\n123\nhello\n456\nworld\ntrue");
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const mixedWarning = result.metadata.dataQualityWarnings?.find(
        (w) => w.type === "mixed_types",
      );
      expect(mixedWarning).toBeDefined();
      expect(mixedWarning?.severity).toBe("warning");
    });

    it("should warn about duplicate values (all same)", async () => {
      const csvData = Buffer.from(
        "status\nactive\nactive\nactive\nactive\nactive\nactive\nactive\nactive\nactive\nactive\nactive",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const dupWarning = result.metadata.dataQualityWarnings?.find(
        (w) => w.type === "duplicates",
      );
      expect(dupWarning).toBeDefined();
      expect(dupWarning?.message).toContain("same value");
    });

    it("should warn about entirely empty columns", async () => {
      const csvData = Buffer.from("name,empty_col\nAlice,\nBob,\nCharlie,");
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const emptyWarning = result.metadata.dataQualityWarnings?.find(
        (w) => w.type === "empty_values" && w.column === "empty_col",
      );
      expect(emptyWarning).toBeDefined();
      expect(emptyWarning?.message).toContain("entirely empty");
    });

    it("should warn about invalid column names", async () => {
      const csvData = Buffer.from("123invalid,name\ntest,Alice");
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      const nameWarning = result.metadata.dataQualityWarnings?.find(
        (w) => w.type === "invalid_name",
      );
      expect(nameWarning).toBeDefined();
      expect(nameWarning?.column).toBe("123invalid");
    });
  });

  describe("Data quality score", () => {
    it("should return high score for clean data", async () => {
      const csvData = Buffer.from(
        "id,name,age\n1,Alice,30\n2,Bob,25\n3,Charlie,35",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      expect(result.metadata.dataQualityScore).toBeGreaterThanOrEqual(80);
    });

    it("should return lower score for data with issues", async () => {
      const csvData = Buffer.from(
        "id,value,empty\n1,,\n2,hello,\n3,123,\n4,,\n5,true,",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      expect(result.metadata.dataQualityScore).toBeLessThan(80);
    });

    it("should return 0 for empty CSV", async () => {
      const csvData = Buffer.from("name,value");
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      expect(result.metadata.dataQualityScore).toBe(0);
    });

    it("should include dataQualityScore in metadata", async () => {
      const csvData = Buffer.from("name,age\nAlice,30\nBob,25");
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      expect(result.metadata.dataQualityScore).toBeDefined();
      expect(typeof result.metadata.dataQualityScore).toBe("number");
    });
  });

  describe("Header detection", () => {
    it("should detect headers when first row is text and data has numbers", async () => {
      const csvData = Buffer.from("name,age,score\nAlice,30,95.5\nBob,25,88.0");
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "json",
      });

      expect(result.metadata.hasHeaders).toBe(true);
    });

    it("should detect headers when column names are descriptive text", async () => {
      const csvData = Buffer.from(
        "first_name,last_name,email\nJohn,Doe,john@example.com\nJane,Smith,jane@test.org",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "json",
      });

      expect(result.metadata.hasHeaders).toBe(true);
    });

    it("should detect no headers when first row looks like data", async () => {
      // All rows are numeric data - no clear header
      const csvData = Buffer.from("1,2,3\n4,5,6\n7,8,9");
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "json",
      });

      expect(result.metadata.hasHeaders).toBe(false);
    });

    it("should detect no headers when first row contains dates like data", async () => {
      // All rows look like date/numeric data - no clear header
      const csvData = Buffer.from(
        "2024-01-01,100,50\n2024-01-02,200,75\n2024-01-03,150,60",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "json",
      });

      expect(result.metadata.hasHeaders).toBe(false);
    });

    it("should detect headers in raw format", async () => {
      const csvData = Buffer.from(
        "product,price,quantity\nWidget,19.99,100\nGadget,29.99,50",
      );
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      expect(result.metadata.hasHeaders).toBe(true);
    });

    it("should handle empty CSV for header detection", async () => {
      const csvData = Buffer.from("");
      const result = await CSVProcessor.process(csvData, {
        formatStyle: "raw",
      });

      expect(result.metadata.hasHeaders).toBe(false);
    });
  });
});
