import { describe, it, expect, beforeAll, vi } from "vitest";
import { AmazonSageMakerProvider } from "../../src/lib/providers/amazonSagemaker.js";
import { AIProviderName } from "../../src/lib/core/types.js";

describe("AmazonSageMakerProvider", () => {
  beforeAll(() => {
    // Set test environment variables with fallback to mock values for security
    process.env.AWS_ACCESS_KEY_ID =
      process.env.AWS_ACCESS_KEY_ID || "mock-access-key";
    process.env.AWS_SECRET_ACCESS_KEY =
      process.env.AWS_SECRET_ACCESS_KEY || "mock-secret-key";
    process.env.AWS_REGION = process.env.AWS_REGION || "us-east-1";
    process.env.SAGEMAKER_DEFAULT_ENDPOINT =
      process.env.SAGEMAKER_DEFAULT_ENDPOINT || "mock-test-endpoint";
  });

  it("should create provider with default endpoint", () => {
    const provider = new AmazonSageMakerProvider();
    expect(provider.getProviderName()).toBe("sagemaker");
    expect(provider.modelName).toBe("mock-test-endpoint");
  });

  it("should create provider with custom endpoint", () => {
    const provider = new AmazonSageMakerProvider("custom-endpoint");
    expect(provider.getProviderName()).toBe("sagemaker");
    expect(provider.modelName).toBe("custom-endpoint");
  });

  it("should return correct provider name", () => {
    const provider = new AmazonSageMakerProvider();
    expect(provider.getProviderName()).toBe(AIProviderName.SAGEMAKER);
  });

  it("should support tools", () => {
    const provider = new AmazonSageMakerProvider();
    expect(provider.supportsTools()).toBe(true);
  });

  it("should handle endpoint not found errors", () => {
    const provider = new AmazonSageMakerProvider();
    const error = { message: "ValidationException" };
    const handledError = provider.handleProviderError(error);
    expect(handledError.message).toContain("SageMaker endpoint");
  });

  it("should handle access denied errors", () => {
    const provider = new AmazonSageMakerProvider();
    const error = { message: "AccessDeniedException" };
    const handledError = provider.handleProviderError(error);
    expect(handledError.message).toContain("access");
  });

  it("should handle model loading errors", () => {
    const provider = new AmazonSageMakerProvider();
    const error = { message: "ModelError" };
    const handledError = provider.handleProviderError(error);
    expect(handledError.message).toContain("model");
  });

  it("should handle throttling errors", () => {
    const provider = new AmazonSageMakerProvider();
    const error = { message: "ThrottlingException" };
    const handledError = provider.handleProviderError(error);
    expect(handledError.message).toContain("throttling");
  });

  it("should handle service unavailable errors", () => {
    const provider = new AmazonSageMakerProvider();
    const error = { message: "ServiceUnavailable" };
    const handledError = provider.handleProviderError(error);
    expect(handledError.message).toContain("service");
  });

  it("should handle network errors", () => {
    const provider = new AmazonSageMakerProvider();
    const error = { message: "ECONNREFUSED" };
    const handledError = provider.handleProviderError(error);
    expect(handledError.message).toContain("network");
  });

  it("should handle timeout errors", () => {
    const provider = new AmazonSageMakerProvider();
    const error = { message: "ETIMEDOUT" };
    const handledError = provider.handleProviderError(error);
    expect(handledError.message).toContain("timeout");
  });

  it("should handle DNS resolution errors", () => {
    const provider = new AmazonSageMakerProvider();
    const error = { message: "ENOTFOUND" };
    const handledError = provider.handleProviderError(error);
    expect(handledError.message).toContain("DNS");
  });

  it("should handle unknown errors", () => {
    const provider = new AmazonSageMakerProvider();
    const error = { message: "Unknown error" };
    const handledError = provider.handleProviderError(error);
    expect(handledError.message).toContain("Unknown error");
  });

  it("should validate required configuration", () => {
    // Test with missing environment variables
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.SAGEMAKER_DEFAULT_ENDPOINT;

    expect(() => new AmazonSageMakerProvider()).toThrow();

    // Restore environment variables
    process.env.AWS_ACCESS_KEY_ID = "test-access-key";
    process.env.SAGEMAKER_DEFAULT_ENDPOINT = "test-endpoint";
  });

  it("should support streaming", () => {
    const provider = new AmazonSageMakerProvider();
    expect(provider.supportsStreaming()).toBe(true);
  });

  it("should provide correct model information", () => {
    const provider = new AmazonSageMakerProvider("my-custom-model");
    expect(provider.modelName).toBe("my-custom-model");
    expect(provider.getProviderName()).toBe("sagemaker");
  });

  it("should handle configuration with session token", () => {
    process.env.AWS_SESSION_TOKEN = "test-session-token";
    const provider = new AmazonSageMakerProvider();
    expect(provider.getProviderName()).toBe("sagemaker");
    delete process.env.AWS_SESSION_TOKEN;
  });

  it("should handle custom timeout configuration", () => {
    process.env.SAGEMAKER_TIMEOUT = "60000";
    const provider = new AmazonSageMakerProvider();
    expect(provider.getProviderName()).toBe("sagemaker");
    delete process.env.SAGEMAKER_TIMEOUT;
  });

  it("should handle max retries configuration", () => {
    process.env.SAGEMAKER_MAX_RETRIES = "5";
    const provider = new AmazonSageMakerProvider();
    expect(provider.getProviderName()).toBe("sagemaker");
    delete process.env.SAGEMAKER_MAX_RETRIES;
  });

  it("should handle content type configuration", () => {
    process.env.SAGEMAKER_CONTENT_TYPE = "application/json";
    const provider = new AmazonSageMakerProvider();
    expect(provider.getProviderName()).toBe("sagemaker");
    delete process.env.SAGEMAKER_CONTENT_TYPE;
  });
});
