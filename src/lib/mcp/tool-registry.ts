/**
 * MCP Tool Registry - Extended Registry with Tool Management
 * Updated to match industry standard camelCase interfaces
 */

import type {
  DiscoveredMcp,
  ExecutionContext,
  ToolInfo,
} from "./contracts/mcpContract.js";
import type { ToolResult } from "./factory.js";
import { MCPRegistry } from "./registry.js";
import { registryLogger } from "./logging.js";

// Use the compatible ToolResult from factory.ts
export type ToolExecutionResult = ToolResult;

/**
 * Tool execution options
 */
export interface ToolExecutionOptions {
  timeout?: number;
  retries?: number;
  context?: ExecutionContext;
  preferredSource?: string;
  fallbackEnabled?: boolean;
  validateBeforeExecution?: boolean;
  timeoutMs?: number;
}

export class MCPToolRegistry extends MCPRegistry {
  private tools: Map<string, ToolInfo> = new Map();
  private toolExecutionStats: Map<
    string,
    { count: number; totalTime: number }
  > = new Map();

  /**
   * Register a server with its tools (updated signature)
   */
  async registerServer(
    serverId: string,
    serverConfig?: unknown,
    context?: ExecutionContext,
  ): Promise<void> {
    registryLogger.info(`Registering server: ${serverId}`);

    // Convert to DiscoveredMcp format for compatibility
    const plugin: DiscoveredMcp = {
      metadata: {
        name: serverId,
        description:
          typeof serverConfig === "object" && serverConfig
            ? (serverConfig as any).description || "No description"
            : "No description",
      },
      tools:
        typeof serverConfig === "object" && serverConfig
          ? (serverConfig as any).tools
          : {},
      configuration:
        typeof serverConfig === "object" && serverConfig
          ? (serverConfig as Record<string, string | number | boolean>)
          : {},
    };

    // Call the parent register method
    this.register(plugin);

    // Extract tools from server info if available
    const tools = plugin.tools || {};
    for (const [toolName, toolDef] of Object.entries(tools)) {
      const toolId = `${serverId}.${toolName}`;
      this.tools.set(toolId, {
        name: toolName,
        description: (toolDef as any)?.description,
        inputSchema: (toolDef as any)?.inputSchema,
        outputSchema: (toolDef as any)?.outputSchema,
        serverId,
        category: (toolDef as any)?.category || "general",
      });
    }
  }

  /**
   * Execute a tool with enhanced context
   */
  async executeTool<T = unknown>(
    toolName: string,
    args?: unknown,
    context?: ExecutionContext,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      registryLogger.info(`Executing tool: ${toolName}`);

      // Create execution context if not provided
      const execContext: ExecutionContext = {
        sessionId: context?.sessionId || crypto.randomUUID(),
        userId: context?.userId,
        ...context,
      };

      // Mock execution for now
      const result = {
        result: `Mock execution of ${toolName}`,
        args,
        context: execContext,
      } as T;

      // Update statistics
      const duration = Date.now() - startTime;
      this.updateStats(toolName, duration);

      return result;
    } catch (error) {
      registryLogger.error(`Tool execution failed: ${toolName}`, error);
      throw error;
    }
  }

  /**
   * List all available tools (updated signature)
   */
  async listTools(context?: ExecutionContext): Promise<ToolInfo[]> {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool information
   */
  getToolInfo(toolName: string): ToolInfo | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Update execution statistics
   */
  private updateStats(toolName: string, executionTime: number): void {
    const stats = this.toolExecutionStats.get(toolName) || {
      count: 0,
      totalTime: 0,
    };

    stats.count += 1;
    stats.totalTime += executionTime;

    this.toolExecutionStats.set(toolName, stats);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): Record<
    string,
    { count: number; averageTime: number; totalTime: number }
  > {
    const result: Record<
      string,
      { count: number; averageTime: number; totalTime: number }
    > = {};

    for (const [toolName, stats] of this.toolExecutionStats.entries()) {
      result[toolName] = {
        count: stats.count,
        totalTime: stats.totalTime,
        averageTime: stats.totalTime / stats.count,
      };
    }

    return result;
  }

  /**
   * Clear execution statistics
   */
  clearStats(): void {
    this.toolExecutionStats.clear();
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): ToolInfo[] {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.category === category,
    );
  }

  /**
   * Check if tool exists
   */
  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Remove a tool
   */
  removeTool(toolName: string): boolean {
    const removed = this.tools.delete(toolName);
    if (removed) {
      this.toolExecutionStats.delete(toolName);
      registryLogger.info(`Removed tool: ${toolName}`);
    }
    return removed;
  }

  /**
   * Get tool count
   */
  getToolCount(): number {
    return this.tools.size;
  }

  /**
   * Get statistics (alias for getExecutionStats)
   */
  getStats(): Record<
    string,
    { count: number; averageTime: number; totalTime: number }
  > {
    return this.getExecutionStats();
  }

  /**
   * Unregister a server
   */
  unregisterServer(serverId: string): boolean {
    // Remove all tools for this server
    const removedTools: string[] = [];
    for (const [toolId, tool] of this.tools.entries()) {
      if (tool.serverId === serverId) {
        this.tools.delete(toolId);
        removedTools.push(toolId);
      }
    }

    // Remove from parent registry
    const removed = this.unregister(serverId);

    registryLogger.info(
      `Unregistered server ${serverId}, removed ${removedTools.length} tools`,
    );
    return removed;
  }
}

// Create default instance
export const toolRegistry = new MCPToolRegistry();
export const defaultToolRegistry = toolRegistry;

// Export ToolInfo for other modules
export type { ToolInfo } from "./contracts/mcpContract.js";
