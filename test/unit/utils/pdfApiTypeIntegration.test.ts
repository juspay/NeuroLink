/**
 * Integration test for PDF API type handling in buildMultimodalMessagesArray
 * Tests PC-004: PDF API Type Field Never Used - Integration test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildMultimodalMessagesArray } from "../../../src/lib/utils/messageBuilder.js";
import type { GenerateOptions } from "../../../src/lib/types/generateTypes.js";
import * as fs from "fs";
import * as path from "path";

// Mock logger to capture log output - must be defined inline for vi.mock hoisting
vi.mock("../../../src/lib/utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("PDF API Type Integration - buildMultimodalMessagesArray", () => {
  // Import logger mock after mocking
  let mockLogger: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get the mocked logger
    const loggerModule = await import("../../../src/lib/utils/logger.js");
    mockLogger = loggerModule.logger as typeof mockLogger;
  });

  // Create a minimal valid PDF buffer for testing
  const testPdfBuffer = Buffer.from("%PDF-1.4\n%Test PDF Content\n", "utf-8");

  describe("Document API Providers", () => {
    it("should use inline format for Anthropic (document API)", async () => {
      const options: GenerateOptions = {
        input: {
          text: "Analyze this PDF",
          pdfFiles: [testPdfBuffer],
        },
      };

      const messages = await buildMultimodalMessagesArray(
        options,
        "anthropic",
        "claude-3-5-sonnet-20240620",
      );

      // Verify buildPDFContent was called with correct API type logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Using document API (inline)"),
      );

      // Verify message structure
      expect(messages).toBeDefined();
      expect(messages.length).toBeGreaterThan(0);
    });

    it("should use inline format for Bedrock (document API)", async () => {
      const options: GenerateOptions = {
        input: {
          text: "Analyze this PDF",
          pdfFiles: [testPdfBuffer],
        },
      };

      const messages = await buildMultimodalMessagesArray(
        options,
        "bedrock",
        "anthropic.claude-3-sonnet-20240229-v1:0",
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Using document API (inline)"),
      );
    });

    it("should use inline format for Vertex (document API)", async () => {
      const options: GenerateOptions = {
        input: {
          text: "Analyze this PDF",
          pdfFiles: [testPdfBuffer],
        },
      };

      const messages = await buildMultimodalMessagesArray(
        options,
        "vertex",
        "gemini-1.5-flash",
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Using document API (inline)"),
      );
    });
  });

  describe("Files API Providers", () => {
    it("should warn about missing upload for OpenAI (files-api)", async () => {
      const options: GenerateOptions = {
        input: {
          text: "Analyze this PDF",
          pdfFiles: [testPdfBuffer],
        },
      };

      const messages = await buildMultimodalMessagesArray(
        options,
        "openai",
        "gpt-4-vision-preview",
      );

      // Should log warning about missing file upload implementation
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "uses files-api but file upload is not yet implemented",
        ),
      );

      // Verify message structure
      expect(messages).toBeDefined();
      expect(messages.length).toBeGreaterThan(0);
    });

    it("should warn about missing upload for Google AI Studio (files-api)", async () => {
      const options: GenerateOptions = {
        input: {
          text: "Analyze this PDF",
          pdfFiles: [testPdfBuffer],
        },
      };

      const messages = await buildMultimodalMessagesArray(
        options,
        "google-ai",
        "gemini-1.5-flash",
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "uses files-api but file upload is not yet implemented",
        ),
      );
    });

    it("should warn about missing upload for Azure (files-api)", async () => {
      const options: GenerateOptions = {
        input: {
          text: "Analyze this PDF",
          pdfFiles: [testPdfBuffer],
        },
      };

      const messages = await buildMultimodalMessagesArray(
        options,
        "azure",
        "gpt-4-vision",
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "uses files-api but file upload is not yet implemented",
        ),
      );
    });
  });

  describe("Multiple PDFs", () => {
    it("should handle multiple PDFs and check API type for each", async () => {
      const pdf1 = Buffer.from("%PDF-1.4\n%First PDF\n", "utf-8");
      const pdf2 = Buffer.from("%PDF-1.4\n%Second PDF\n", "utf-8");

      const options: GenerateOptions = {
        input: {
          text: "Analyze these PDFs",
          pdfFiles: [pdf1, pdf2],
        },
      };

      const messages = await buildMultimodalMessagesArray(
        options,
        "anthropic",
        "claude-3-5-sonnet-20240620",
      );

      // Should have called buildPDFContent twice
      const infoCallsWithPDF = mockLogger.info.mock.calls.filter(
        (call) =>
          call[0].includes("Using document API") ||
          call[0].includes("Added to content"),
      );

      // At least 2 calls for the 2 PDFs
      expect(infoCallsWithPDF.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Provider without PDF config", () => {
    it("should throw error when PDF file is provided for unconfigured provider", async () => {
      const options: GenerateOptions = {
        input: {
          text: "Analyze this PDF",
          pdfFiles: [testPdfBuffer],
        },
      };

      // This should throw during PDF processing, not during buildPDFContent
      await expect(
        buildMultimodalMessagesArray(options, "unknown-provider", "some-model"),
      ).rejects.toThrow(/PDF files are not configured/);
    });
  });
});
