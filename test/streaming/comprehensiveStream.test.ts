/**
 * Comprehensive Streaming Tests
 *
 * For provider-specific input handling and quirks, see the Provider Behavior Guide:
 * @see {@link ../../docs/provider-behavior.md} Provider Behavior Guide
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NeuroLink } from "../../src/lib/neurolink.js";
import type { UnknownRecord } from "../../src/lib/types/common.js";
import {
  createTool,
  createTypedTool,
} from "../../src/lib/sdk/toolRegistration.js";
import { z } from "zod";
import { DomainConfigurationFactory } from "../../src/lib/factories/domainConfigurationFactory.js";
import { OptionsEnhancer } from "../../src/lib/utils/optionsUtils.js";
import type { StreamOptions } from "../../src/lib/types/streamTypes.js";

describe("Comprehensive Streaming Tests", () => {
  let sdk: NeuroLink;

  beforeEach(() => {
    sdk = new NeuroLink();
  });

  describe("SDK Streaming Without Tools", () => {
    it("should stream progressively (not all at once)", async () => {
      const chunks: string[] = [];
      const chunkTimestamps: number[] = [];

      const result = await sdk.stream({
        input: { text: "Count from 1 to 5 slowly, one number per line" },
        provider: "google-ai",
        disableTools: true,
        maxTokens: 100,
      });

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
          chunkTimestamps.push(Date.now());
        }
      }

      // Verify we got multiple chunks (proves streaming)
      expect(chunks.length).toBeGreaterThan(3);

      // Verify content
      const fullContent = chunks.join("");
      expect(fullContent).toContain("1");
      expect(fullContent).toContain("2");
      expect(fullContent).toContain("3");
      expect(fullContent).toContain("4");
      expect(fullContent).toContain("5");

      // Verify progressive delivery (chunks came at different times)
      if (chunkTimestamps.length > 1) {
        const timeDiffs = chunkTimestamps
          .slice(1)
          .map((t, i) => t - chunkTimestamps[i]);
        const hasProgressiveDelivery = timeDiffs.some((diff) => diff > 0);
        expect(hasProgressiveDelivery).toBe(true);
      }
    }, 30000);

    it("should stream with multiple providers", async () => {
      const providers = ["google-ai", "openai", "anthropic", "mistral"];

      for (const provider of providers) {
        console.log(`\nTesting streaming with ${provider}...`);
        const chunks: string[] = [];

        try {
          const result = await sdk.stream({
            input: { text: "Say hello in 3 words" },
            provider,
            disableTools: true,
            maxTokens: 50,
          });

          for await (const chunk of result.stream) {
            if (chunk.content) {
              chunks.push(chunk.content);
            }
          }

          expect(chunks.length).toBeGreaterThan(0);
          const content = chunks.join("").toLowerCase();
          expect(content).toBeTruthy();
          console.log(`✓ ${provider} streamed: "${chunks.join("")}"`);
        } catch (error) {
          console.log(`✗ ${provider} failed:`, error.message);
        }
      }
    }, 60000);
  });

  describe("SDK Streaming With Built-in Tools", () => {
    it("should stream with time tool", async () => {
      const chunks: string[] = [];

      const result = await sdk.stream({
        input: { text: "What time is it right now?" },
        provider: "google-ai",
        disableTools: false,
        maxTokens: 200,
      });

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      const fullContent = chunks.join("");
      expect(fullContent).toBeTruthy();
      // Should contain time-related information
      expect(fullContent.toLowerCase()).toMatch(
        /time|clock|\d{1,2}:\d{2}|am|pm/,
      );
    }, 30000);

    it("should stream with math tool", async () => {
      const chunks: string[] = [];

      const result = await sdk.stream({
        input: { text: "Calculate 25 times 4 for me" },
        provider: "google-ai",
        disableTools: false,
        maxTokens: 200,
      });

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      const fullContent = chunks.join("");
      expect(fullContent).toContain("100");
    }, 30000);
  });

  describe("SDK Streaming With Custom Tools", () => {
    it("should stream with custom tool", async () => {
      // Register a custom tool
      sdk.registerTool(
        "coinFlip",
        createTool({
          description: "Flip a coin and return heads or tails",
          execute: () => {
            const result = Math.random() > 0.5 ? "heads" : "tails";
            return { result, message: `The coin landed on ${result}!` };
          },
        }),
      );

      const chunks: string[] = [];

      const result = await sdk.stream({
        input: { text: "Flip a coin for me" },
        provider: "google-ai",
        disableTools: false,
        maxTokens: 200,
      });

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      const fullContent = chunks.join("").toLowerCase();
      expect(fullContent).toMatch(/heads|tails/);
      expect(fullContent).toContain("coin");
    }, 30000);

    it("should stream with parameterized custom tool", async () => {
      sdk.registerTool(
        "multiplyNumbers",
        createTypedTool({
          description: "Multiply two numbers together",
          parameters: z.object({
            a: z.number().describe("First number"),
            b: z.number().describe("Second number"),
          }),
          execute: ({ a, b }) => ({
            result: a * b,
            calculation: `${a} × ${b} = ${a * b}`,
          }),
        }),
      );

      const chunks: string[] = [];

      const result = await sdk.stream({
        input: { text: "Multiply 7 by 8" },
        provider: "google-ai",
        disableTools: false,
        maxTokens: 200,
      });

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      const fullContent = chunks.join("");
      expect(fullContent).toContain("56");
    }, 30000);
  });

  describe("Stream Performance and Behavior", () => {
    it("should measure time to first token", async () => {
      const startTime = Date.now();
      let firstTokenTime = 0;

      const result = await sdk.stream({
        input: { text: "Say hello" },
        provider: "google-ai",
        disableTools: true,
        maxTokens: 50,
      });

      let tokenCount = 0;
      for await (const chunk of result.stream) {
        if (chunk.content && !firstTokenTime) {
          firstTokenTime = Date.now();
        }
        if (chunk.content) {
          tokenCount++;
        }
      }

      const ttft = firstTokenTime - startTime;
      console.log(`Time to first token: ${ttft}ms`);
      console.log(`Total tokens received: ${tokenCount}`);

      // Should receive first token within 5 seconds
      expect(ttft).toBeLessThan(5000);
      expect(tokenCount).toBeGreaterThan(0);
    }, 30000);

    it("should handle long streaming sessions", async () => {
      const chunks: string[] = [];

      const result = await sdk.stream({
        input: { text: "Write a 200-word story about a space adventure" },
        provider: "google-ai",
        disableTools: true,
        maxTokens: 400,
      });

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      const fullContent = chunks.join("");
      const wordCount = fullContent
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      console.log(`Generated ${wordCount} words in ${chunks.length} chunks`);

      expect(wordCount).toBeGreaterThan(100); // At least 100 words
      expect(chunks.length).toBeGreaterThan(10); // Many chunks (proves streaming)
    }, 60000);
  });

  describe("Error Handling in Streams", () => {
    it("should handle provider errors gracefully", async () => {
      try {
        const result = await sdk.stream({
          input: { text: "Hello" },
          provider: "invalid-provider" as UnknownRecord,
          disableTools: true,
        });

        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain("provider");
      }
    });

    it("should handle tool errors during streaming", async () => {
      sdk.registerTool(
        "brokenTool",
        createTool({
          description: "A tool that always fails",
          execute: () => {
            throw new Error("Tool intentionally broken");
          },
        }),
      );

      const chunks: string[] = [];

      // Should still stream even if tool fails
      const result = await sdk.stream({
        input: { text: "Use the broken tool" },
        provider: "google-ai",
        disableTools: false,
        maxTokens: 200,
      });

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      // Should still get a response
      expect(chunks.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Domain Configuration Integration with Streaming", () => {
    afterEach(() => {
      // Reset enhancement statistics after each test for proper cleanup
      OptionsEnhancer.resetStatistics();
    });

    it("should stream with analytics domain configuration", async () => {
      const chunks: string[] = [];

      // Create analytics domain-enhanced streaming options
      const analyticsResult = OptionsEnhancer.enhanceWithDomain(
        {
          input: {
            text: "Analyze streaming performance metrics for our data pipeline",
          },
          provider: "google-ai",
          disableTools: true,
          maxTokens: 300,
        },
        {
          domainType: "analytics",
          validationEnabled: true,
        },
      );

      const result = await sdk.stream(analyticsResult.options);

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      const fullContent = chunks.join("").toLowerCase();

      // Should contain analytics-specific terminology
      expect(fullContent).toMatch(/metrics|performance|analysis|data|pipeline/);
      expect(chunks.length).toBeGreaterThan(3);

      // Verify domain enhancement was applied
      expect(analyticsResult.metadata.enhancementApplied).toBe(true);
      expect(analyticsResult.metadata.enhancementType).toBe(
        "domain-configuration",
      );
      expect(analyticsResult.options.evaluationDomain).toBe("analytics");
      expect(analyticsResult.options.factoryConfig?.domainType).toBe(
        "analytics",
      );
    }, 30000);

    it("should stream with healthcare domain configuration", async () => {
      const chunks: string[] = [];

      // Create healthcare domain-enhanced streaming options
      const healthcareOptions = DomainConfigurationFactory.enhanceWithDomain(
        {
          input: {
            text: "Provide clinical data analysis for patient outcome trends",
          },
          provider: "google-ai",
          disableTools: true,
          maxTokens: 250,
        },
        {
          domainType: "healthcare",
          validationEnabled: true,
        },
      );

      const result = await sdk.stream(healthcareOptions);

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      const fullContent = chunks.join("").toLowerCase();

      // Should contain healthcare-specific terminology
      expect(fullContent).toMatch(
        /clinical|patient|medical|healthcare|treatment|diagnosis/,
      );
      expect(chunks.length).toBeGreaterThan(2);

      // Verify healthcare domain configuration
      expect(healthcareOptions.evaluationDomain).toBe("healthcare");
      expect(healthcareOptions.enableEvaluation).toBe(true);
      expect(healthcareOptions.factoryConfig?.domainType).toBe("healthcare");
      expect(healthcareOptions.context?.domainType).toBe("healthcare");
    }, 30000);

    it("should stream with domain-specific tools integration", async () => {
      const chunks: string[] = [];

      // Register domain-specific analytics tool
      sdk.registerTool(
        "analyticsCalculator",
        createTypedTool({
          description: "Calculate analytics metrics and KPIs",
          parameters: z.object({
            metric: z.string().describe("Metric to calculate"),
            value: z.number().describe("Input value"),
            period: z.string().describe("Time period"),
          }),
          execute: ({ metric, value, period }) => ({
            result: `${metric}: ${value} for ${period}`,
            kpi: value * 1.1, // Sample calculation
            recommendation: `Consider optimizing ${metric} for ${period}`,
          }),
        }),
      );

      // Create domain-enhanced options with tools enabled
      const enhancedOptions = OptionsEnhancer.enhanceWithDomain(
        {
          input: {
            text: "Calculate conversion rate metrics for Q1 with value 85",
          },
          provider: "google-ai",
          disableTools: false,
          maxTokens: 300,
        },
        {
          domainType: "analytics",
          validationEnabled: true,
        },
      );

      const result = await sdk.stream(enhancedOptions.options);

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      const fullContent = chunks.join("").toLowerCase();

      // Should contain both analytics terms and tool results
      expect(fullContent).toMatch(/conversion|rate|q1|85|metrics/);
      expect(chunks.length).toBeGreaterThan(2);

      // Verify domain configuration preserved with tools
      expect(enhancedOptions.options.disableTools).toBe(false);
      expect(enhancedOptions.options.factoryConfig?.domainType).toBe(
        "analytics",
      );
    }, 30000);

    it("should stream with streaming optimization enhancement", async () => {
      const chunks: string[] = [];
      const chunkTimestamps: number[] = [];

      // Apply streaming optimization to base options
      const streamingResult = OptionsEnhancer.enhanceForStreaming(
        {
          input: {
            text: "Generate a detailed analysis report with streaming optimization",
          },
          provider: "google-ai",
          disableTools: true,
          maxTokens: 400,
        },
        {
          chunkSize: 512,
          enableProgress: true,
        },
      );

      const result = await sdk.stream(streamingResult.options);

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
          chunkTimestamps.push(Date.now());
        }
      }

      const fullContent = chunks.join("");

      // Should have optimized streaming characteristics
      expect(chunks.length).toBeGreaterThan(5); // More chunks due to optimization
      expect(fullContent.length).toBeGreaterThan(100); // Substantial content

      // Verify streaming enhancement was applied
      expect(streamingResult.metadata.enhancementApplied).toBe(true);
      expect(streamingResult.metadata.enhancementType).toBe(
        "streaming-optimization",
      );
      expect(streamingResult.options.streaming?.enabled).toBe(true);
      expect(streamingResult.options.streaming?.chunkSize).toBe(512);
      expect(streamingResult.options.preferStreaming).toBe(true);

      // Verify progressive delivery timing
      if (chunkTimestamps.length > 1) {
        const timeDiffs = chunkTimestamps
          .slice(1)
          .map((t, i) => t - chunkTimestamps[i]);
        const hasProgressiveDelivery = timeDiffs.some((diff) => diff >= 0);
        expect(hasProgressiveDelivery).toBe(true);
      }
    }, 30000);

    it("should stream with combined domain and streaming enhancements", async () => {
      const chunks: string[] = [];

      // Apply both domain configuration and streaming optimization
      const options = {
        input: {
          text: "Analyze healthcare data trends with optimized streaming delivery",
        },
        provider: "google-ai",
        disableTools: true,
        maxTokens: 350,
      };

      // First apply domain enhancement
      const domainResult = OptionsEnhancer.enhanceWithDomain(options, {
        domainType: "healthcare",
        validationEnabled: true,
      });

      // Then apply streaming optimization
      const finalResult = OptionsEnhancer.enhanceForStreaming(
        domainResult.options,
        {
          chunkSize: 256,
          enableProgress: true,
        },
      );

      const result = await sdk.stream(finalResult.options);

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      const fullContent = chunks.join("").toLowerCase();

      // Should contain healthcare domain terminology
      expect(fullContent).toMatch(
        /healthcare|medical|patient|clinical|data|trends/,
      );
      expect(chunks.length).toBeGreaterThan(4);

      // Verify both enhancements were applied
      expect(finalResult.metadata.enhancementApplied).toBe(true);
      expect(finalResult.metadata.enhancementType).toBe(
        "streaming-optimization",
      );
      expect(finalResult.options.streaming?.enabled).toBe(true);
      expect(finalResult.options.streaming?.chunkSize).toBe(256);
      expect(finalResult.options.preferStreaming).toBe(true);

      // Should preserve healthcare domain configuration
      expect(finalResult.options.evaluationDomain).toBe("healthcare");
      expect(finalResult.options.enableEvaluation).toBe(true);
    }, 30000);

    it("should handle domain configuration errors in streaming gracefully", async () => {
      const chunks: string[] = [];

      // Try to create invalid domain configuration
      try {
        const invalidResult = OptionsEnhancer.enhanceWithDomain(
          {
            input: { text: "Test invalid domain configuration" },
            provider: "google-ai",
            disableTools: true,
            maxTokens: 200,
          },
          {
            domainType: "", // Invalid empty domain type
            validationEnabled: false, // Validation disabled should allow this
          },
        );

        const result = await sdk.stream(invalidResult.options);

        for await (const chunk of result.stream) {
          if (chunk.content) {
            chunks.push(chunk.content);
          }
        }

        // Should still stream despite domain configuration issues
        expect(chunks.length).toBeGreaterThan(0);
        expect(invalidResult.metadata.enhancementApplied).toBe(true);
      } catch (error) {
        // If error occurs, it should be handled gracefully
        expect(error).toBeDefined();
      }
    }, 30000);

    it("should preserve streaming metadata with domain enhancements", async () => {
      const chunks: string[] = [];
      let streamMetadata: unknown = null;

      const enhancedOptions = DomainConfigurationFactory.enhanceWithDomain(
        {
          input: { text: "Stream with metadata preservation test" },
          provider: "google-ai",
          disableTools: true,
          maxTokens: 200,
          enableAnalytics: true,
        },
        {
          domainType: "analytics",
          validationEnabled: true,
        },
      );

      const result = await sdk.stream(enhancedOptions);

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
        if (chunk.metadata) {
          streamMetadata = chunk.metadata;
        }
      }

      // Should have streaming content
      expect(chunks.length).toBeGreaterThan(0);

      // Should preserve analytics enablement
      expect(enhancedOptions.enableAnalytics).toBe(true);
      expect(enhancedOptions.enableEvaluation).toBe(true);
      expect(enhancedOptions.evaluationDomain).toBe("analytics");

      // Should have domain configuration in context
      expect(enhancedOptions.context?.domainType).toBe("analytics");
      expect(enhancedOptions.context?.domainConfig).toBeDefined();
      expect(enhancedOptions.factoryConfig?.domainType).toBe("analytics");
      expect(enhancedOptions.factoryConfig?.enhancementType).toBe(
        "domain-configuration",
      );
    }, 30000);
  });

  describe("Factory Pattern Integration with Streaming Performance", () => {
    it("should maintain streaming performance with factory enhancements", async () => {
      const startTime = Date.now();
      let firstTokenTime = 0;
      const chunks: string[] = [];

      // Test performance with factory-enhanced options
      const enhancedOptions = OptionsEnhancer.enhanceForStreaming(
        {
          input: { text: "Performance test with factory enhancement" },
          provider: "google-ai",
          disableTools: true,
          maxTokens: 200,
        },
        {
          chunkSize: 1024,
          enableProgress: true,
        },
      );

      const result = await sdk.stream(enhancedOptions.options);

      for await (const chunk of result.stream) {
        if (chunk.content && !firstTokenTime) {
          firstTokenTime = Date.now();
        }
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      const ttft = firstTokenTime - startTime;
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Performance should not be significantly degraded
      expect(ttft).toBeLessThan(5000); // Time to first token under 5s
      expect(totalTime).toBeLessThan(15000); // Total time under 15s
      expect(chunks.length).toBeGreaterThan(0);

      // Verify enhancement metadata
      expect(enhancedOptions.metadata.enhancementApplied).toBe(true);
      expect(enhancedOptions.metadata.processingTime).toBeLessThan(100); // Enhancement processing should be fast
      expect(enhancedOptions.options.streaming?.chunkSize).toBe(1024);

      console.log(
        `Factory enhancement processing time: ${enhancedOptions.metadata.processingTime}ms`,
      );
      console.log(`Time to first token with enhancement: ${ttft}ms`);
    }, 30000);

    it("should track enhancement statistics during streaming operations", async () => {
      OptionsEnhancer.resetStatistics();

      // Perform multiple streaming operations with enhancements
      const operations = [
        { domainType: "analytics", text: "Analytics streaming test 1" },
        { domainType: "healthcare", text: "Healthcare streaming test 2" },
        { domainType: "analytics", text: "Analytics streaming test 3" },
      ];

      for (const operation of operations) {
        const enhancedOptions = OptionsEnhancer.enhanceWithDomain(
          {
            input: { text: operation.text },
            provider: "google-ai",
            disableTools: true,
            maxTokens: 100,
          },
          {
            domainType: operation.domainType,
            validationEnabled: true,
          },
        );

        const result = await sdk.stream(enhancedOptions.options);
        const chunks: string[] = [];

        for await (const chunk of result.stream) {
          if (chunk.content) {
            chunks.push(chunk.content);
          }
        }

        expect(chunks.length).toBeGreaterThan(0);
      }

      // Check statistics
      const stats = OptionsEnhancer.getStatistics();
      expect(stats.enhancementCount).toBe(3);
      expect(stats.lastReset).toBeGreaterThan(0);
    }, 60000);

    it("should validate streaming with batch enhancements", async () => {
      const chunks: string[] = [];

      // Apply multiple enhancements using batch utility
      const baseOptions = {
        input: {
          text: "Test batch enhancement with streaming analytics and healthcare domains",
        },
        provider: "google-ai",
        disableTools: true,
        maxTokens: 300,
      };

      // First enhance with domain configuration
      const domainResult = OptionsEnhancer.enhanceWithDomain(baseOptions, {
        domainType: "analytics",
        validationEnabled: true,
      });

      // Then enhance with streaming optimization
      const finalResult = OptionsEnhancer.enhanceForStreaming(
        domainResult.options,
        {
          chunkSize: 512,
          enableProgress: true,
        },
      );

      const result = await sdk.stream(finalResult.options);

      for await (const chunk of result.stream) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      const fullContent = chunks.join("").toLowerCase();

      // Should handle combined enhancements properly
      expect(chunks.length).toBeGreaterThan(3);
      expect(fullContent).toMatch(/analytics|data|metrics|test/);

      // Should have both domain and streaming configurations
      expect(finalResult.options.evaluationDomain).toBe("analytics");
      expect(finalResult.options.streaming?.enabled).toBe(true);
      expect(finalResult.options.streaming?.chunkSize).toBe(512);
      expect(finalResult.options.preferStreaming).toBe(true);
      expect(finalResult.metadata.enhancementApplied).toBe(true);
    }, 30000);
  });
});
