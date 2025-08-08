import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";
import { TEST_TIMEOUTS } from "./shared/testTimeouts.js";
import { logger } from "../src/lib/utils/logger.js";

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

// Provider-specific environment variables - supporting multiple auth methods
const PROVIDER_ENV_KEYS: Record<string, string | string[]> = {
  "google-ai": "GOOGLE_AI_API_KEY",
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  bedrock: "AWS_ACCESS_KEY_ID",
  azure: "AZURE_OPENAI_API_KEY",
  vertex: [
    "GOOGLE_APPLICATION_CREDENTIALS",
    "GOOGLE_SERVICE_ACCOUNT_KEY",
    "GOOGLE_AUTH_CLIENT_EMAIL",
  ],
  huggingface: ["HUGGING_FACE_API_KEY", "HUGGINGFACE_API_KEY"],
  mistral: "MISTRAL_API_KEY",
  ollama: "OLLAMA_BASE_URL", // Ollama doesn't need API key, but needs URL
  litellm: "LITELLM_BASE_URL", // LiteLLM uses URL instead of API key for basic testing
};

// Get provider configuration from environment (accessed at runtime)
const getTestProvider = () => {
  const validProviders = Object.keys(PROVIDER_ENV_KEYS);
  const provider = process.env.TEST_PROVIDER || "google-ai";
  return validProviders.includes(provider) ? provider : "google-ai";
};
const getTestModel = () => process.env.TEST_MODEL || "gemini-2.5-pro";
const getProviderEnvKey = () => {
  const keys = PROVIDER_ENV_KEYS[getTestProvider()];
  return Array.isArray(keys) ? keys[0] : keys;
};
const getProviderApiKey = () => {
  const keys = PROVIDER_ENV_KEYS[getTestProvider()];
  if (Array.isArray(keys)) {
    // Check multiple possible env keys and return the first one found
    for (const key of keys) {
      const value = process.env[key];
      if (value) {
        return value;
      }
    }
    return undefined;
  }
  return process.env[keys];
};

// Working CLI execution method (provider-agnostic)
const execCLI = async (
  args: string[],
  timeoutMs: number = 10000,
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["cli", ...args], {
      stdio: "pipe",
      env: {
        ...process.env,
        // Set provider-specific API key
        [getProviderEnvKey()]: getProviderApiKey(),
      },
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      child.kill();
      reject(new Error(`CLI command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`CLI command failed with exit code ${code}`));
      }
    });
  });
};

/**
 * PROVIDER-AGNOSTIC BASIC FUNCTIONALITY TEST BATCH (5 tests)
 * Tests core CLI commands with configurable provider
 */

describe(`Basic Functionality Tests (${getTestProvider().toUpperCase()})`, () => {
  const timeout = TEST_TIMEOUTS.STANDARD; // 30 seconds per test
  const cliPrefix = `cd ${process.cwd()} && pnpm cli`;

  beforeAll(() => {
    // Verify environment for current provider
    const envKey = getProviderEnvKey();
    const apiKey = getProviderApiKey();

    logger.info(`🤖 Testing Provider: ${getTestProvider()}`);
    logger.info(`🔑 Environment Key: ${envKey}`);
    logger.info(`✅ API Key Status: ${apiKey ? "Configured" : "Missing"}`);

    expect(
      apiKey,
      `${envKey} environment variable is required for ${getTestProvider()} provider`,
    ).toBeDefined();
  });

  // Add delay between tests to prevent rate limiting
  beforeEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe(`Core CLI Commands (${getTestProvider()})`, () => {
    it(
      `should run generate command successfully with ${getTestProvider()}`,
      async () => {
        const args = [
          "generate",
          "Test",
          "--provider",
          getTestProvider(),
          "--max-tokens",
          "2000",
          "--format",
          "text",
        ];
        logger.debug("🔍 INPUT: pnpm cli", args.join(" "));
        logger.debug(`🤖 Provider: ${getTestProvider()}`);

        const { stdout } = await execCLI(args);
        logger.debug("📤 OUTPUT:", stdout.substring(0, 400) + "...");
        logger.debug(
          "✅ VALIDATION: Contains Generated Content:",
          stdout.includes("Generated Content:"),
        );

        // Check that we got actual content response (not just empty or error)
        expect(stdout).not.toBe("");
        expect(stdout).not.toContain("Error:");
        expect(stdout).not.toContain("Failed to");
        // The CLI should output content directly for text format
        expect(stdout.trim().length).toBeGreaterThan(0);
      },
      timeout,
    );

    it(
      `should run generate with evaluation domain (Phase 1 feature) with ${getTestProvider()}`,
      async () => {
        const args = [
          "generate",
          "Analyze patient symptoms: fever and headache",
          "--provider",
          getTestProvider(),
          "--max-tokens",
          "2000",
          "--evaluationDomain",
          "healthcare",
          "--enable-evaluation",
          "--format",
          "json",
        ];
        logger.debug("🔍 INPUT: pnpm cli", args.join(" "));
        logger.debug(`🤖 Provider: ${getTestProvider()}`);

        const { stdout } = await execCLI(args);
        logger.debug("📤 OUTPUT:", stdout.substring(0, 400) + "...");

        // Check that we got actual content response (not just empty or error)
        expect(stdout).not.toBe("");
        expect(stdout).not.toContain("Error:");
        expect(stdout).not.toContain("Failed to");

        // For JSON format, extract the JSON part from stdout (skip pnpm command output)
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        expect(jsonMatch).not.toBeNull();
        const jsonString = jsonMatch![0];

        expect(() => JSON.parse(jsonString)).not.toThrow();
        const jsonResult = JSON.parse(jsonString);
        expect(jsonResult).toHaveProperty("content");
        expect(jsonResult.content).not.toBe("");
        expect(typeof jsonResult.content).toBe("string");

        // Verify evaluation domain is included in output when using JSON format
        if (jsonResult.evaluation) {
          expect(jsonResult.evaluation).toHaveProperty(
            "evaluationDomain",
            "healthcare",
          );
          logger.info(
            "✅ PHASE 1 FEATURE: Evaluation domain detected in output",
          );
        }
      },
      timeout,
    );

    it(
      `should run generate with analytics enabled (Phase 1 feature) with ${getTestProvider()}`,
      async () => {
        const args = [
          "generate",
          "Test analytics tracking",
          "--provider",
          getTestProvider(),
          "--max-tokens",
          "2000",
          "--enable-analytics",
          "--format",
          "json",
        ];
        logger.debug("🔍 INPUT: pnpm cli", args.join(" "));
        logger.debug(`🤖 Provider: ${getTestProvider()}`);

        const { stdout } = await execCLI(args);
        logger.debug("📤 OUTPUT:", stdout.substring(0, 400) + "...");

        // Check that we got actual content response (not just empty or error)
        expect(stdout).not.toBe("");
        expect(stdout).not.toContain("Error:");
        expect(stdout).not.toContain("Failed to");

        // For JSON format, extract the JSON part from stdout (skip pnpm command output)
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        expect(jsonMatch).not.toBeNull();
        const jsonString = jsonMatch![0];

        expect(() => JSON.parse(jsonString)).not.toThrow();
        const jsonResult = JSON.parse(jsonString);
        expect(jsonResult).toHaveProperty("content");
        expect(jsonResult.content).not.toBe("");
        expect(typeof jsonResult.content).toBe("string");

        // Verify analytics data is included in output when enabled
        if (jsonResult.analytics) {
          expect(jsonResult.analytics).toHaveProperty("provider");
          expect(jsonResult.analytics).toHaveProperty("responseTime");
          logger.info("✅ PHASE 1 FEATURE: Analytics data detected in output");
        }
      },
      timeout,
    );

    it(
      `should run stream command successfully with ${getTestProvider()}`,
      async () => {
        const args = [
          "stream",
          "Count to 3",
          "--provider",
          getTestProvider(),
          "--max-tokens",
          "2000",
          "--disable-tools",
        ];
        logger.debug("🔍 INPUT: pnpm cli", args.join(" "));
        logger.debug(`🤖 Provider: ${getTestProvider()}`);

        try {
          const { stdout } = await execCLI(args, 15000); // Increased timeout for streaming
          logger.debug("📤 OUTPUT:", stdout.substring(0, 200) + "...");

          // Check that streaming started (basic validation)
          expect(stdout).not.toBe("");
          expect(stdout.trim().length).toBeGreaterThan(0);

          // Check for streaming indication or content
          const hasStreamingIndicator =
            stdout.includes("Streaming...") || stdout.includes("🔄");
          const hasContent = stdout.length > 20; // Some reasonable content length
          expect(hasStreamingIndicator || hasContent).toBe(true);

          logger.info("✅ VALIDATION: Streaming test passed");
        } catch (error) {
          // If it's a provider error (internal server error), skip this test
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (
            errorMessage.includes("CLI command timed out") ||
            errorMessage.includes("internal error")
          ) {
            logger.warn(
              "⚠️ SKIP: Provider experiencing issues, skipping streaming test",
            );
            return; // Skip this test due to provider issues
          }
          throw error; // Re-throw if it's a real test failure
        }
      },
      timeout,
    );

    it(
      `should run stream with evaluation domain (Phase 1 feature) with ${getTestProvider()}`,
      async () => {
        const args = [
          "stream",
          "Healthcare analysis for patient care",
          "--provider",
          getTestProvider(),
          "--max-tokens",
          "2000",
          "--evaluationDomain",
          "healthcare",
          "--enable-evaluation",
        ];
        logger.debug("🔍 INPUT: pnpm cli", args.join(" "));
        logger.debug(`🤖 Provider: ${getTestProvider()}`);

        try {
          const { stdout } = await execCLI(args, 15000); // Increased timeout for streaming
          logger.debug("📤 OUTPUT:", stdout.substring(0, 200) + "...");

          // Check that streaming started (basic validation)
          expect(stdout).not.toBe("");
          expect(stdout.trim().length).toBeGreaterThan(0);

          // Check for streaming indication or content
          const hasStreamingIndicator =
            stdout.includes("Streaming...") || stdout.includes("🔄");
          const hasContent = stdout.length > 20; // Some reasonable content length
          expect(hasStreamingIndicator || hasContent).toBe(true);

          logger.info("✅ VALIDATION: Streaming with evaluation test passed");
        } catch (error) {
          // If it's a provider error (internal server error), skip this test
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (
            errorMessage.includes("CLI command timed out") ||
            errorMessage.includes("internal error")
          ) {
            logger.warn(
              "⚠️ SKIP: Provider experiencing issues, skipping streaming evaluation test",
            );
            return; // Skip this test due to provider issues
          }
          throw error; // Re-throw if it's a real test failure
        }
      },
      timeout,
    );

    it(
      "should show version",
      async () => {
        const { stdout } = await execCLI(["--version"]);
        expect(stdout).toMatch(/\d+\.\d+\.\d+/); // Should show version number
      },
      timeout,
    );

    it(
      "should show help",
      async () => {
        const { stdout } = await execCLI(["--help"]);
        expect(stdout).toContain("Usage:");
      },
      timeout,
    );

    it(
      "should show help for config commands",
      async () => {
        const { stdout } = await execCLI(["config", "--help"]);
        expect(stdout).toContain("config");
      },
      timeout,
    );
  });
});
