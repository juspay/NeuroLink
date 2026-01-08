/**
 * Custom Tools Demo
 *
 * This demo shows how to create and register custom tools with NeuroLink.
 * Custom tools extend the AI model's capabilities with your own functions.
 */

import "dotenv/config";
import { NeuroLink } from "@juspay/neurolink";
import {
  weatherTool,
  stockPriceTool,
  unitConverterTool,
  textAnalysisTool,
  allCustomTools,
} from "../tools/custom-tool.js";

export async function runCustomToolsDemo(): Promise<void> {
  console.log("\n🔧 Custom Tools Demo\n");
  console.log(
    "Learn how to create and register your own tools with NeuroLink.\n",
  );

  // Initialize NeuroLink
  const neurolink = new NeuroLink({
    provider: "openai",
    model: "gpt-4o-mini",
  });

  // Demo 1: Register a single custom tool
  console.log("━".repeat(50));
  console.log("📝 Registering Custom Tools");
  console.log("━".repeat(50));

  // Register individual tools
  neurolink.addTool(weatherTool);
  console.log(`✅ Registered: ${weatherTool.name}`);

  neurolink.addTool(stockPriceTool);
  console.log(`✅ Registered: ${stockPriceTool.name}`);

  neurolink.addTool(unitConverterTool);
  console.log(`✅ Registered: ${unitConverterTool.name}`);

  neurolink.addTool(textAnalysisTool);
  console.log(`✅ Registered: ${textAnalysisTool.name}`);

  // List all registered tools
  console.log("\n📋 All Registered Tools:");
  const tools = neurolink.getAvailableTools();
  for (const tool of tools) {
    console.log(`  - ${tool.name}: ${tool.description?.slice(0, 60)}...`);
  }

  // Demo 2: Using the weather tool
  console.log("\n\n━".repeat(50));
  console.log("🌤️  Demo: Weather Tool");
  console.log("━".repeat(50));

  try {
    const weatherResult = await neurolink.generate({
      prompt:
        "What's the weather like in Tokyo and London right now? Compare them.",
    });
    console.log("\nPrompt: What's the weather in Tokyo and London?");
    console.log("Response:", weatherResult.text);
    if (
      weatherResult.toolExecutions &&
      weatherResult.toolExecutions.length > 0
    ) {
      console.log("\nTool Executions:");
      for (const exec of weatherResult.toolExecutions) {
        console.log(
          `  - ${exec.toolName}:`,
          JSON.stringify(exec.result, null, 2),
        );
      }
    }
  } catch (error) {
    console.log("Weather demo skipped (API key not configured)");
  }

  // Demo 3: Using the stock price tool
  console.log("\n\n━".repeat(50));
  console.log("📈 Demo: Stock Price Tool");
  console.log("━".repeat(50));

  try {
    const stockResult = await neurolink.generate({
      prompt:
        "What are the current prices for AAPL and NVDA? Which one has had better performance today?",
    });
    console.log("\nPrompt: What are the prices for AAPL and NVDA?");
    console.log("Response:", stockResult.text);
    if (stockResult.toolExecutions && stockResult.toolExecutions.length > 0) {
      console.log("\nTool Executions:");
      for (const exec of stockResult.toolExecutions) {
        console.log(
          `  - ${exec.toolName}:`,
          JSON.stringify(exec.result, null, 2),
        );
      }
    }
  } catch (error) {
    console.log("Stock demo skipped (API key not configured)");
  }

  // Demo 4: Using the unit converter tool
  console.log("\n\n━".repeat(50));
  console.log("🔄 Demo: Unit Converter Tool");
  console.log("━".repeat(50));

  try {
    const unitResult = await neurolink.generate({
      prompt:
        "I'm traveling from the US to Europe. Convert 100 miles to kilometers and 68 degrees Fahrenheit to Celsius.",
    });
    console.log("\nPrompt: Convert 100 miles to km and 68F to C");
    console.log("Response:", unitResult.text);
    if (unitResult.toolExecutions && unitResult.toolExecutions.length > 0) {
      console.log("\nTool Executions:");
      for (const exec of unitResult.toolExecutions) {
        console.log(
          `  - ${exec.toolName}:`,
          JSON.stringify(exec.result, null, 2),
        );
      }
    }
  } catch (error) {
    console.log("Unit converter demo skipped (API key not configured)");
  }

  // Demo 5: Using the text analysis tool
  console.log("\n\n━".repeat(50));
  console.log("📊 Demo: Text Analysis Tool");
  console.log("━".repeat(50));

  try {
    const sampleText = `
      NeuroLink is an enterprise AI development platform that provides unified access
      to multiple AI providers through a single consistent API. It ships as both a
      TypeScript SDK and a professional CLI. NeuroLink supports multimodal content
      including text, images, PDFs, and CSV files.
    `;

    const textResult = await neurolink.generate({
      prompt: `Analyze this text and give me statistics about it: "${sampleText.trim()}"`,
    });
    console.log("\nPrompt: Analyze the provided text");
    console.log("Response:", textResult.text);
    if (textResult.toolExecutions && textResult.toolExecutions.length > 0) {
      console.log("\nTool Executions:");
      for (const exec of textResult.toolExecutions) {
        console.log(
          `  - ${exec.toolName}:`,
          JSON.stringify(exec.result, null, 2),
        );
      }
    }
  } catch (error) {
    console.log("Text analysis demo skipped (API key not configured)");
  }

  // Show tool definition patterns
  console.log("\n\n━".repeat(50));
  console.log("📖 Custom Tool Definition Pattern");
  console.log("━".repeat(50));
  console.log(`
A custom tool follows this structure:

const myTool = {
  name: 'toolName',                    // Unique tool identifier
  description: 'What the tool does',   // Clear description for the AI
  parameters: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description'
      },
      param2: {
        type: 'number',
        description: 'Another parameter'
      }
    },
    required: ['param1']               // Required parameters
  },
  execute: async ({ param1, param2 }) => {
    // Your tool logic here
    return { result: 'data' };
  }
};

// Register with NeuroLink
neurolink.addTool(myTool);

// Or register multiple tools at once
neurolink.addTools([tool1, tool2, tool3]);
`);

  // Demo: Registering multiple tools at once
  console.log("\n━".repeat(50));
  console.log("📦 Bulk Tool Registration");
  console.log("━".repeat(50));

  const neurolink2 = new NeuroLink({
    provider: "openai",
    model: "gpt-4o-mini",
  });

  // Register all tools at once
  neurolink2.addTools(allCustomTools);
  console.log(`✅ Registered ${allCustomTools.length} tools in bulk`);

  console.log("\n✅ Custom Tools Demo Complete!");
}

// Run if called directly
const isMain = process.argv[1]?.includes("custom-tools");
if (isMain) {
  runCustomToolsDemo().catch(console.error);
}
