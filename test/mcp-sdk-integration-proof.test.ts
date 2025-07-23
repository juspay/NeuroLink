/**
 * COMPREHENSIVE MCP INTEGRATION PROOF TEST
 *
 * This test demonstrates and proves that the NeuroLink SDK supports:
 * 1. Extending existing tools via custom tool registration
 * 2. Adding completely new MCP servers via in-memory server registration
 * 3. Mixed tool discovery and execution (custom + MCP server tools)
 * 4. Full integration between SDK and MCP system
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NeuroLink } from "../src/lib/neurolink.js";
import {
  createTool,
  createTypedTool,
} from "../src/lib/sdk/tool-registration.js";
import { z } from "zod";
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

describe("MCP SDK Integration - Comprehensive Proof", () => {
  let sdk: NeuroLink;

  beforeEach(() => {
    sdk = new NeuroLink();
  });

  describe("PROOF 1: Extending Existing Tools", () => {
    it("should extend built-in math tools with custom enhanced calculator", async () => {
      console.log("\n🧮 PROOF 1: Extending existing math capabilities");

      // STEP 1: Register an enhanced calculator that extends basic math
      const enhancedCalculator = createTypedTool({
        description:
          "Enhanced calculator with scientific functions (extends basic math)",
        parameters: z.object({
          expression: z
            .string()
            .describe("Mathematical expression to evaluate"),
          mode: z.enum(["basic", "scientific"]).default("basic"),
        }),
        execute: ({ expression, mode }) => {
          console.log(
            `   🔍 Executing enhanced calculator: ${expression} (${mode} mode)`,
          );

          if (mode === "scientific") {
            // Extended functionality not available in built-in tools
            if (expression.includes("sqrt")) {
              const num = parseFloat(
                expression.replace("sqrt(", "").replace(")", ""),
              );
              return { result: Math.sqrt(num), enhanced: true, mode };
            }
            if (expression.includes("pow")) {
              const [base, exp] = expression
                .match(/pow\((\d+),(\d+)\)/)
                ?.slice(1)
                .map(Number) || [0, 0];
              return { result: Math.pow(base, exp), enhanced: true, mode };
            }
          }

          // Basic math evaluation with restricted mathjs configuration
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
            const parsedExpression = math.parse(expression);
            const result = parsedExpression.evaluate();
            return { result, enhanced: false, mode };
          } catch (error: any) {
            return {
              error: `Mathematical evaluation failed: ${error.message || "Invalid expression"}`,
              enhanced: false,
              mode,
            };
          }
        },
      });

      sdk.registerTool("enhancedCalculator", enhancedCalculator);

      // STEP 2: Verify tool registration
      const customTools = sdk.getCustomTools();
      expect(customTools.has("enhancedCalculator")).toBe(true);
      console.log("   ✅ Enhanced calculator registered successfully");

      // STEP 3: Execute enhanced functionality
      const scientificResult = await sdk.executeTool("enhancedCalculator", {
        expression: "sqrt(16)",
        mode: "scientific",
      });
      expect(scientificResult.result).toBe(4);
      expect(scientificResult.enhanced).toBe(true);
      console.log(
        `   ✅ Scientific calculation result: ${scientificResult.result}`,
      );

      // STEP 4: Verify it works alongside existing tools
      const allTools = await sdk.getAllAvailableTools();
      const enhancedCalcTool = allTools.find(
        (t) => t.toolName === "enhancedCalculator",
      );
      expect(enhancedCalcTool).toBeDefined();
      console.log(
        `   ✅ Tool discovered among ${allTools.length} total available tools`,
      );
    });
  });

  describe("PROOF 2: Adding Completely New MCP Tools", () => {
    it("should add a new MCP server with custom domain-specific tools", async () => {
      console.log("\n🏢 PROOF 2: Adding completely new MCP server");

      // STEP 1: Create a domain-specific MCP server (e.g., HR Management)
      const hrManagementServer = {
        server: {
          title: "HR Management Server",
          description: "Tools for human resources management",
          tools: {
            createEmployee: {
              description: "Create a new employee record",
              execute: async (params: {
                name: string;
                department: string;
                role: string;
              }) => {
                console.log(
                  `   👤 Creating employee: ${params.name} in ${params.department}`,
                );
                return {
                  success: true,
                  data: {
                    employeeId: `EMP-${Date.now()}`,
                    name: params.name,
                    department: params.department,
                    role: params.role,
                    createdAt: new Date().toISOString(),
                  },
                };
              },
            },
            calculateSalary: {
              description:
                "Calculate employee salary with bonuses and deductions",
              execute: async (params: {
                baseSalary: number;
                bonuses: number;
                deductions: number;
              }) => {
                console.log(
                  `   💰 Calculating salary: base=${params.baseSalary}, bonus=${params.bonuses}`,
                );
                const totalSalary =
                  params.baseSalary + params.bonuses - params.deductions;
                return {
                  success: true,
                  data: {
                    baseSalary: params.baseSalary,
                    bonuses: params.bonuses,
                    deductions: params.deductions,
                    totalSalary,
                    calculatedAt: new Date().toISOString(),
                  },
                };
              },
            },
            getEmployeeStats: {
              description: "Get employee statistics for the department",
              execute: async (params: { department: string }) => {
                console.log(
                  `   📊 Getting stats for department: ${params.department}`,
                );
                return {
                  success: true,
                  data: {
                    department: params.department,
                    totalEmployees: 42,
                    avgSalary: 75000,
                    openPositions: 3,
                    lastUpdated: new Date().toISOString(),
                  },
                };
              },
            },
          },
        },
        category: "hr-management",
        metadata: {
          version: "1.0.0",
          author: "NeuroLink SDK Test",
        },
      };

      // STEP 2: Add the MCP server
      await sdk.addInMemoryMCPServer(
        "hr-management-server",
        hrManagementServer,
      );
      console.log("   ✅ HR Management MCP server added");

      // STEP 3: Verify server registration
      const inMemoryServers = sdk.getInMemoryServers();
      expect(inMemoryServers.has("hr-management-server")).toBe(true);
      console.log("   ✅ MCP server registered in in-memory servers");

      // STEP 4: Execute new MCP tools
      const employeeResult = await sdk.executeTool("createEmployee", {
        name: "John Doe",
        department: "Engineering",
        role: "Senior Developer",
      });
      expect(employeeResult.name).toBe("John Doe");
      expect(employeeResult.department).toBe("Engineering");
      console.log(`   ✅ Employee created: ${employeeResult.employeeId}`);

      const salaryResult = await sdk.executeTool("calculateSalary", {
        baseSalary: 80000,
        bonuses: 10000,
        deductions: 5000,
      });
      expect(salaryResult.totalSalary).toBe(85000);
      expect(salaryResult.baseSalary).toBe(80000);
      console.log(`   ✅ Salary calculated: $${salaryResult.totalSalary}`);

      // STEP 5: Verify tool discovery
      const allTools = await sdk.getAllAvailableTools();
      const hrTools = allTools.filter((t) =>
        ["createEmployee", "calculateSalary", "getEmployeeStats"].includes(
          t.toolName,
        ),
      );
      expect(hrTools.length).toBe(3);
      console.log(`   ✅ All 3 HR tools discovered in tool registry`);
    });
  });

  describe("PROOF 3: Mixed Tool Ecosystem", () => {
    it("should demonstrate seamless integration of custom tools + MCP servers + built-in tools", async () => {
      console.log("\n🔄 PROOF 3: Mixed tool ecosystem integration");

      // STEP 1: Add custom tools (extending functionality)
      const customStringTool = createTool({
        description: "Advanced string processing tool",
        execute: (params: { text: string; operation: string }) => {
          console.log(
            `   🔤 String processing: ${params.operation} on "${params.text}"`,
          );
          switch (params.operation) {
            case "reverse":
              return params.text.split("").reverse().join("");
            case "uppercase":
              return params.text.toUpperCase();
            case "wordcount":
              return params.text.split(" ").length;
            default:
              return params.text;
          }
        },
      });

      sdk.registerTool("advancedStringProcessor", customStringTool);

      // STEP 2: Add specialized MCP server
      await sdk.addInMemoryMCPServer("data-analytics-server", {
        server: {
          title: "Data Analytics Server",
          tools: {
            analyzeDataset: {
              description: "Analyze dataset and provide insights",
              execute: async (params: { data: number[] }) => {
                console.log(
                  `   📈 Analyzing dataset of ${params.data.length} points`,
                );
                const sum = params.data.reduce((a, b) => a + b, 0);
                const avg = sum / params.data.length;
                const max = Math.max(...params.data);
                const min = Math.min(...params.data);

                return {
                  success: true,
                  data: {
                    count: params.data.length,
                    sum,
                    average: avg,
                    maximum: max,
                    minimum: min,
                    range: max - min,
                  },
                };
              },
            },
          },
        },
      });

      // STEP 3: Execute tools from different sources
      console.log("\n   🎯 Testing tool execution from different sources:");

      // Custom tool execution
      const stringResult = await sdk.executeTool("advancedStringProcessor", {
        text: "Hello NeuroLink SDK",
        operation: "reverse",
      });
      expect(stringResult).toBe("KDS kniLorueN olleH");
      console.log(`   ✅ Custom tool result: "${stringResult}"`);

      // MCP server tool execution
      const analyticsResult = await sdk.executeTool("analyzeDataset", {
        data: [10, 20, 30, 40, 50],
      });
      expect(analyticsResult.average).toBe(30);
      expect(analyticsResult.maximum).toBe(50);
      console.log(
        `   ✅ MCP tool result: avg=${analyticsResult.average}, range=${analyticsResult.range}`,
      );

      // Built-in tool execution (should work with existing tools)
      const timeResult = await sdk.executeTool("getCurrentTime");
      expect(timeResult.success).toBe(true);
      console.log(`   ✅ Built-in tool result: ${timeResult.data.time}`);

      // STEP 4: Verify comprehensive tool discovery
      const allTools = await sdk.getAllAvailableTools();

      const customToolsCount = allTools.filter((t) =>
        t.serverId?.includes("custom-tool"),
      ).length;
      const mcpToolsCount = allTools.filter(
        (t) => t.serverId === "data-analytics-server",
      ).length;
      const builtinToolsCount = allTools.filter(
        (t) => t.serverId === "neurolink-direct",
      ).length;

      console.log(`\n   📊 Tool ecosystem summary:`);
      console.log(`   • Custom tools: ${customToolsCount}`);
      console.log(`   • MCP server tools: ${mcpToolsCount}`);
      console.log(`   • Built-in tools: ${builtinToolsCount}`);
      console.log(`   • Total available: ${allTools.length}`);

      expect(customToolsCount).toBeGreaterThan(0);
      expect(mcpToolsCount).toBeGreaterThan(0);
      expect(builtinToolsCount).toBeGreaterThan(0);
      console.log(`   ✅ All tool types successfully integrated`);
    });
  });

  describe("PROOF 4: Advanced MCP Integration Scenarios", () => {
    it("should handle complex MCP server with inter-tool dependencies", async () => {
      console.log(
        "\n🔗 PROOF 4: Advanced MCP integration with tool dependencies",
      );

      // STEP 1: Create a complex MCP server with interdependent tools
      await sdk.addInMemoryMCPServer("workflow-automation-server", {
        server: {
          title: "Workflow Automation Server",
          tools: {
            createWorkflow: {
              description: "Create a new workflow with steps",
              execute: async (params: { name: string; steps: string[] }) => {
                console.log(
                  `   📋 Creating workflow: ${params.name} with ${params.steps.length} steps`,
                );
                return {
                  success: true,
                  data: {
                    workflowId: `WF-${Date.now()}`,
                    name: params.name,
                    steps: params.steps,
                    status: "created",
                    createdAt: new Date().toISOString(),
                  },
                };
              },
            },
            executeWorkflowStep: {
              description: "Execute a specific step in a workflow",
              execute: async (params: {
                workflowId: string;
                stepIndex: number;
              }) => {
                console.log(
                  `   ⚡ Executing step ${params.stepIndex} of workflow ${params.workflowId}`,
                );
                return {
                  success: true,
                  data: {
                    workflowId: params.workflowId,
                    stepIndex: params.stepIndex,
                    status: "completed",
                    result: `Step ${params.stepIndex} executed successfully`,
                    executedAt: new Date().toISOString(),
                  },
                };
              },
            },
            getWorkflowStatus: {
              description: "Get the current status of a workflow",
              execute: async (params: { workflowId: string }) => {
                console.log(
                  `   📊 Getting status for workflow ${params.workflowId}`,
                );
                return {
                  success: true,
                  data: {
                    workflowId: params.workflowId,
                    currentStep: 2,
                    totalSteps: 5,
                    status: "in-progress",
                    progress: 40,
                    lastUpdated: new Date().toISOString(),
                  },
                };
              },
            },
          },
        },
      });

      // STEP 2: Execute workflow creation
      const workflowResult = await sdk.executeTool("createWorkflow", {
        name: "Data Processing Pipeline",
        steps: ["extract", "transform", "validate", "load", "verify"],
      });

      expect(workflowResult.name).toBe("Data Processing Pipeline");
      const workflowId = workflowResult.workflowId;
      console.log(`   ✅ Workflow created: ${workflowId}`);

      // STEP 3: Execute dependent tool operations
      const stepResult = await sdk.executeTool("executeWorkflowStep", {
        workflowId,
        stepIndex: 1,
      });
      expect(stepResult.status).toBe("completed");
      console.log(`   ✅ Workflow step executed: ${stepResult.result}`);

      const statusResult = await sdk.executeTool("getWorkflowStatus", {
        workflowId,
      });
      expect(statusResult.status).toBe("in-progress");
      expect(statusResult.progress).toBe(40);
      console.log(`   ✅ Workflow status: ${statusResult.progress}% complete`);

      // STEP 4: Verify all tools are discoverable and executable
      const allTools = await sdk.getAllAvailableTools();
      const workflowTools = allTools.filter(
        (t) => t.serverId === "workflow-automation-server",
      );

      expect(workflowTools.length).toBe(3);
      console.log(
        `   ✅ All ${workflowTools.length} workflow tools integrated successfully`,
      );
    });
  });

  describe("PROOF 5: SDK-AI Integration with Custom Tools", () => {
    it("should demonstrate AI can discover and use both custom and MCP tools", async () => {
      console.log("\n🤖 PROOF 5: AI integration with custom/MCP tools");

      // STEP 1: Add a utility tool that AI might want to use
      const textAnalyzer = createTypedTool({
        description: "Analyze text for sentiment, readability, and key metrics",
        parameters: z.object({
          text: z.string().describe("Text to analyze"),
          analysisType: z
            .enum(["sentiment", "readability", "keywords"])
            .describe("Type of analysis to perform"),
        }),
        execute: ({ text, analysisType }) => {
          console.log(
            `   🔍 Analyzing text (${analysisType}): "${text.substring(0, 50)}..."`,
          );

          switch (analysisType) {
            case "sentiment": {
              const positiveWords = [
                "good",
                "great",
                "excellent",
                "amazing",
                "wonderful",
              ];
              const negativeWords = [
                "bad",
                "terrible",
                "awful",
                "horrible",
                "poor",
              ];
              const words = text.toLowerCase().split(" ");
              const positive = words.filter((w) =>
                positiveWords.includes(w),
              ).length;
              const negative = words.filter((w) =>
                negativeWords.includes(w),
              ).length;
              return {
                sentiment:
                  positive > negative
                    ? "positive"
                    : negative > positive
                      ? "negative"
                      : "neutral",
                score: positive - negative,
                confidence: Math.min(
                  (Math.abs(positive - negative) / words.length) * 10,
                  1,
                ),
              };
            }

            case "readability": {
              const sentences = text.split(/[.!?]+/).length;
              const words_count = text.split(" ").length;
              const avgWordsPerSentence = words_count / sentences;
              return {
                wordCount: words_count,
                sentenceCount: sentences,
                avgWordsPerSentence: avgWordsPerSentence,
                readabilityScore:
                  avgWordsPerSentence < 15
                    ? "easy"
                    : avgWordsPerSentence < 25
                      ? "moderate"
                      : "difficult",
              };
            }

            case "keywords": {
              const wordFreq: Record<string, number> = {};
              const meaningful_words = text
                .toLowerCase()
                .replace(/[^\w\s]/g, "")
                .split(" ")
                .filter(
                  (w) =>
                    w.length > 3 &&
                    ![
                      "the",
                      "and",
                      "for",
                      "are",
                      "but",
                      "not",
                      "you",
                      "all",
                      "can",
                      "had",
                      "her",
                      "was",
                      "one",
                      "our",
                      "out",
                      "day",
                      "get",
                      "has",
                      "him",
                      "his",
                      "how",
                      "its",
                      "new",
                      "now",
                      "old",
                      "see",
                      "two",
                      "who",
                      "boy",
                      "did",
                      "may",
                      "she",
                      "use",
                      "way",
                      "will",
                      "with",
                    ].includes(w),
                );

              meaningful_words.forEach((word) => {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
              });

              return {
                topKeywords: Object.entries(wordFreq)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([word, freq]) => ({ word, frequency: freq })),
                totalUniqueWords: Object.keys(wordFreq).length,
              };
            }

            default:
              return { error: "Unknown analysis type" };
          }
        },
      });

      sdk.registerTool("textAnalyzer", textAnalyzer);

      // STEP 2: Add content generation MCP server
      await sdk.addInMemoryMCPServer("content-generation-server", {
        server: {
          title: "Content Generation Server",
          tools: {
            generateSampleText: {
              description: "Generate sample text for testing purposes",
              execute: async (params: {
                topic: string;
                length: "short" | "medium" | "long";
              }) => {
                console.log(
                  `   📝 Generating ${params.length} sample text about: ${params.topic}`,
                );

                const samples = {
                  short: `This is a brief overview of ${params.topic}. It covers the basic concepts and provides essential information.`,
                  medium: `This is a comprehensive introduction to ${params.topic}. It covers fundamental concepts, practical applications, and key considerations. The content is designed to be informative and accessible to readers with varying levels of expertise. Understanding ${params.topic} is essential for modern applications.`,
                  long: `This is an extensive exploration of ${params.topic}. It begins with foundational concepts and gradually builds to more advanced topics. The content includes detailed explanations, practical examples, and real-world applications. Throughout this discussion, we examine various perspectives and methodologies related to ${params.topic}. The information presented here is valuable for both beginners and experienced practitioners. By the end of this comprehensive overview, readers will have a thorough understanding of ${params.topic} and its implications for various fields and industries.`,
                };

                return {
                  success: true,
                  data: {
                    text: samples[params.length],
                    topic: params.topic,
                    length: params.length,
                    wordCount: samples[params.length].split(" ").length,
                    generatedAt: new Date().toISOString(),
                  },
                };
              },
            },
          },
        },
      });

      // STEP 3: Test tool discovery and execution
      const allTools = await sdk.getAllAvailableTools();
      console.log(`   📊 Total tools available to AI: ${allTools.length}`);

      // Find our custom and MCP tools
      const textAnalyzerTool = allTools.find(
        (t) => t.toolName === "textAnalyzer",
      );
      const contentGenTool = allTools.find(
        (t) => t.toolName === "generateSampleText",
      );

      expect(textAnalyzerTool).toBeDefined();
      expect(contentGenTool).toBeDefined();
      console.log(`   ✅ AI can discover both custom and MCP tools`);

      // STEP 4: Simulate AI workflow using tools
      console.log(`\n   🤖 Simulating AI workflow:`);

      // AI generates content using MCP tool
      const generatedContent = await sdk.executeTool("generateSampleText", {
        topic: "machine learning",
        length: "medium",
      });
      expect(generatedContent.topic).toBe("machine learning");
      expect(generatedContent.wordCount).toBeGreaterThan(0);
      console.log(
        `   ✅ AI generated content: ${generatedContent.wordCount} words`,
      );

      // AI analyzes the generated content using custom tool
      const sentimentAnalysis = await sdk.executeTool("textAnalyzer", {
        text: generatedContent.text,
        analysisType: "sentiment",
      });
      console.log(
        `   ✅ AI analyzed sentiment: ${sentimentAnalysis.sentiment} (score: ${sentimentAnalysis.score})`,
      );

      const readabilityAnalysis = await sdk.executeTool("textAnalyzer", {
        text: generatedContent.text,
        analysisType: "readability",
      });
      console.log(
        `   ✅ AI analyzed readability: ${readabilityAnalysis.readabilityScore} (${readabilityAnalysis.avgWordsPerSentence} words/sentence)`,
      );

      // STEP 5: Verify complete integration
      expect(sentimentAnalysis.sentiment).toMatch(/positive|negative|neutral/);
      expect(readabilityAnalysis.readabilityScore).toMatch(
        /easy|moderate|difficult/,
      );
      console.log(`   ✅ Complete AI-SDK-MCP integration working seamlessly`);
    });
  });
});
