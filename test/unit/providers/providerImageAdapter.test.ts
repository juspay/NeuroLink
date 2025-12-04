import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProviderImageAdapter } from "../../../src/lib/adapters/providerImageAdapter.js";

/**
 * Tests for ProviderImageAdapter - verifies all VISION_CAPABILITIES providers
 * have corresponding switch cases in adaptForProvider method
 */
describe("ProviderImageAdapter", () => {
  describe("supportsVision", () => {
    it("should return true for all providers defined in VISION_CAPABILITIES", () => {
      // All providers that have vision capabilities
      const visionProviders = [
        "openai",
        "google-ai",
        "anthropic",
        "azure",
        "vertex",
        "litellm",
        "mistral",
        "ollama",
        "bedrock",
      ];

      visionProviders.forEach((provider) => {
        expect(ProviderImageAdapter.supportsVision(provider)).toBe(true);
      });
    });

    it("should return false for providers without vision support", () => {
      expect(ProviderImageAdapter.supportsVision("sagemaker")).toBe(false);
      expect(ProviderImageAdapter.supportsVision("huggingface")).toBe(false);
    });
  });

  describe("getVisionProviders", () => {
    it("should return all vision-capable providers", () => {
      const providers = ProviderImageAdapter.getVisionProviders();
      expect(providers).toContain("openai");
      expect(providers).toContain("google-ai");
      expect(providers).toContain("anthropic");
      expect(providers).toContain("azure");
      expect(providers).toContain("vertex");
      expect(providers).toContain("litellm");
      expect(providers).toContain("mistral");
      expect(providers).toContain("ollama");
      expect(providers).toContain("bedrock");
    });
  });

  describe("adaptForProvider", () => {
    const mockText = "Test prompt";
    // Create a minimal mock base64 PNG image
    const mockImageBase64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const mockImages = [mockImageBase64];

    it("should handle bedrock provider (Anthropic format)", async () => {
      const result = await ProviderImageAdapter.adaptForProvider(
        mockText,
        mockImages,
        "bedrock",
        "claude-3-5-sonnet",
      );

      // Bedrock uses Anthropic format
      expect(result).toHaveProperty("messages");
      const messages = (result as { messages: unknown[] }).messages;
      expect(messages).toHaveLength(1);
      expect(messages[0]).toHaveProperty("role", "user");
    });

    it("should handle mistral provider (OpenAI format)", async () => {
      const result = await ProviderImageAdapter.adaptForProvider(
        mockText,
        mockImages,
        "mistral",
        "pixtral-12b",
      );

      // Mistral uses OpenAI format
      expect(result).toHaveProperty("messages");
      const messages = (result as { messages: unknown[] }).messages;
      expect(messages).toHaveLength(1);
      expect(messages[0]).toHaveProperty("role", "user");
    });

    it("should handle litellm provider (OpenAI format)", async () => {
      const result = await ProviderImageAdapter.adaptForProvider(
        mockText,
        mockImages,
        "litellm",
        "gpt-4o",
      );

      // LiteLLM uses OpenAI format
      expect(result).toHaveProperty("messages");
      const messages = (result as { messages: unknown[] }).messages;
      expect(messages).toHaveLength(1);
      expect(messages[0]).toHaveProperty("role", "user");
    });

    it("should handle openai provider", async () => {
      const result = await ProviderImageAdapter.adaptForProvider(
        mockText,
        mockImages,
        "openai",
        "gpt-4o",
      );

      expect(result).toHaveProperty("messages");
    });

    it("should handle anthropic provider", async () => {
      const result = await ProviderImageAdapter.adaptForProvider(
        mockText,
        mockImages,
        "anthropic",
        "claude-3-5-sonnet",
      );

      expect(result).toHaveProperty("messages");
    });

    it("should handle google-ai provider", async () => {
      const result = await ProviderImageAdapter.adaptForProvider(
        mockText,
        mockImages,
        "google-ai",
        "gemini-1.5-pro",
      );

      expect(result).toHaveProperty("contents");
    });

    it("should handle ollama provider", async () => {
      const result = await ProviderImageAdapter.adaptForProvider(
        mockText,
        mockImages,
        "ollama",
        "llava",
      );

      expect(result).toHaveProperty("messages");
    });

    it("should throw error for unsupported provider", async () => {
      await expect(
        ProviderImageAdapter.adaptForProvider(
          mockText,
          mockImages,
          "unsupported-provider",
          "some-model",
        ),
      ).rejects.toThrow("does not support vision processing");
    });

    it("should throw error for unsupported model on supported provider", async () => {
      await expect(
        ProviderImageAdapter.adaptForProvider(
          mockText,
          mockImages,
          "openai",
          "gpt-3.5-turbo", // Not a vision model
        ),
      ).rejects.toThrow("does not support vision processing");
    });
  });

  describe("getSupportedModels", () => {
    it("should return models for bedrock", () => {
      const models = ProviderImageAdapter.getSupportedModels("bedrock");
      expect(models.length).toBeGreaterThan(0);
      expect(models.some((m) => m.includes("claude"))).toBe(true);
    });

    it("should return models for mistral", () => {
      const models = ProviderImageAdapter.getSupportedModels("mistral");
      expect(models.length).toBeGreaterThan(0);
      expect(
        models.some((m) => m.includes("mistral") || m.includes("pixtral")),
      ).toBe(true);
    });

    it("should return models for litellm", () => {
      const models = ProviderImageAdapter.getSupportedModels("litellm");
      expect(models.length).toBeGreaterThan(0);
    });

    it("should return empty array for unknown provider", () => {
      const models =
        ProviderImageAdapter.getSupportedModels("unknown-provider");
      expect(models).toEqual([]);
    });
  });
});
