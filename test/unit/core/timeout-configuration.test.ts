import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getTimeout,
  DEFAULT_TIMEOUTS,
  PROVIDER_TIMEOUTS,
} from "../../../src/lib/core/constants.js";

describe("Centralized Timeout Configuration", () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env vars before each test
    delete process.env.NEUROLINK_REQUEST_TIMEOUT;
    delete process.env.NEUROLINK_STREAMING_TIMEOUT;
    delete process.env.NEUROLINK_HEALTH_CHECK_TIMEOUT;
    delete process.env.NEUROLINK_TOOL_EXECUTION_TIMEOUT;
  });

  afterEach(() => {
    // Restore original env vars
    process.env = { ...originalEnv };
  });

  describe("DEFAULT_TIMEOUTS", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_TIMEOUTS.REQUEST).toBe(60000);
      expect(DEFAULT_TIMEOUTS.STREAMING).toBe(120000);
      expect(DEFAULT_TIMEOUTS.HEALTH_CHECK).toBe(10000);
      expect(DEFAULT_TIMEOUTS.TOOL_EXECUTION).toBe(30000);
    });

    it("should be immutable", () => {
      expect(() => {
        // @ts-expect-error - Testing immutability
        DEFAULT_TIMEOUTS.REQUEST = 99999;
      }).toThrow();
    });
  });

  describe("PROVIDER_TIMEOUTS", () => {
    it("should have correct provider overrides", () => {
      expect(PROVIDER_TIMEOUTS.ollama?.REQUEST).toBe(120000);
      expect(PROVIDER_TIMEOUTS.bedrock?.REQUEST).toBe(90000);
      expect(PROVIDER_TIMEOUTS.vertex?.REQUEST).toBe(90000);
      expect(PROVIDER_TIMEOUTS.huggingface?.REQUEST).toBe(120000);
      expect(PROVIDER_TIMEOUTS.sagemaker?.REQUEST).toBe(120000);
    });

    it("should have streaming overrides for slower providers", () => {
      expect(PROVIDER_TIMEOUTS.ollama?.STREAMING).toBe(180000);
      expect(PROVIDER_TIMEOUTS.huggingface?.STREAMING).toBe(180000);
    });
  });

  describe("getTimeout()", () => {
    describe("default behavior", () => {
      it("should return default timeout for REQUEST without provider", () => {
        expect(getTimeout("REQUEST")).toBe(60000);
      });

      it("should return default timeout for STREAMING without provider", () => {
        expect(getTimeout("STREAMING")).toBe(120000);
      });

      it("should return default timeout for HEALTH_CHECK without provider", () => {
        expect(getTimeout("HEALTH_CHECK")).toBe(10000);
      });

      it("should return default timeout for TOOL_EXECUTION without provider", () => {
        expect(getTimeout("TOOL_EXECUTION")).toBe(30000);
      });
    });

    describe("provider overrides", () => {
      it("should use provider-specific timeout for ollama REQUEST", () => {
        expect(getTimeout("REQUEST", "ollama")).toBe(120000);
      });

      it("should use provider-specific timeout for bedrock REQUEST", () => {
        expect(getTimeout("REQUEST", "bedrock")).toBe(90000);
      });

      it("should fall back to default for providers without overrides", () => {
        expect(getTimeout("REQUEST", "openai")).toBe(60000);
        expect(getTimeout("REQUEST", "anthropic")).toBe(60000);
      });

      it("should fall back to default when provider override doesn't specify operation", () => {
        // bedrock only overrides REQUEST, not STREAMING
        expect(getTimeout("STREAMING", "bedrock")).toBe(120000);
      });

      it("should handle provider name case and format variations", () => {
        // Test that provider lookup is case-insensitive
        expect(getTimeout("REQUEST", "OLLAMA")).toBe(120000);
        expect(getTimeout("REQUEST", "Ollama")).toBe(120000);
      });

      it("should handle provider names with underscores and hyphens", () => {
        // huggingface can be written as hugging_face or hugging-face
        expect(getTimeout("REQUEST", "huggingface")).toBe(120000);
        expect(getTimeout("REQUEST", "hugging_face")).toBe(120000);
        expect(getTimeout("REQUEST", "hugging-face")).toBe(120000);
      });
    });

    describe("environment variable overrides", () => {
      it("should use env var for REQUEST timeout", () => {
        process.env.NEUROLINK_REQUEST_TIMEOUT = "90000";
        expect(getTimeout("REQUEST")).toBe(90000);
        expect(getTimeout("REQUEST", "ollama")).toBe(90000); // env var takes precedence
      });

      it("should use env var for STREAMING timeout", () => {
        process.env.NEUROLINK_STREAMING_TIMEOUT = "180000";
        expect(getTimeout("STREAMING")).toBe(180000);
      });

      it("should use env var for HEALTH_CHECK timeout", () => {
        process.env.NEUROLINK_HEALTH_CHECK_TIMEOUT = "5000";
        expect(getTimeout("HEALTH_CHECK")).toBe(5000);
      });

      it("should use env var for TOOL_EXECUTION timeout", () => {
        process.env.NEUROLINK_TOOL_EXECUTION_TIMEOUT = "45000";
        expect(getTimeout("TOOL_EXECUTION")).toBe(45000);
      });

      it("should ignore invalid env var values", () => {
        process.env.NEUROLINK_REQUEST_TIMEOUT = "invalid";
        expect(getTimeout("REQUEST")).toBe(60000); // falls back to default
      });

      it("should ignore negative env var values", () => {
        process.env.NEUROLINK_REQUEST_TIMEOUT = "-1000";
        expect(getTimeout("REQUEST")).toBe(60000); // falls back to default
      });

      it("should ignore zero env var values", () => {
        process.env.NEUROLINK_REQUEST_TIMEOUT = "0";
        expect(getTimeout("REQUEST")).toBe(60000); // falls back to default
      });

      it("should handle multiple env vars at once", () => {
        process.env.NEUROLINK_REQUEST_TIMEOUT = "75000";
        process.env.NEUROLINK_STREAMING_TIMEOUT = "150000";
        process.env.NEUROLINK_HEALTH_CHECK_TIMEOUT = "8000";

        expect(getTimeout("REQUEST")).toBe(75000);
        expect(getTimeout("STREAMING")).toBe(150000);
        expect(getTimeout("HEALTH_CHECK")).toBe(8000);
      });
    });

    describe("priority order", () => {
      it("should prioritize: env var > provider override > default", () => {
        // Default: 60000
        expect(getTimeout("REQUEST")).toBe(60000);

        // Provider override: 120000
        expect(getTimeout("REQUEST", "ollama")).toBe(120000);

        // Env var should override both
        process.env.NEUROLINK_REQUEST_TIMEOUT = "45000";
        expect(getTimeout("REQUEST")).toBe(45000);
        expect(getTimeout("REQUEST", "ollama")).toBe(45000); // env var wins
      });
    });

    describe("edge cases", () => {
      it("should handle undefined provider gracefully", () => {
        expect(getTimeout("REQUEST", undefined)).toBe(60000);
      });

      it("should handle empty string provider", () => {
        expect(getTimeout("REQUEST", "")).toBe(60000);
      });

      it("should handle unknown provider names", () => {
        expect(getTimeout("REQUEST", "unknown-provider")).toBe(60000);
      });
    });
  });

  describe("Integration with existing code", () => {
    it("should maintain backward compatibility with DEFAULT_TIMEOUT", () => {
      // The constant DEFAULT_TIMEOUT should still exist for legacy code
      const { DEFAULT_TIMEOUT } = require("../../../src/lib/core/constants.js");
      expect(DEFAULT_TIMEOUT).toBe(60000);
      expect(DEFAULT_TIMEOUT).toBe(DEFAULT_TIMEOUTS.REQUEST);
    });
  });

  describe("Real-world scenarios", () => {
    it("should provide appropriate timeouts for local model providers", () => {
      // Local models need more time
      expect(getTimeout("REQUEST", "ollama")).toBeGreaterThan(
        getTimeout("REQUEST", "openai"),
      );
    });

    it("should provide shorter timeouts for health checks than requests", () => {
      expect(getTimeout("HEALTH_CHECK")).toBeLessThan(getTimeout("REQUEST"));
    });

    it("should provide longer timeouts for streaming than requests", () => {
      expect(getTimeout("STREAMING")).toBeGreaterThan(getTimeout("REQUEST"));
    });

    it("should allow custom configuration via environment", () => {
      // Simulate production environment with longer timeouts
      process.env.NEUROLINK_REQUEST_TIMEOUT = "120000";
      process.env.NEUROLINK_STREAMING_TIMEOUT = "300000";

      expect(getTimeout("REQUEST")).toBe(120000);
      expect(getTimeout("STREAMING")).toBe(300000);
    });
  });
});
