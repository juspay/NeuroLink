/**
 * MCP Ecosystem - Main Export
 * Universal AI Development Platform with Extensible Plugin Architecture
 * Implementation based on research blueprint
 */
import type { McpMetadata } from "../types/mcpTypes.js";

// HTTP Transport types - exported from centralized types
export type {
  AuthorizationUrlResult,
  HTTPRetryConfig,
  MCPOAuthConfig,
  OAuthClientInformation,
  OAuthTokens,
  RateLimitConfig,
  TokenExchangeRequest,
  TokenStorage,
} from "../types/mcpTypes.js";
export { mcpLogger } from "../utils/logger.js";
// OAuth Authentication
export {
  calculateExpiresAt,
  createOAuthProviderFromConfig,
  FileTokenStorage,
  InMemoryTokenStorage,
  isTokenExpired,
  NeuroLinkOAuthProvider,
} from "./auth/index.js";
// MCP Server Factory
export {
  createMCPServer,
  getServerInfo,
  validateServerTools,
  validateTool,
} from "./factory.js";
// HTTP Rate Limiter
export {
  DEFAULT_RATE_LIMIT_CONFIG,
  globalRateLimiterManager,
  HTTPRateLimiter,
  RateLimiterManager,
} from "./httpRateLimiter.js";
// HTTP Retry Handler
export {
  DEFAULT_HTTP_RETRY_CONFIG,
  isRetryableHTTPError,
  isRetryableStatusCode,
  withHTTPRetry,
} from "./httpRetryHandler.js";
// Circuit Breaker
export {
  CircuitBreakerManager,
  globalCircuitBreakerManager,
  MCPCircuitBreaker,
} from "./mcpCircuitBreaker.js";

/**
 * Initialize the MCP ecosystem - simplified
 */
export async function initializeMCPEcosystem(): Promise<void> {
  // Simplified initialization - no complex ecosystem needed
  return Promise.resolve();
}

/**
 * List available MCPs - simplified
 */
export async function listMCPs(): Promise<McpMetadata[]> {
  return [];
}

/**
 * Execute an MCP operation - simplified
 */
export async function executeMCP<T = unknown>(
  _name: string,
  _config: unknown,
  _args: unknown,
  _context?: {
    sessionId?: string;
    userId?: string;
  },
): Promise<T> {
  throw new Error("MCP execution not available - ecosystem removed");
}

/**
 * Get MCP ecosystem statistics - simplified
 */
export async function getMCPStats(): Promise<{
  initialized: boolean;
  pluginsDiscovered: number;
  pluginsBySource: Record<string, number>;
  availablePlugins: string[];
}> {
  return {
    initialized: false,
    pluginsDiscovered: 0,
    pluginsBySource: {},
    availablePlugins: [],
  };
}
