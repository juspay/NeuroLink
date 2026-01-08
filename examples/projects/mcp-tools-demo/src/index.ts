/**
 * NeuroLink MCP Tools Demo
 *
 * This demo showcases various MCP (Model Context Protocol) tool integration patterns:
 * - Built-in tools usage
 * - Custom tool creation
 * - External MCP servers
 * - HTTP transport configuration
 */

import "dotenv/config";

console.log(`
╔══════════════════════════════════════════════════════════════╗
║           NeuroLink MCP Tools Demo                           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Available demos:                                            ║
║                                                              ║
║  npm run demo:built-in   - Built-in tools demo               ║
║  npm run demo:custom     - Custom tools demo                 ║
║  npm run demo:external   - External MCP server demo          ║
║  npm run demo:http       - HTTP transport demo               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

// Run all demos sequentially
async function runAllDemos(): Promise<void> {
  console.log("\n🚀 Running all MCP tools demos...\n");

  try {
    // Import and run each demo
    console.log("━".repeat(60));
    console.log("📦 Demo 1: Built-in Tools");
    console.log("━".repeat(60));
    const { runBuiltInToolsDemo } = await import("./demo/built-in-tools.js");
    await runBuiltInToolsDemo();

    console.log("\n" + "━".repeat(60));
    console.log("🔧 Demo 2: Custom Tools");
    console.log("━".repeat(60));
    const { runCustomToolsDemo } = await import("./demo/custom-tools.js");
    await runCustomToolsDemo();

    console.log("\n" + "━".repeat(60));
    console.log("🌐 Demo 3: External MCP Servers");
    console.log("━".repeat(60));
    const { runExternalMCPDemo } = await import("./demo/external-mcp.js");
    await runExternalMCPDemo();

    console.log("\n" + "━".repeat(60));
    console.log("🔌 Demo 4: HTTP Transport");
    console.log("━".repeat(60));
    const { runHTTPTransportDemo } = await import("./demo/http-transport.js");
    await runHTTPTransportDemo();

    console.log("\n✅ All demos completed successfully!");
  } catch (error) {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  }
}

// Check if running as main module
const isMain = process.argv[1]?.includes("index");
if (isMain) {
  runAllDemos();
}

export { runAllDemos };
