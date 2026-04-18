/**
 * Route Builders
 * Pre-built route definitions for common NeuroLink endpoints
 */

import type {
  CreateRoutesOptions,
  RouteDefinition,
  RouteGroup,
} from "../../types/index.js";
import { createAgentRoutes } from "./agentRoutes.js";
import { createClaudeProxyRoutes } from "./claudeProxyRoutes.js";
// ClaudeProxyDeps removed
import { createHealthRoutes } from "./healthRoutes.js";
import { createOpenAIProxyRoutes } from "./openaiProxyRoutes.js";
import { createMCPRoutes } from "./mcpRoutes.js";
import { createMemoryRoutes } from "./memoryRoutes.js";
import { createOpenApiRoutes } from "./openApiRoutes.js";
import { createToolRoutes } from "./toolRoutes.js";

// Re-export route builders from individual files
export { createAgentRoutes } from "./agentRoutes.js";
export { createClaudeProxyRoutes } from "./claudeProxyRoutes.js";
// ClaudeProxyDeps removed
export { createHealthRoutes } from "./healthRoutes.js";
export { createOpenAIProxyRoutes } from "./openaiProxyRoutes.js";
export { createMCPRoutes } from "./mcpRoutes.js";
export { createMemoryRoutes } from "./memoryRoutes.js";
export { createOpenApiRoutes } from "./openApiRoutes.js";
export { createToolRoutes } from "./toolRoutes.js";

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

  // Unified proxy flag enables both Claude and OpenAI endpoints.
  // Legacy per-format flags are still supported for backward compatibility.
  const enableClaudeProxy = options?.proxy || options?.claudeProxy;
  const enableOpenAIProxy = options?.proxy || options?.openaiProxy;

  if (enableClaudeProxy) {
    routes.push(createClaudeProxyRoutes(undefined, basePath));
  }

  if (enableOpenAIProxy) {
    routes.push(createOpenAIProxyRoutes(undefined, basePath));
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
