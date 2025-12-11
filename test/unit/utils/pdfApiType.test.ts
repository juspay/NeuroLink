/**
 * Tests for PDF API type handling in message builder
 * Tests PC-004: PDF API Type Field Never Used
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PDFProcessor } from "../../../src/lib/utils/pdfProcessor.js";
import * as fs from "fs";

// Mock logger to avoid console output during tests
vi.mock("../../../src/lib/utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("PDF API Type Detection", () => {
  describe("PDFProcessor.getProviderConfig", () => {
    it("should return document API type for Anthropic", () => {
      const config = PDFProcessor.getProviderConfig("anthropic");
      expect(config).toBeDefined();
      expect(config?.apiType).toBe("document");
    });

    it("should return document API type for Bedrock", () => {
      const config = PDFProcessor.getProviderConfig("bedrock");
      expect(config).toBeDefined();
      expect(config?.apiType).toBe("document");
    });

    it("should return document API type for Vertex", () => {
      const config = PDFProcessor.getProviderConfig("vertex");
      expect(config).toBeDefined();
      expect(config?.apiType).toBe("document");
    });

    it("should return document API type for Google Vertex", () => {
      const config = PDFProcessor.getProviderConfig("google-vertex");
      expect(config).toBeDefined();
      expect(config?.apiType).toBe("document");
    });

    it("should return files-api API type for OpenAI", () => {
      const config = PDFProcessor.getProviderConfig("openai");
      expect(config).toBeDefined();
      expect(config?.apiType).toBe("files-api");
    });

    it("should return files-api API type for Google AI Studio", () => {
      const config = PDFProcessor.getProviderConfig("google-ai-studio");
      expect(config).toBeDefined();
      expect(config?.apiType).toBe("files-api");
    });

    it("should return files-api API type for Gemini", () => {
      const config = PDFProcessor.getProviderConfig("gemini");
      expect(config).toBeDefined();
      expect(config?.apiType).toBe("files-api");
    });

    it("should return files-api API type for Azure", () => {
      const config = PDFProcessor.getProviderConfig("azure");
      expect(config).toBeDefined();
      expect(config?.apiType).toBe("files-api");
    });

    it("should return files-api API type for Azure OpenAI", () => {
      const config = PDFProcessor.getProviderConfig("azure-openai");
      expect(config).toBeDefined();
      expect(config?.apiType).toBe("files-api");
    });

    it("should return null for unknown provider", () => {
      const config = PDFProcessor.getProviderConfig("unknown-provider");
      expect(config).toBeNull();
    });
  });

  describe("PDF Processing with API Type", () => {
    let testPdfBuffer: Buffer;

    beforeEach(() => {
      // Create a minimal valid PDF buffer for testing
      // PDF signature: %PDF-1.4
      testPdfBuffer = Buffer.from("%PDF-1.4\n%Test PDF\n", "utf-8");
    });

    it("should include apiType in metadata for document API providers", async () => {
      const result = await PDFProcessor.process(testPdfBuffer, {
        provider: "anthropic",
      });

      expect(result.type).toBe("pdf");
      expect(result.metadata.apiType).toBe("document");
      expect(result.metadata.provider).toBe("anthropic");
    });

    it("should include apiType in metadata for files-api providers", async () => {
      const result = await PDFProcessor.process(testPdfBuffer, {
        provider: "openai",
      });

      expect(result.type).toBe("pdf");
      expect(result.metadata.apiType).toBe("files-api");
      expect(result.metadata.provider).toBe("openai");
    });

    it("should throw error for provider without PDF config", async () => {
      await expect(
        PDFProcessor.process(testPdfBuffer, {
          provider: "unknown-provider",
        }),
      ).rejects.toThrow(/PDF files are not configured/);
    });
  });
});

describe("PDF API Type Configuration Coverage", () => {
  it("should have apiType defined for all PDF-supporting providers", () => {
    const providers = [
      "anthropic",
      "bedrock",
      "google-vertex",
      "vertex",
      "google-ai-studio",
      "gemini",
      "google-ai",
      "openai",
      "azure",
      "azure-openai",
      "litellm",
      "openai-compatible",
      "mistral",
      "hugging-face",
      "huggingface",
    ];

    providers.forEach((provider) => {
      const config = PDFProcessor.getProviderConfig(provider);
      expect(config, `Provider ${provider} should have config`).toBeDefined();
      expect(
        config?.apiType,
        `Provider ${provider} should have apiType`,
      ).toBeDefined();
      expect(
        ["document", "files-api", "unsupported"],
        `Provider ${provider} should have valid apiType`,
      ).toContain(config?.apiType);
    });
  });

  it("should categorize providers correctly by API type", () => {
    const documentAPIProviders = ["anthropic", "bedrock", "vertex"];
    const filesAPIProviders = ["openai", "google-ai-studio", "azure"];

    documentAPIProviders.forEach((provider) => {
      const config = PDFProcessor.getProviderConfig(provider);
      expect(config?.apiType, `${provider} should use document API`).toBe(
        "document",
      );
    });

    filesAPIProviders.forEach((provider) => {
      const config = PDFProcessor.getProviderConfig(provider);
      expect(config?.apiType, `${provider} should use files-api`).toBe(
        "files-api",
      );
    });
  });
});
