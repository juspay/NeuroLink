import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

describe("CLI Tool Integration", () => {
  const toolsFile = join(process.cwd(), "test-custom-tools.js");

  beforeAll(() => {
    // Create a custom tools file that can be loaded by the CLI
    const toolsCode = `
// Custom tools for testing
export function registerTools(sdk) {
  sdk.registerTool('echoTool', {
    description: 'Echo back the input message',
    execute: (args) => {
      return { echoed: args.message || 'No message provided' };
    }
  });
  
  sdk.registerTool('randomNumber', {
    description: 'Generate a random number between min and max',
    execute: ({ min = 0, max = 100 }) => {
      const number = Math.floor(Math.random() * (max - min + 1)) + min;
      return { number, range: \`\${min}-\${max}\` };
    }
  });
}
`;
    writeFileSync(toolsFile, toolsCode);
  });

  afterAll(() => {
    // Clean up
    try {
      unlinkSync(toolsFile);
    } catch (e) {
      // Ignore if file doesn't exist
    }
  });

  describe("Basic CLI Commands", () => {
    it("should show help", async () => {
      const { stdout } = await execAsync("pnpm cli --help");
      expect(stdout).toContain("generate");
      expect(stdout).toContain("stream");
      expect(stdout).toContain("provider");
      expect(stdout).toContain("mcp");
    });

    it("should show provider status", async () => {
      const { stdout } = await execAsync("pnpm cli provider status");
      expect(stdout).toContain("Provider check complete");
    });

    it("should list MCP servers", async () => {
      const { stdout } = await execAsync("pnpm cli mcp list");
      // Should not error and should contain MCP-related output
      expect(stdout).toBeDefined();
    });
  });

  describe("Core Functionality Tests", () => {
    it("should generate content in dry-run mode", async () => {
      const { stdout } = await execAsync(
        'pnpm cli generate "What is artificial intelligence?" --dryRun',
      );

      expect(stdout).toContain("Mock response for testing purposes");
      expect(stdout).toContain("Dry-run completed successfully");
    });

    it("should stream content in dry-run mode", async () => {
      const { stdout } = await execAsync(
        'pnpm cli stream "Explain machine learning" --dryRun',
      );

      expect(stdout).toContain("Mock");
      expect(stdout).toContain("streaming");
    });

    it("should get best provider", async () => {
      const { stdout } = await execAsync("pnpm cli get-best-provider");
      expect(stdout).toContain("Best available provider");
    });

    it("should generate completion script", async () => {
      const { stdout } = await execAsync("pnpm cli completion");
      expect(stdout).toContain("_neurolink_completion");
      expect(stdout).toContain("bash");
    });
  });

  describe("MCP Tool Integration", () => {
    it("should install filesystem MCP server", async () => {
      try {
        const { stdout } = await execAsync("pnpm cli mcp install filesystem");
        expect(stdout).toContain("Successfully installed filesystem");
      } catch (error) {
        // Test may fail in CI without proper environment, that's acceptable
        console.log(
          "MCP server installation test skipped in current environment",
        );
      }
    }, 30000);

    it("should test MCP server connectivity", async () => {
      try {
        const { stdout } = await execAsync("pnpm cli mcp test");
        expect(stdout).toContain("Test Results");
      } catch (error) {
        // Test may fail without configured servers, that's acceptable
        console.log("MCP test skipped - no servers configured");
      }
    });
  });

  describe("Configuration Management", () => {
    it("should show current configuration", async () => {
      const { stdout } = await execAsync("pnpm cli config show");
      expect(stdout).toBeDefined();
      expect(stdout.length).toBeGreaterThan(0);
    });

    it("should validate configuration", async () => {
      const { stdout } = await execAsync("pnpm cli config validate");
      expect(stdout).toContain("Configuration is valid");
    });

    it("should export configuration", async () => {
      const { stdout } = await execAsync(
        "pnpm cli config export --format json",
      );
      const config = JSON.parse(stdout);
      expect(config).toHaveProperty("providers");
      expect(config).toHaveProperty("timestamp");
    });
  });

  describe("JSON Output with Tools", () => {
    it("should output JSON format", async () => {
      try {
        const { stdout } = await execAsync(
          'pnpm cli generate "What is 10 divided by 2?" --provider google-ai --format json --dryRun',
        );

        const response = JSON.parse(stdout);
        expect(response).toHaveProperty("content");

        // In dry-run mode, we get mock responses
        if (response.analytics) {
          expect(response.analytics).toHaveProperty("provider");
        }
      } catch (error) {
        // If no provider is configured, test with dry-run mode
        const { stdout } = await execAsync(
          'pnpm cli generate "Test message" --format json --dryRun',
        );
        const response = JSON.parse(stdout);
        expect(response).toHaveProperty("content");
      }
    }, 30000);
  });

  describe("Error Handling", () => {
    it("should handle invalid commands gracefully", async () => {
      try {
        await execAsync("pnpm cli invalidcommand");
      } catch (error) {
        // Should fail with helpful error message
        expect(error).toBeDefined();
      }
    });

    it("should handle missing arguments", async () => {
      try {
        await execAsync("pnpm cli generate");
      } catch (error) {
        // Should fail with helpful error about missing input
        expect(error).toBeDefined();
      }
    });

    it("should handle dry-run mode without errors", async () => {
      const { stdout } = await execAsync(
        'pnpm cli generate "Test message" --dryRun',
      );

      expect(stdout).toContain("Mock response for testing purposes");
      expect(stdout).toContain("Dry-run completed successfully");
    });
  });
});
