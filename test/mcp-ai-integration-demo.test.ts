/**
 * REAL AI-MCP INTEGRATION DEMONSTRATION
 *
 * This test demonstrates actual AI using custom tools and MCP servers
 * during text generation, proving the complete integration works end-to-end.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NeuroLink } from "../src/lib/neurolink.js";
import { createTool } from "../src/lib/sdk/tool-registration.js";
import {
  create,
  addDependencies,
  subtractDependencies,
  multiplyDependencies,
  divideDependencies,
  powDependencies,
  sqrtDependencies,
  absDependencies,
} from "mathjs";

describe("Real AI-MCP Integration Demo", () => {
  let sdk: NeuroLink;

  beforeEach(() => {
    sdk = new NeuroLink();
  });

  it("should demonstrate AI using custom tools during generation", async () => {
    console.log("\n🤖 DEMO: AI using custom tools during text generation");

    // Add custom tools that AI can use
    const weatherTool = createTool({
      description: "Get current weather information for a city",
      execute: (params: { city: string }) => {
        console.log(`   🌤️  Getting weather for: ${params.city}`);
        // Simulated weather data
        const weatherData = {
          city: params.city,
          temperature: 22,
          condition: "sunny",
          humidity: 65,
          windSpeed: 10,
          timestamp: new Date().toISOString(),
        };
        return weatherData;
      },
    });

    const calculatorTool = createTool({
      description: "Perform mathematical calculations",
      execute: (params: { expression: string }) => {
        console.log(`   🧮 Calculating: ${params.expression}`);

        // Validate the mathematical expression before parsing
        const isValidExpression =
          /^[0-9+\-*/^().\s]+$/.test(params.expression) &&
          params.expression.length <= 100;
        if (!isValidExpression) {
          return {
            error:
              "Invalid mathematical expression. Ensure it contains only numbers, operators, and parentheses, and is under 100 characters.",
            expression: params.expression,
            validated_at: new Date().toISOString(),
          };
        }

        try {
          // Use restricted mathjs configuration for secure evaluation
          // Create a restricted math environment with only specific functions for security
          const dependencies = {
            addDependencies,
            subtractDependencies,
            multiplyDependencies,
            divideDependencies,
            powDependencies,
            sqrtDependencies,
            absDependencies,
          };

          const math = create(dependencies, {
            matrix: "Array",
            number: "number",
            precision: 64,
          });

          // Validate and parse the mathematical expression using mathjs
          try {
            const parsedExpression = math.parse(params.expression);
            const result = parsedExpression.evaluate();
            return {
              expression: params.expression,
              result: result,
              calculated_at: new Date().toISOString(),
            };
          } catch (error: any) {
            return {
              error: `Mathematical evaluation failed: ${error.message || "Invalid expression"}`,
              expression: params.expression,
              calculated_at: new Date().toISOString(),
            };
          }
        } catch (error: any) {
          // Outer catch for any unexpected errors
          return {
            error: `Calculation failed: ${error.message || "Unknown error"}`,
          };
        }
      },
    });

    // Register tools
    sdk.registerTool("getWeather", weatherTool);
    sdk.registerTool("calculate", calculatorTool);

    // Add MCP server with data tools
    await sdk.addInMemoryMCPServer("data-tools-server", {
      server: {
        title: "Data Processing Tools",
        tools: {
          formatData: {
            description: "Format data into readable table or summary",
            execute: async (params: { data: any; format: string }) => {
              console.log(`   📊 Formatting data as: ${params.format}`);

              if (params.format === "table") {
                if (Array.isArray(params.data)) {
                  return {
                    formatted: params.data
                      .map((item) =>
                        typeof item === "object"
                          ? JSON.stringify(item)
                          : String(item),
                      )
                      .join(" | "),
                    format: "table",
                    count: params.data.length,
                  };
                }
              }

              return {
                formatted: JSON.stringify(params.data, null, 2),
                format: params.format,
                processed_at: new Date().toISOString(),
              };
            },
          },
          generateReport: {
            description: "Generate a summary report from provided data",
            execute: async (params: { title: string; data: any[] }) => {
              console.log(`   📋 Generating report: ${params.title}`);

              return {
                title: params.title,
                summary: `Report generated with ${params.data.length} data points`,
                total_items: params.data.length,
                generated_at: new Date().toISOString(),
                status: "completed",
              };
            },
          },
        },
      },
    });

    console.log("\n   🎯 Testing tool availability to AI:");
    const allTools = await sdk.getAllAvailableTools();
    const customTools = allTools.filter((t) =>
      ["getWeather", "calculate"].includes(t.toolName),
    );
    const mcpTools = allTools.filter((t) => t.serverId === "data-tools-server");

    expect(customTools.length).toBe(2);
    expect(mcpTools.length).toBe(2);
    console.log(`   ✅ Custom tools available: ${customTools.length}`);
    console.log(`   ✅ MCP tools available: ${mcpTools.length}`);

    // Now generate AI content that might use these tools
    console.log("\n   🤖 AI generating content with tool access:");

    const result = await sdk.generate({
      input: {
        text: "What's the weather like in London today? Also, can you calculate 25 * 4 + 10 for me?",
      },
      provider: "google-ai",
      maxTokens: 1000,
      enableAnalytics: true,
    });

    expect(result.content).toBeDefined();
    expect(result.content.length).toBeGreaterThan(0);
    console.log(
      `   ✅ AI generated response: ${result.content.substring(0, 100)}...`,
    );
    console.log(`   ✅ Tools used: ${result.toolsUsed.length}`);
    console.log(`   ✅ Enhanced with tools: ${result.enhancedWithTools}`);

    // Verify the AI had access to our tools
    expect(result.availableTools?.length || 0).toBeGreaterThan(15); // Built-in + custom + MCP tools
    const hasCustomTools =
      result.availableTools?.some((t) => t.name === "getWeather") || false;
    const hasMCPTools =
      result.availableTools?.some((t) => t.name === "formatData") || false;

    expect(hasCustomTools).toBe(true);
    expect(hasMCPTools).toBe(true);
    console.log(`   ✅ AI had access to custom tools: ${hasCustomTools}`);
    console.log(`   ✅ AI had access to MCP tools: ${hasMCPTools}`);
  }, 30000); // 30 second timeout for AI generation

  it("should demonstrate streaming with tool integration", async () => {
    console.log("\n🌊 DEMO: Streaming with MCP tool integration");

    // Add a time-based tool for streaming demo
    const timestampTool = createTool({
      description: "Get current timestamp with timezone information",
      execute: (params: { timezone?: string }) => {
        console.log(
          `   ⏰ Getting timestamp for timezone: ${params.timezone || "UTC"}`,
        );
        return {
          timestamp: Date.now(),
          iso: new Date().toISOString(),
          timezone: params.timezone || "UTC",
          formatted: new Date().toLocaleString(),
        };
      },
    });

    sdk.registerTool("getTimestamp", timestampTool);

    console.log("\n   🎯 Testing streaming with tool integration:");

    const streamResult = await sdk.stream({
      input: {
        text: "What time is it now? Please be specific about the current time and date.",
      },
      provider: "google-ai",
      maxTokens: 500,
    });

    let chunks = 0;
    let content = "";

    for await (const chunk of streamResult.stream) {
      content += chunk.content || "";
      chunks++;
      if (chunks > 20) {
        break;
      } // Prevent infinite streaming for demo
    }

    expect(chunks).toBeGreaterThan(0);
    expect(content.length).toBeGreaterThan(0);
    console.log(
      `   ✅ Streamed ${chunks} chunks, total content: ${content.length} chars`,
    );
    console.log(
      `   ✅ Stream content preview: "${content.substring(0, 100)}..."`,
    );
  }, 20000); // 20 second timeout

  it("should show comprehensive tool ecosystem status", async () => {
    console.log("\n📊 DEMO: Comprehensive tool ecosystem status");

    // Add various types of tools to show the ecosystem
    sdk.registerTool(
      "utilityTool",
      createTool({
        description: "General utility functions",
        execute: () => ({ status: "working", type: "utility" }),
      }),
    );

    await sdk.addInMemoryMCPServer("analytics-server", {
      server: {
        title: "Analytics Server",
        tools: {
          analyzeMetrics: {
            description: "Analyze performance metrics",
            execute: async () => ({ metrics: "analyzed", performance: "good" }),
          },
        },
      },
    });

    await sdk.addInMemoryMCPServer("reporting-server", {
      server: {
        title: "Reporting Server",
        tools: {
          generateChart: {
            description: "Generate data visualization charts",
            execute: async () => ({ chart: "generated", type: "bar" }),
          },
          createDashboard: {
            description: "Create monitoring dashboard",
            execute: async () => ({ dashboard: "created", widgets: 5 }),
          },
        },
      },
    });

    // Get comprehensive tool overview
    const allTools = await sdk.getAllAvailableTools();
    const customTools = sdk.getCustomTools();
    const inMemoryServers = sdk.getInMemoryServers();

    console.log("\n   📈 Tool Ecosystem Summary:");
    console.log(`   • Total available tools: ${allTools.length}`);
    console.log(`   • Custom tools registered: ${customTools.size}`);
    console.log(`   • In-memory MCP servers: ${inMemoryServers.size}`);

    // Group tools by server
    const toolsByServer = allTools.reduce(
      (acc, tool) => {
        const serverId = tool.serverId || "unknown";
        acc[serverId] = (acc[serverId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log("   📋 Tools by server:");
    Object.entries(toolsByServer).forEach(([serverId, count]) => {
      console.log(`     • ${serverId}: ${count} tools`);
    });

    // Test tool execution from different sources
    console.log("\n   🔧 Testing tool execution across ecosystem:");

    const utilityResult = await sdk.executeTool("utilityTool");
    expect(utilityResult.status).toBe("working");
    console.log(`   ✅ Custom tool: ${utilityResult.type}`);

    const analyticsResult = await sdk.executeTool("analyzeMetrics");
    expect(analyticsResult.performance).toBe("good");
    console.log(`   ✅ Analytics MCP: ${analyticsResult.metrics}`);

    const chartResult = await sdk.executeTool("generateChart");
    expect(chartResult.chart).toBe("generated");
    console.log(`   ✅ Reporting MCP: ${chartResult.type} chart`);

    const timeResult = await sdk.executeTool("getCurrentTime");
    expect(timeResult.success).toBe(true);
    console.log(
      `   ✅ Built-in tool: ${timeResult.data.time.substring(0, 20)}...`,
    );

    expect(allTools.length).toBeGreaterThan(20);
    expect(customTools.size).toBeGreaterThan(0);
    expect(inMemoryServers.size).toBeGreaterThan(0);
    console.log(`   ✅ Full ecosystem integration verified`);
  });
});
