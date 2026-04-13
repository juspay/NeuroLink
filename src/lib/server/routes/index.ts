/**
 * Route Builders
 * Pre-built route definitions for common NeuroLink endpoints
 */

import type { RouteDefinition, RouteGroup } from "../../types/index.js";
import { createAgentRoutes } from "./agentRoutes.js";
import { createClaudeProxyRoutes } from "./claudeProxyRoutes.js";
// ClaudeProxyDeps removed
import { createHealthRoutes } from "./healthRoutes.js";
import { createMCPRoutes } from "./mcpRoutes.js";
import { createMemoryRoutes } from "./memoryRoutes.js";
import { createOpenApiRoutes } from "./openApiRoutes.js";
import { createToolRoutes } from "./toolRoutes.js";

// Re-export route builders from individual files
export { createAgentRoutes } from "./agentRoutes.js";
export { createClaudeProxyRoutes } from "./claudeProxyRoutes.js";
// ClaudeProxyDeps removed
export { createHealthRoutes } from "./healthRoutes.js";
export { createMCPRoutes } from "./mcpRoutes.js";
export { createMemoryRoutes } from "./memoryRoutes.js";
export { createOpenApiRoutes } from "./openApiRoutes.js";
export { createToolRoutes } from "./toolRoutes.js";

/**
 * Options for creating routes
 */
type CreateRoutesOptions = {
  /** Enable OpenAPI/Swagger documentation endpoints (default: false) */
  enableSwagger?: boolean;
  /**
   * Callback to get registered routes for OpenAPI spec generation.
   * This callback is invoked at request time when the OpenAPI spec is accessed,
   * allowing it to reflect all routes registered with the adapter.
   *
   * When using `registerAllRoutes`, this is automatically bound to `adapter.listRoutes()`
   * if the adapter supports it and no custom callback is provided.
   *
   * If not provided (and adapter doesn't have listRoutes), the spec will use
   * default endpoint definitions.
   */
  getRoutes?: () => RouteDefinition[];
  /**
   * Enable or disable the Claude-compatible proxy routes.
   * When true, registers /v1/messages, /v1/models, and /v1/messages/count_tokens
   * endpoints that accept Anthropic API format requests.
   */
  claudeProxy?: boolean;
};

/**
 * Create all standard routes
 * Convenience method that combines all route groups
 */
export function createAllRoutes(
  basePath: string = "/api",
  options?: CreateRoutesOptions,
): RouteGroup[] {
  const routes: RouteGroup[] = [
    createAgentRoutes(basePath),
    createToolRoutes(basePath),
    createMCPRoutes(basePath),
    createMemoryRoutes(basePath),
    createHealthRoutes(basePath),
  ];

  // Conditionally add OpenAPI/Swagger routes
  if (options?.enableSwagger) {
    routes.push(createOpenApiRoutes(basePath, options.getRoutes));
  }

  // Conditionally add Claude-compatible proxy routes
  if (options?.claudeProxy) {
    routes.push(createClaudeProxyRoutes(undefined, basePath));
  }

  return routes;
}

/**
 * Register all routes with a server adapter
 */
export function registerAllRoutes(
  adapter: {
    registerRouteGroup: (group: RouteGroup) => void;
    listRoutes?: () => RouteDefinition[];
  },
  basePath: string = "/api",
  options?: CreateRoutesOptions,
): void {
  // If adapter has listRoutes and getRoutes not provided, use adapter's listRoutes
  const routeOptions: CreateRoutesOptions = {
    ...options,
    getRoutes: options?.getRoutes ?? adapter.listRoutes?.bind(adapter),
  };
  const routeGroups = createAllRoutes(basePath, routeOptions);
  for (const group of routeGroups) {
    adapter.registerRouteGroup(group);
  }
}
