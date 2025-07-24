/**
 * Plugin Bridge Adapter
 * Provides compatibility layer for existing MCP integrations
 */

import type { ExecutionContext } from "../contracts/mcp-contract.js";
import type { JsonValue, UnknownRecord, Unknown } from "../../types/common.js";
import * as path from "path";

/**
 * Bridge interface for legacy MCP compatibility
 */
export interface LegacyMCPBridge {
  writeFile: (filePath: string, content: string) => Promise<void>;
  readFile: (filePath: string) => Promise<string>;
  listFiles: (dirPath: string) => Promise<string[]>;
}

/**
 * Create a bridge for legacy MCP integrations
 */
export function createLegacyBridge(context: ExecutionContext): LegacyMCPBridge {
  const basePath = process.cwd();

  return {
    async writeFile(filePath: string, content: string): Promise<void> {
      const fullPath = path.resolve(basePath, filePath);
      await context.secureFS.writeFile(fullPath, content);
    },

    async readFile(filePath: string): Promise<string> {
      const fullPath = path.resolve(basePath, filePath);
      const result = await context.secureFS.readFile(fullPath, "utf-8");
      return typeof result === "string" ? result : result.toString();
    },

    async listFiles(dirPath: string): Promise<string[]> {
      const fullPath = path.resolve(basePath, dirPath);
      return await context.secureFS.readdir(fullPath);
    },
  };
}

/**
 * Enhanced execution context with bridge compatibility
 */
export function enhanceExecutionContext(
  context: ExecutionContext,
): ExecutionContext {
  return {
    ...context,
    path: {
      join: path.join,
      resolve: path.resolve,
      relative: path.relative,
      dirname: path.dirname,
      basename: path.basename,
    },
    plugin: createLegacyBridge(context),
  };
}

/**
 * Utility function to adapt legacy MCP calls
 */
export async function adaptLegacyMCPCall(
  context: ExecutionContext,
  operation: string,
  ...args: JsonValue[]
): Promise<Unknown> {
  const bridge = createLegacyBridge(context);

  switch (operation) {
    case "writeFile": {
      const filePath = typeof args[0] === "string" ? args[0] : String(args[0]);
      const content = typeof args[1] === "string" ? args[1] : String(args[1]);
      return bridge.writeFile(filePath, content);
    }
    case "readFile": {
      const readPath = typeof args[0] === "string" ? args[0] : String(args[0]);
      return bridge.readFile(readPath);
    }
    case "listFiles": {
      const listPath = typeof args[0] === "string" ? args[0] : String(args[0]);
      return bridge.listFiles(listPath);
    }
    default:
      throw new Error(`Unsupported legacy operation: ${operation}`);
  }
}

/**
 * Quick plugin factory for simple plugin creation
 */
export class QuickPluginFactory {
  static async create(name: string, config: UnknownRecord) {
    // Simple factory implementation
    return {
      name,
      config,
      initialized: true,
    };
  }
}

/**
 * Execute plugin with enhanced context
 */
export async function executePlugin(
  plugin: UnknownRecord,
  context: ExecutionContext,
  operation: string,
  ...args: JsonValue[]
): Promise<Unknown> {
  const enhancedContext = enhanceExecutionContext(context);

  if (typeof plugin.execute === "function") {
    return plugin.execute(enhancedContext, { operation, args });
  }

  // Fallback to legacy adaptation
  return adaptLegacyMCPCall(enhancedContext, operation, ...args);
}
