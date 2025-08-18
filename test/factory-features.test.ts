// NOTE: This demo imports TypeScript modules (.ts) into a JavaScript file (.js).
// It must be executed with a loader like tsx.
// You can run this demo using the pre-configured npm script:
//
// pnpm run test:factory-features
//
import { ProviderFactory } from "../src/lib/factories/providerFactory.js";
import { ProviderRegistry } from "../src/lib/factories/providerRegistry.js";
import { logger } from "../src/lib/utils/logger.js";
import chalk from "chalk";
import ora from "ora";
import { describe, it, expect, beforeEach } from "vitest";

// --- Mock Providers for advanced testing ---
class HealthyMockProvider {
  static instances = 0;
  model;
  providerName;

  constructor(modelName?: string, providerName?: string) {
    this.model = modelName;
    this.providerName = providerName;
    HealthyMockProvider.instances++;
    logger.info(
      chalk.blue(
        `  -> HealthyMockProvider instance #${HealthyMockProvider.instances} created for '${providerName}' with model '${modelName}'`,
      ),
    );
  }

  generate = async () => ({ content: "mock" });
  stream = async () => ({
    stream: (async function* () {
      yield { content: "mock" };
    })(),
  });
  healthCheck = async () => ({ isHealthy: true, message: "OK" });
  setupToolExecutor = () => {};
  gen = this.generate;
}

class UnhealthyMockProvider {
  constructor(modelName?: string, providerName?: string) {
    logger.info(
      chalk.blue(
        `  -> UnhealthyMockProvider created for '${providerName}' with model '${modelName}'`,
      ),
    );
  }
  generate = async () => ({ content: "mock" });
  stream = async () => ({
    stream: (async function* () {
      yield { content: "mock" };
    })(),
  });
  healthCheck = async () => ({
    isHealthy: false,
    message: "Service is permanently offline for testing",
  });
  setupToolExecutor = () => {};
  gen = this.generate;
}

describe("Advanced ProviderFactory Features", () => {
  beforeEach(async () => {
    // Reset and re-register providers before each test
    ProviderRegistry.clearRegistrations();
    await ProviderRegistry.registerAllProviders();
    ProviderFactory.registerProvider(
      "healthy-provider",
      HealthyMockProvider,
      "default-healthy-model",
      ["hp"],
      "HEALTHY_MODEL_VAR",
    );
    ProviderFactory.registerProvider(
      "unhealthy-provider",
      UnhealthyMockProvider,
    );
    HealthyMockProvider.instances = 0; // Reset instance count
  });

  describe("Intelligent Provider Name Suggestion", () => {
    it("Should suggest a provider for a minor typo ('anthropicc')", async () => {
      await expect(
        ProviderFactory.createProvider("anthropicc"),
      ).rejects.toThrow("Did you mean 'anthropic'?");
    });

    it("Should NOT suggest a provider for a major typo ('xyzabc')", async () => {
      await expect(ProviderFactory.createProvider("xyzabc")).rejects.toThrow(
        /Unknown provider/,
      );
      await expect(
        ProviderFactory.createProvider("xyzabc"),
      ).rejects.not.toThrow(/Did you mean/);
    });

    it("Should resolve a real provider by its alias ('gpt')", async () => {
      // This test is environment-dependent. If OPENAI_API_KEY is set, it should pass.
      // If not, it should throw an error about the missing key.
      try {
        await ProviderFactory.createProvider("gpt");
      } catch (e) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String(e.message)
            : String(e);
        expect(msg).toContain("OPENAI_API_KEY");
      }
    });
  });

  describe("Health Check and Caching", () => {
    it("Should create a new healthy provider instance", async () => {
      await ProviderFactory.createProvider("healthy-provider");
      expect(HealthyMockProvider.instances).toBe(1);
    });

    it("Should use cached instance on second call", async () => {
      await ProviderFactory.createProvider("healthy-provider");
      await ProviderFactory.createProvider("healthy-provider");
      expect(HealthyMockProvider.instances).toBe(1);
    });

    it("Should fail to create a permanently unhealthy provider", async () => {
      await expect(
        ProviderFactory.createProvider("unhealthy-provider"),
      ).rejects.toThrow("failed health check");
    });
  });

  describe("Environment Variable and Model Priority", () => {
    it("Should use the default model when no other is specified", async () => {
      const p = await ProviderFactory.createProvider("healthy-provider");
      // @ts-expect-error - model is a custom property for this test
      expect(p.model).toBe("default-healthy-model");
    });

    it("Should prioritize environment variable over the default", async () => {
      process.env.HEALTHY_MODEL_VAR = "model-from-env";
      const p = await ProviderFactory.createProvider("healthy-provider");
      delete process.env.HEALTHY_MODEL_VAR; // cleanup
      // @ts-expect-error - model is a custom property for this test
      expect(p.model).toBe("model-from-env");
    });

    it("Should prioritize direct argument over environment variable and default", async () => {
      process.env.HEALTHY_MODEL_VAR = "model-from-env";
      const p = await ProviderFactory.createProvider(
        "healthy-provider",
        "model-from-arg",
      );
      delete process.env.HEALTHY_MODEL_VAR; // cleanup
      // @ts-expect-error - model is a custom property for this test
      expect(p.model).toBe("model-from-arg");
    });
  });
});
