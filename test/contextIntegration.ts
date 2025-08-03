import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import dotenv from "dotenv";
import { execWithTimeout } from "./shared/execWithTimeout.js";

// Load environment variables
dotenv.config();

// Test constants for context integration
const TEST_TIMEOUT = 15000;
const CONTEXT_TEST_PROMPT = "What is my role and who am I?";

// Get test provider (runtime access)
const getTestProvider = () => process.env.TEST_PROVIDER || "google-ai";

describe("Context Integration Features", () => {
  beforeAll(() => {
    console.log(
      "🧪 Testing Context Integration with Factory Pattern Implementation",
    );
    console.log(`Using provider: ${getTestProvider()}`);
  });

  describe("Context Option Functionality", () => {
    it("should accept context option with JSON data", async () => {
      const contextData =
        '{"userRole":"admin","userId":"test123","sessionId":"session456"}';
      const command = `npm run cli -- generate "${CONTEXT_TEST_PROMPT}" --context '${contextData}' --provider ${getTestProvider()}`;

      const result = await execWithTimeout(command, TEST_TIMEOUT);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("✅ Text generated successfully!");
      expect(result.stdout).not.toContain("Invalid context");
    });

    it("should display context data in analytics when enabled", async () => {
      const contextData = '{"userRole":"admin","userId":"test123"}';
      const command = `npm run cli -- generate "Test with analytics" --context '${contextData}' --enableAnalytics --provider ${getTestProvider()}`;

      const result = await execWithTimeout(command, TEST_TIMEOUT);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("📊 Analytics:");
      expect(result.stdout).toContain("Context:");
      expect(result.stdout).toContain("userRole=admin");
      expect(result.stdout).toContain("userId=test123");
    });

    it("should work with combined context + analytics + evaluation", async () => {
      const contextData = '{"test":"comprehensive","feature":"combined"}';
      const command = `npm run cli -- generate "Combined feature test" --context '${contextData}' --enableAnalytics --enableEvaluation --provider ${getTestProvider()}`;

      const result = await execWithTimeout(command, TEST_TIMEOUT);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("✅ Text generated successfully!");
      expect(result.stdout).toContain("📊 Analytics:");
      expect(result.stdout).toContain("Context:");
      expect(result.stdout).toContain("test=comprehensive");
      expect(result.stdout).toContain("feature=combined");
    });

    it("should handle invalid context gracefully", async () => {
      const invalidContext = '{"invalid":}'; // Invalid JSON
      const command = `npm run cli -- generate "Test invalid context" --context '${invalidContext}' --debug --provider ${getTestProvider()}`;

      const result = await execWithTimeout(command, TEST_TIMEOUT);

      // Should gracefully handle parsing error and continue with generation
      expect(result.stderr).toContain("Invalid JSON in --context parameter");
      expect(result.stdout).toContain("Test invalid context");
      expect(
        result.success || result.stdout.includes("✅ Text generated"),
      ).toBe(true);
    });
  });

  describe("Context Factory Pattern Integration", () => {
    it("should process context using ContextFactory", async () => {
      const contextData =
        '{"applicationContext":{"name":"NeuroLink","version":"7.1.0"},"userRole":"developer"}';
      const command = `npm run cli -- generate "Factory pattern test" --context '${contextData}' --enableAnalytics --provider ${getTestProvider()}`;

      const result = await execWithTimeout(command, TEST_TIMEOUT);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("Context:");
      expect(result.stdout).toContain("userRole=developer");
    });

    it("should work with streaming commands", async () => {
      const contextData = '{"streamTest":"true","mode":"streaming"}';
      const command = `npm run cli -- stream "Stream with context" --context '${contextData}' --provider ${getTestProvider()}`;

      const result = await execWithTimeout(command, TEST_TIMEOUT);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("🔄 Streaming...");
    });
  });

  describe("Context Type Safety", () => {
    it("should validate context structure", async () => {
      const validContext =
        '{"userId":"test","userRole":"user","sessionId":"abc123"}';
      const command = `npm run cli -- generate "Type safety test" --context '${validContext}' --enableAnalytics --provider ${getTestProvider()}`;

      const result = await execWithTimeout(command, TEST_TIMEOUT);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("Context:");
      expect(result.stdout).toContain("userId=test");
      expect(result.stdout).toContain("userRole=user");
      expect(result.stdout).toContain("sessionId=abc123");
    });

    it("should handle nested context objects", async () => {
      const nestedContext =
        '{"userPreferences":{"theme":"dark","language":"en"},"organizationId":"org123"}';
      const command = `npm run cli -- generate "Nested context test" --context '${nestedContext}' --enableAnalytics --provider ${getTestProvider()}`;

      const result = await execWithTimeout(command, TEST_TIMEOUT);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("Context:");
      expect(result.stdout).toContain("organizationId=org123");
    });
  });
});
