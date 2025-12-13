import { describe, it, expect } from "vitest";
import { CSVProcessor } from "../../../src/lib/utils/csvProcessor.js";

describe("CSVProcessor", () => {
  const sampleCSV = `name,age,city
Alice,30,New York
Bob,25,Los Angeles
Charlie,35,Chicago`;

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
      // Headers should be sanitized (already valid in this case: name,description)
      expect(csvOutput).toContain("name,description");
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

  describe("Column Name Sanitization", () => {
    it("should sanitize column names with special characters", async () => {
      const csvWithSpecialChars = `Price ($),Discount (%),Email@Address
100,10,test@example.com
200,15,user@example.com`;
      const buffer = Buffer.from(csvWithSpecialChars);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "object",
      });

      const sampleData = result.metadata.sampleData as Array<
        Record<string, unknown>
      >;
      expect(sampleData[0]).toHaveProperty("priceDollar", "100");
      expect(sampleData[0]).toHaveProperty("discountPercent", "10");
      expect(sampleData[0]).toHaveProperty(
        "emailAtAddress",
        "test@example.com",
      );
    });

    it("should sanitize column names starting with numbers", async () => {
      const csvWithNumbers = `1st Place,2nd Place,3rd Place,4th Place
Gold,Silver,Bronze,Participant
Winner,Runner-up,Third,Fourth`;
      const buffer = Buffer.from(csvWithNumbers);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "object",
      });

      const sampleData = result.metadata.sampleData as Array<
        Record<string, unknown>
      >;
      expect(sampleData[0]).toHaveProperty("firstPlace", "Gold");
      expect(sampleData[0]).toHaveProperty("secondPlace", "Silver");
      expect(sampleData[0]).toHaveProperty("thirdPlace", "Bronze");
      expect(sampleData[0]).toHaveProperty("col4thPlace", "Participant");
    });

    it("should trim whitespace from column names", async () => {
      const csvWithSpaces = `  Name  ,  Age  ,  City  
Alice,30,New York
Bob,25,Los Angeles`;
      const buffer = Buffer.from(csvWithSpaces);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "object",
      });

      const sampleData = result.metadata.sampleData as Array<
        Record<string, unknown>
      >;
      expect(sampleData[0]).toHaveProperty("name", "Alice");
      expect(sampleData[0]).toHaveProperty("age", "30");
      expect(sampleData[0]).toHaveProperty("city", "New York");
      expect(sampleData[0]).not.toHaveProperty("  Name  ");
    });

    it("should handle column names with slashes and hyphens", async () => {
      const csvWithSlashes = `Name/Title,Start-Date,End/Date
CEO/Manager,2021-01-01,2022/12/31
VP/Director,2020-06-15,2023/06/30`;
      const buffer = Buffer.from(csvWithSlashes);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "object",
      });

      const sampleData = result.metadata.sampleData as Array<
        Record<string, unknown>
      >;
      expect(sampleData[0]).toHaveProperty("nameTitle", "CEO/Manager");
      expect(sampleData[0]).toHaveProperty("startDate", "2021-01-01");
      expect(sampleData[0]).toHaveProperty("endDate", "2022/12/31");
    });

    it("should convert to camelCase properly", async () => {
      const csvMixedCase = `First Name,Last Name,Phone Number
John,Doe,555-1234
Jane,Smith,555-5678`;
      const buffer = Buffer.from(csvMixedCase);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "object",
      });

      const sampleData = result.metadata.sampleData as Array<
        Record<string, unknown>
      >;
      expect(sampleData[0]).toHaveProperty("firstName", "John");
      expect(sampleData[0]).toHaveProperty("lastName", "Doe");
      expect(sampleData[0]).toHaveProperty("phoneNumber", "555-1234");
    });

    it("should handle empty column names with fallback", async () => {
      const csvWithEmpty = `name,,city
Alice,30,New York`;
      const buffer = Buffer.from(csvWithEmpty);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "object",
      });

      const sampleData = result.metadata.sampleData as Array<
        Record<string, unknown>
      >;
      expect(sampleData[0]).toHaveProperty("name", "Alice");
      expect(sampleData[0]).toHaveProperty("column", "30");
      expect(sampleData[0]).toHaveProperty("city", "New York");
    });

    it("should preserve original column names in metadata", async () => {
      const csvWithSpecialChars = `Price ($),1st Place,Name/Title
100,Gold,CEO
200,Silver,Manager`;
      const buffer = Buffer.from(csvWithSpecialChars);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
      });

      expect(result.metadata.originalColumnNames).toEqual([
        "Price ($)",
        "1st Place",
        "Name/Title",
      ]);
      expect(result.metadata.columnMapping).toEqual({
        priceDollar: "Price ($)",
        firstPlace: "1st Place",
        nameTitle: "Name/Title",
      });
    });

    it("should maintain sanitized column names in columnNames field", async () => {
      const csvWithSpecialChars = `Price ($),1st Place,Name/Title
100,Gold,CEO`;
      const buffer = Buffer.from(csvWithSpecialChars);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
      });

      expect(result.metadata.columnNames).toEqual([
        "priceDollar",
        "firstPlace",
        "nameTitle",
      ]);
    });

    it("should handle complex combination of special characters", async () => {
      const complexCSV = `Price ($),#Items,Start/End Time,% Complete,User@Domain
$100,5,9:00/17:00,75%,admin@example.com
$200,10,8:00/16:00,90%,user@example.com`;
      const buffer = Buffer.from(complexCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "object",
      });

      const sampleData = result.metadata.sampleData as Array<
        Record<string, unknown>
      >;
      expect(sampleData[0]).toHaveProperty("priceDollar", "$100");
      expect(sampleData[0]).toHaveProperty("numberItems", "5");
      expect(sampleData[0]).toHaveProperty("startEndTime", "9:00/17:00");
      expect(sampleData[0]).toHaveProperty("percentComplete", "75%");
      expect(sampleData[0]).toHaveProperty("userAtDomain", "admin@example.com");
    });

    it("should process already camelCase column names correctly", async () => {
      const validCSV = `firstName,lastName,phoneNumber
John,Doe,555-1234
Jane,Smith,555-5678`;
      const buffer = Buffer.from(validCSV);
      const result = await CSVProcessor.process(buffer, {
        formatStyle: "json",
        sampleDataFormat: "object",
      });

      const sampleData = result.metadata.sampleData as Array<
        Record<string, unknown>
      >;
      // CamelCase names are normalized to lowercase first word
      expect(sampleData[0]).toHaveProperty("firstname", "John");
      expect(sampleData[0]).toHaveProperty("lastname", "Doe");
      expect(sampleData[0]).toHaveProperty("phonenumber", "555-1234");
    });
  });
});
