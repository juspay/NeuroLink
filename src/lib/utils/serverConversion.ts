/**
 * Server Conversion Utilities
 * Converts between NeuroLinkMCPServer and MCPServerInfo formats
 */

import type { NeuroLinkMCPServer } from "../mcp/factory.js";
import type {
  MCPServerInfo,
  MCPServerCategory,
  NeuroLinkExecutionContext,
} from "../types/mcpTypes.js";

/**
 * Convert NeuroLinkMCPServer to MCPServerInfo format
 * Used when registering factory-created servers with the tool registry
 */
export function convertNeuroLinkServerToMCPServerInfo(
  server: NeuroLinkMCPServer,
): MCPServerInfo {
  const tools = Object.entries(server.tools).map(([toolName, tool]) => ({
    name: toolName,
    description: (tool as { description: string }).description,
    inputSchema: (tool as { inputSchema?: object }).inputSchema,
    execute: async (params: unknown, context?: unknown) => {
      const result = await (
        tool as {
          execute: (
            params: unknown,
            context: NeuroLinkExecutionContext,
          ) => Promise<unknown>;
        }
      ).execute(params, context as NeuroLinkExecutionContext);
      return result;
    },
  }));

  // Map factory MCPServerCategory to mcpTypes MCPServerCategory
  const mapCategory = (factoryCategory?: string): MCPServerCategory => {
    switch (factoryCategory) {
      case "content":
      case "data":
      case "analysis":
      case "business":
      case "development":
      case "frameworks":
      case "integrations":
      case "automation":
      case "aiProviders":
        return "built-in"; // Map specific categories to built-in
      case "custom":
        return "custom";
      default:
        return "built-in"; // Default for internal servers
    }
  };

  return {
    id: server.id,
    name: server.title, // Use title as name
    description: server.description || "",
    transport: "stdio" as const, // Default transport for internal servers
    status: "connected" as const, // Internal servers are always connected
    tools,
    metadata: {
      category: mapCategory(server.category),
      version: server.version,
      capabilities: server.capabilities,
      visibility: server.visibility,
      ...server.metadata,
    },
  };
}
