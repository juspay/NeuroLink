/**
 * External MCP Server Demo
 *
 * This demo shows how to connect to external MCP (Model Context Protocol) servers.
 * MCP servers extend NeuroLink with powerful external integrations like:
 * - GitHub (repository management, issues, PRs)
 * - PostgreSQL (database queries)
 * - Google Drive (file management)
 * - Slack (messaging)
 * - And 50+ more...
 */

import "dotenv/config";
import { NeuroLink } from "@juspay/neurolink";

export async function runExternalMCPDemo(): Promise<void> {
  console.log("\n🌐 External MCP Server Demo\n");
  console.log(
    "Connect to external MCP servers to extend NeuroLink's capabilities.\n",
  );

  // Initialize NeuroLink
  const neurolink = new NeuroLink({
    provider: "openai",
    model: "gpt-4o-mini",
  });

  // Demo 1: Adding a GitHub MCP server (stdio transport)
  console.log("━".repeat(50));
  console.log("🔌 Adding GitHub MCP Server");
  console.log("━".repeat(50));

  const githubToken = process.env.GITHUB_TOKEN;

  if (githubToken) {
    try {
      await neurolink.addExternalMCPServer("github", {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        transport: "stdio",
        env: {
          GITHUB_TOKEN: githubToken,
        },
      });

      console.log("✅ GitHub MCP server connected!");
      console.log("\nAvailable GitHub tools:");

      const tools = neurolink.getAvailableTools();
      const githubTools = tools.filter(
        (t) =>
          t.name.includes("github") ||
          t.name.includes("repo") ||
          t.name.includes("issue") ||
          t.name.includes("pr"),
      );

      for (const tool of githubTools.slice(0, 5)) {
        console.log(`  - ${tool.name}`);
      }
      if (githubTools.length > 5) {
        console.log(`  ... and ${githubTools.length - 5} more`);
      }

      // Example: Query GitHub
      console.log("\n📝 Example: Querying GitHub");
      try {
        const result = await neurolink.generate({
          prompt:
            "List the top 3 most popular JavaScript repositories on GitHub.",
        });
        console.log("Response:", result.text?.slice(0, 500));
      } catch (error) {
        console.log("GitHub query skipped (API error)");
      }
    } catch (error) {
      console.log("Failed to connect GitHub server:", (error as Error).message);
    }
  } else {
    console.log(
      "⚠️  GITHUB_TOKEN not set. Showing configuration example only.",
    );
    console.log(`
To use the GitHub MCP server, set your GitHub token:

export GITHUB_TOKEN=your-github-personal-access-token

Then add the server:

await neurolink.addExternalMCPServer('github', {
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  transport: 'stdio',
  env: {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN
  }
});
`);
  }

  // Demo 2: Show other popular MCP servers
  console.log("\n\n━".repeat(50));
  console.log("📚 Popular MCP Servers");
  console.log("━".repeat(50));

  const popularServers = [
    {
      name: "GitHub",
      package: "@modelcontextprotocol/server-github",
      description: "Repository management, issues, PRs, code search",
      envVars: ["GITHUB_TOKEN"],
    },
    {
      name: "PostgreSQL",
      package: "@modelcontextprotocol/server-postgres",
      description: "Database queries and schema inspection",
      envVars: ["POSTGRES_CONNECTION_STRING"],
    },
    {
      name: "Filesystem",
      package: "@modelcontextprotocol/server-filesystem",
      description: "Advanced file system operations",
      envVars: [],
    },
    {
      name: "Google Drive",
      package: "@anthropic-ai/server-google-drive",
      description: "File management in Google Drive",
      envVars: ["GOOGLE_CREDENTIALS_PATH"],
    },
    {
      name: "Slack",
      package: "@modelcontextprotocol/server-slack",
      description: "Send and read Slack messages",
      envVars: ["SLACK_BOT_TOKEN"],
    },
    {
      name: "Brave Search",
      package: "@modelcontextprotocol/server-brave-search",
      description: "Web search via Brave Search API",
      envVars: ["BRAVE_API_KEY"],
    },
  ];

  for (const server of popularServers) {
    console.log(`\n${server.name}`);
    console.log(`  Package: ${server.package}`);
    console.log(`  Description: ${server.description}`);
    if (server.envVars.length > 0) {
      console.log(`  Required: ${server.envVars.join(", ")}`);
    }
  }

  // Demo 3: MCP server lifecycle management
  console.log("\n\n━".repeat(50));
  console.log("🔄 MCP Server Lifecycle Management");
  console.log("━".repeat(50));
  console.log(`
NeuroLink manages the lifecycle of MCP servers:

// Add a server
await neurolink.addExternalMCPServer('server-name', config);

// List active servers
const servers = neurolink.listExternalMCPServers();

// Remove a server
await neurolink.removeExternalMCPServer('server-name');

// Remove all servers
await neurolink.removeAllExternalMCPServers();

// Cleanup on exit (happens automatically)
process.on('exit', () => neurolink.cleanup());
`);

  // Demo 4: Multiple servers
  console.log("\n━".repeat(50));
  console.log("🔗 Combining Multiple MCP Servers");
  console.log("━".repeat(50));
  console.log(`
You can connect multiple MCP servers simultaneously:

// Add GitHub server
await neurolink.addExternalMCPServer('github', {
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  transport: 'stdio',
  env: { GITHUB_TOKEN: '...' }
});

// Add PostgreSQL server
await neurolink.addExternalMCPServer('postgres', {
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-postgres', 'postgres://...'],
  transport: 'stdio'
});

// Add Filesystem server
await neurolink.addExternalMCPServer('filesystem', {
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path'],
  transport: 'stdio'
});

// Now the AI can use tools from ALL servers in a single conversation!
const result = await neurolink.generate({
  prompt: 'Read the config.json file, then create a GitHub issue about it'
});
`);

  // Demo 5: Error handling
  console.log("\n━".repeat(50));
  console.log("⚠️  Error Handling");
  console.log("━".repeat(50));
  console.log(`
Always handle MCP server errors gracefully:

try {
  await neurolink.addExternalMCPServer('github', config);
} catch (error) {
  // Handle connection errors - check the error message for details
  const errorMessage = (error as Error).message;
  if (errorMessage.includes('ENOENT') || errorMessage.includes('spawn')) {
    console.log('Could not start MCP server - command not found');
  } else if (errorMessage.includes('timeout')) {
    console.log('Connection timed out - server may be slow to start');
  } else if (errorMessage.includes('auth') || errorMessage.includes('401')) {
    console.log('Authentication failed - check your tokens');
  } else {
    console.log('Unexpected error:', errorMessage);
  }
}

// Check server health using listExternalMCPServers()
const servers = neurolink.listExternalMCPServers();
for (const server of servers) {
  // Available status values: 'initializing' | 'connecting' | 'connected' |
  // 'disconnected' | 'failed' | 'restarting' | 'stopping' | 'stopped'
  console.log(server.serverId, server.status, server.isHealthy ? '(healthy)' : '');
}
`);

  // Cleanup
  console.log("\n━".repeat(50));
  console.log("🧹 Cleanup");
  console.log("━".repeat(50));

  try {
    await neurolink.removeAllExternalMCPServers();
    console.log("✅ All MCP servers disconnected");
  } catch (error) {
    // Ignore cleanup errors
  }

  console.log("\n✅ External MCP Server Demo Complete!");
}

// Run if called directly
const isMain = process.argv[1]?.includes("external-mcp");
if (isMain) {
  runExternalMCPDemo().catch(console.error);
}
