/**
 * Built-in Tools Demo
 *
 * This demo showcases NeuroLink's built-in tools:
 * - getCurrentTime: Get current date/time
 * - readFile: Read file contents
 * - writeFile: Write content to files
 * - listDirectory: List directory contents
 * - calculateMath: Perform mathematical calculations
 * - websearchGrounding: Search the web for information
 */

import "dotenv/config";
import { NeuroLink } from "@juspay/neurolink";

export async function runBuiltInToolsDemo(): Promise<void> {
  console.log("\n📦 Built-in Tools Demo\n");
  console.log(
    "NeuroLink provides several built-in tools that are always available.",
  );
  console.log(
    "These tools give the AI model capabilities to interact with the system.\n",
  );

  // Initialize NeuroLink with built-in tools enabled
  const neurolink = new NeuroLink({
    provider: "openai",
    model: "gpt-4o-mini",
    enableBuiltInTools: true, // Enable all built-in tools
  });

  // List all available built-in tools
  console.log("━".repeat(50));
  console.log("📋 Available Built-in Tools:");
  console.log("━".repeat(50));

  const tools = neurolink.getAvailableTools();
  const builtInTools = [
    "getCurrentTime",
    "readFile",
    "writeFile",
    "listDirectory",
    "calculateMath",
    "websearchGrounding",
  ];

  for (const toolName of builtInTools) {
    const tool = tools.find((t) => t.name === toolName);
    if (tool) {
      console.log(`\n  ${toolName}`);
      console.log(`    Description: ${tool.description}`);
    }
  }

  // Demo 1: getCurrentTime
  console.log("\n\n━".repeat(50));
  console.log("🕐 Demo: getCurrentTime");
  console.log("━".repeat(50));

  try {
    const timeResult = await neurolink.generate({
      prompt:
        "What is the current date and time? Please tell me in a friendly way.",
      enableBuiltInTools: true,
    });
    console.log("\nPrompt: What is the current date and time?");
    console.log("Response:", timeResult.text);
    if (timeResult.toolExecutions && timeResult.toolExecutions.length > 0) {
      console.log("\nTool Executions:");
      for (const exec of timeResult.toolExecutions) {
        console.log(`  - ${exec.toolName}: ${JSON.stringify(exec.result)}`);
      }
    }
  } catch (error) {
    console.log("Time demo skipped (API key not configured)");
  }

  // Demo 2: calculateMath
  console.log("\n\n━".repeat(50));
  console.log("🔢 Demo: calculateMath");
  console.log("━".repeat(50));

  try {
    const mathResult = await neurolink.generate({
      prompt:
        "Calculate the following: (15 * 7) + (sqrt(144) / 2) - 3^2. Show your work.",
      enableBuiltInTools: true,
    });
    console.log("\nPrompt: Calculate (15 * 7) + (sqrt(144) / 2) - 3^2");
    console.log("Response:", mathResult.text);
    if (mathResult.toolExecutions && mathResult.toolExecutions.length > 0) {
      console.log("\nTool Executions:");
      for (const exec of mathResult.toolExecutions) {
        console.log(`  - ${exec.toolName}: ${JSON.stringify(exec.result)}`);
      }
    }
  } catch (error) {
    console.log("Math demo skipped (API key not configured)");
  }

  // Demo 3: listDirectory
  console.log("\n\n━".repeat(50));
  console.log("📁 Demo: listDirectory");
  console.log("━".repeat(50));

  try {
    const dirResult = await neurolink.generate({
      prompt:
        "List the files in the current directory and tell me what types of files you see.",
      enableBuiltInTools: true,
    });
    console.log("\nPrompt: List the files in the current directory");
    console.log("Response:", dirResult.text);
    if (dirResult.toolExecutions && dirResult.toolExecutions.length > 0) {
      console.log("\nTool Executions:");
      for (const exec of dirResult.toolExecutions) {
        console.log(`  - ${exec.toolName}`);
      }
    }
  } catch (error) {
    console.log("Directory listing demo skipped (API key not configured)");
  }

  // Show how to selectively enable tools
  console.log("\n\n━".repeat(50));
  console.log("⚙️  Selective Tool Enabling");
  console.log("━".repeat(50));
  console.log(`
You can selectively enable specific built-in tools:

const neurolink = new NeuroLink({
  provider: 'openai',
  enableBuiltInTools: ['getCurrentTime', 'calculateMath']  // Only these tools
});

// Or enable all tools
const neurolink = new NeuroLink({
  provider: 'openai',
  enableBuiltInTools: true  // All built-in tools
});

// Or enable per-request
await neurolink.generate({
  prompt: 'Your prompt',
  enableBuiltInTools: ['readFile', 'writeFile']
});
`);

  console.log("\n✅ Built-in Tools Demo Complete!");
}

// Run if called directly
const isMain = process.argv[1]?.includes("built-in-tools");
if (isMain) {
  runBuiltInToolsDemo().catch(console.error);
}
