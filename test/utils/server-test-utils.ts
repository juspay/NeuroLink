/**
 * Shared Test Utilities for Server Adapters
 * Provides helper functions for consistent, maintainable tests
 */

import { vi } from "vitest";
import type { NeuroLink } from "../../src/lib/neurolink.js";
import type {
  ServerAdapterConfig,
  ServerContext,
  RouteDefinition,
  ServerFramework,
  ServerStatus,
} from "../../src/lib/server/types.js";

// ============================================
// Type Definitions
// ============================================

/**
 * Test NeuroLink configuration
 */
export type TestNeuroLinkConfig = {
  /** Default provider to use (default: "openai") */
  defaultProvider?: string;

  /** Mock the generate method */
  mockGenerate?: boolean;

  /** Mock the stream method */
  mockStream?: boolean;

  /** Mock tools availability */
  mockTools?: boolean;

  /** Custom mock response for generate */
  generateResponse?: {
    content: string;
    provider: string;
    model: string;
    usage?: { input: number; output: number; total: number };
  };

  /** Custom mock tools list */
  toolsList?: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>;
};

/**
 * Test server configuration
 */
export type TestServerConfig = {
  /** Framework to use (default: "hono") */
  framework?: ServerFramework;

  /** Server port (default: 0 for random available port) */
  port?: number;

  /** Server host (default: "127.0.0.1") */
  host?: string;

  /** Base path for routes */
  basePath?: string;

  /** Additional server configuration */
  config?: Partial<ServerAdapterConfig>;

  /** Skip initialization (default: false) */
  skipInitialize?: boolean;
};

/**
 * Test request options
 */
export type TestRequestOptions = {
  /** HTTP method (default: "GET") */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

  /** Request path */
  path: string;

  /** Request body (will be JSON stringified) */
  body?: unknown;

  /** Request headers */
  headers?: Record<string, string>;

  /** Request timeout in ms (default: 5000) */
  timeout?: number;
};

/**
 * Test response structure
 */
export type TestResponse = {
  /** HTTP status code */
  status: number;

  /** Response body (parsed) */
  body: unknown;

  /** Response headers */
  headers: Record<string, string>;

  /** Raw response text */
  text: string;
};

/**
 * Server adapter interface for testing
 * Matches the actual adapter interface
 */
export type TestServerAdapter = {
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): ServerStatus;
  getConfig(): ServerAdapterConfig;
  registerRoute(route: RouteDefinition): void;
  listRoutes(): RouteDefinition[];
  on(event: string, handler: (...args: unknown[]) => void): void;
  getFrameworkInstance(): unknown;
};

// ============================================
// Mock NeuroLink Creation
// ============================================

/**
 * Create a test NeuroLink instance with sensible defaults.
 *
 * @param config - Optional test configuration
 * @returns Configured mock NeuroLink instance for testing
 *
 * @example
 * ```typescript
 * // Basic usage
 * const neurolink = createTestNeuroLink();
 *
 * // With mocked generation
 * const neurolink = createTestNeuroLink({ mockGenerate: true });
 *
 * // With custom response
 * const neurolink = createTestNeuroLink({
 *   mockGenerate: true,
 *   generateResponse: { content: "Custom response", provider: "openai", model: "gpt-4" }
 * });
 * ```
 */
export function createTestNeuroLink(config?: TestNeuroLinkConfig): NeuroLink {
  const defaultGenerateResponse = {
    content: "Mocked response",
    provider: config?.defaultProvider ?? "openai",
    model: "gpt-4",
    usage: { input: 10, output: 20, total: 30 },
  };

  const defaultToolsList = [
    {
      name: "testTool",
      description: "A test tool for testing",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "calculateMath",
      description: "Calculate math expressions",
      inputSchema: {
        type: "object",
        properties: { expression: { type: "string" } },
      },
    },
    {
      name: "getCurrentTime",
      description: "Get the current time",
      inputSchema: { type: "object", properties: {} },
    },
  ];

  // Mock tool registry
  const mockToolRegistry = {
    listTools: vi.fn().mockResolvedValue(config?.toolsList ?? defaultToolsList),
    executeTool: vi.fn().mockResolvedValue({ result: "success" }),
    getTool: vi.fn().mockImplementation((name: string) => {
      const tools = config?.toolsList ?? defaultToolsList;
      return tools.find((t) => t.name === name);
    }),
  };

  // Mock external server manager
  const mockExternalServerManager = {
    getServerStatuses: vi.fn().mockReturnValue([]),
    getServer: vi.fn().mockReturnValue(null),
    listServers: vi.fn().mockReturnValue([]),
  };

  // Create mock NeuroLink
  const mockNeuroLink = {
    getToolRegistry: vi.fn().mockReturnValue(mockToolRegistry),
    getExternalServerManager: vi
      .fn()
      .mockReturnValue(mockExternalServerManager),
    getConversationMemory: vi.fn().mockReturnValue(null),
    getAvailableTools: vi
      .fn()
      .mockReturnValue(config?.toolsList ?? defaultToolsList),
    generate: vi.fn(),
    stream: vi.fn(),
  };

  // Apply generate mock if requested
  if (config?.mockGenerate !== false) {
    mockNeuroLink.generate.mockResolvedValue(
      config?.generateResponse ?? defaultGenerateResponse,
    );
  }

  // Apply stream mock if requested
  if (config?.mockStream !== false) {
    mockNeuroLink.stream.mockResolvedValue({
      stream: (async function* () {
        yield { text: "chunk1" };
        yield { text: "chunk2" };
        yield { text: "chunk3" };
      })(),
    });
  }

  return mockNeuroLink as unknown as NeuroLink;
}

// ============================================
// Test Server Creation
// ============================================

/**
 * Create a test server with the specified adapter.
 *
 * @param neurolink - NeuroLink instance (or creates mock if not provided)
 * @param config - Optional server configuration
 * @returns Configured server adapter and neurolink instance for testing
 *
 * @example
 * ```typescript
 * // Basic usage
 * const { server, neurolink } = await createTestServer();
 * await server.start();
 * // Run tests...
 * await server.stop();
 *
 * // With custom config
 * const { server } = await createTestServer(undefined, {
 *   framework: "express",
 *   port: 3001,
 * });
 * ```
 */
export async function createTestServer(
  neurolink?: NeuroLink,
  config?: TestServerConfig,
): Promise<{ server: TestServerAdapter; neurolink: NeuroLink }> {
  const nl = neurolink ?? createTestNeuroLink({ mockGenerate: true });
  const framework = config?.framework ?? "hono";

  // Dynamic import to avoid issues with module resolution
  const { createServer } = await import("../../src/lib/server/index.js");

  const server = await createServer(nl, {
    framework,
    config: {
      port: config?.port ?? 0, // 0 = random available port
      host: config?.host ?? "127.0.0.1",
      basePath: config?.basePath ?? "/api",
      enableSwagger: false,
      enableMetrics: false,
      logging: { enabled: false }, // Reduce test noise
      cors: { enabled: true, origins: ["*"] },
      rateLimit: { enabled: false },
      ...config?.config,
    },
  });

  if (!config?.skipInitialize) {
    await server.initialize();
  }

  return {
    server: server as unknown as TestServerAdapter,
    neurolink: nl,
  };
}

// ============================================
// Mock Context Creation
// ============================================

/**
 * Create a mock server context for testing handlers directly.
 *
 * @param overrides - Fields to override in context
 * @returns Mock server context
 *
 * @example
 * ```typescript
 * const ctx = createMockContext({
 *   body: { input: "test prompt" },
 *   headers: { "authorization": "Bearer token" },
 * });
 * const result = await handler(ctx);
 * expect(result.content).toBeDefined();
 * ```
 */
export function createMockContext(
  overrides?: Partial<ServerContext>,
): ServerContext {
  const mockNeuroLink = createTestNeuroLink({ mockGenerate: true });
  const mockToolRegistry = mockNeuroLink.getToolRegistry();

  return {
    requestId: `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    method: "GET",
    path: "/test",
    headers: {},
    query: {},
    params: {},
    body: undefined,
    neurolink: mockNeuroLink,
    toolRegistry: mockToolRegistry,
    externalServerManager: mockNeuroLink.getExternalServerManager(),
    timestamp: Date.now(),
    metadata: {},
    ...overrides,
  } as ServerContext;
}

// ============================================
// Mock Route Creation
// ============================================

/**
 * Create a mock route definition for testing.
 *
 * @param overrides - Fields to override in route definition
 * @returns Mock route definition
 *
 * @example
 * ```typescript
 * const route = createMockRoute({
 *   method: "POST",
 *   path: "/api/test",
 *   handler: async (ctx) => ({ success: true }),
 * });
 * server.registerRoute(route);
 * ```
 */
export function createMockRoute(
  overrides?: Partial<RouteDefinition>,
): RouteDefinition {
  return {
    method: "GET",
    path: "/test",
    handler: vi.fn().mockResolvedValue({ success: true }),
    description: "Test route",
    tags: ["test"],
    ...overrides,
  };
}

// ============================================
// Server Lifecycle Utilities
// ============================================

/**
 * Wait for server to be ready.
 *
 * @param server - Server adapter
 * @param timeout - Max wait time in ms (default: 5000)
 * @throws Error if server doesn't become ready within timeout
 *
 * @example
 * ```typescript
 * await server.start();
 * await waitForServerReady(server);
 * // Server is now accepting requests
 * ```
 */
export async function waitForServerReady(
  server: TestServerAdapter,
  timeout = 5000,
): Promise<void> {
  const start = Date.now();
  const pollInterval = 50;

  while (Date.now() - start < timeout) {
    const status = server.getStatus();
    if (status.running && status.port > 0) {
      // Optionally verify server is actually responding
      try {
        const url = `http://${status.host}:${status.port}/api/health`;
        const response = await fetch(url, {
          method: "GET",
          signal: AbortSignal.timeout(1000),
        });
        if (response.ok) {
          return;
        }
      } catch {
        // Server not ready yet, continue polling
      }
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Server not ready after ${timeout}ms`);
}

// ============================================
// Test Request Utilities
// ============================================

/**
 * Make a test request to a server.
 *
 * @param server - Server adapter
 * @param options - Request options
 * @returns Response data with status, body, headers
 *
 * @example
 * ```typescript
 * const response = await makeTestRequest(server, {
 *   method: "POST",
 *   path: "/api/agent/execute",
 *   body: { input: "Hello" },
 * });
 * expect(response.status).toBe(200);
 * expect(response.body).toHaveProperty("content");
 * ```
 */
export async function makeTestRequest(
  server: TestServerAdapter,
  options: TestRequestOptions,
): Promise<TestResponse> {
  const status = server.getStatus();

  if (!status.running) {
    throw new Error("Server not running. Call server.start() first.");
  }

  if (!status.port) {
    throw new Error("Server port not available");
  }

  const url = `http://${status.host}:${status.port}${options.path}`;
  const timeout = options.timeout ?? 5000;

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });

  // Extract headers
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  // Get response text
  const text = await response.text();

  // Try to parse as JSON
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return {
    status: response.status,
    body,
    headers: responseHeaders,
    text,
  };
}

/**
 * Make a streaming test request to a server.
 *
 * @param server - Server adapter
 * @param options - Request options
 * @returns AsyncIterable of parsed events
 *
 * @example
 * ```typescript
 * const events = [];
 * for await (const event of makeStreamingTestRequest(server, {
 *   method: "POST",
 *   path: "/api/agent/stream",
 *   body: { input: "Hello", stream: true },
 * })) {
 *   events.push(event);
 * }
 * expect(events.length).toBeGreaterThan(0);
 * ```
 */
export async function* makeStreamingTestRequest(
  server: TestServerAdapter,
  options: TestRequestOptions,
): AsyncIterable<{ event?: string; data: unknown }> {
  const status = server.getStatus();

  if (!status.running || !status.port) {
    throw new Error("Server not running");
  }

  const url = `http://${status.host}:${status.port}${options.path}`;
  const timeout = options.timeout ?? 30000;

  const response = await fetch(url, {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} - ${text}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      let currentEvent: string | undefined;
      let currentData = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          currentData = line.slice(5).trim();
        } else if (line === "") {
          // End of event
          if (currentData) {
            try {
              yield { event: currentEvent, data: JSON.parse(currentData) };
            } catch {
              yield { event: currentEvent, data: currentData };
            }
          }
          currentEvent = undefined;
          currentData = "";
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ============================================
// Cleanup Utilities
// ============================================

/**
 * Safely stop and cleanup a test server.
 *
 * @param server - Server adapter to clean up
 *
 * @example
 * ```typescript
 * afterEach(async () => {
 *   await cleanupTestServer(server);
 * });
 * ```
 */
export async function cleanupTestServer(
  server: TestServerAdapter | null | undefined,
): Promise<void> {
  if (!server) {
    return;
  }

  try {
    const status = server.getStatus();
    if (status.running) {
      await server.stop();
    }
  } catch {
    // Ignore errors during cleanup
  }
}

// ============================================
// Test Fixture Utilities
// ============================================

/**
 * Load a test fixture from the fixtures directory.
 *
 * @param name - Fixture name (without .json extension)
 * @returns Parsed fixture data
 *
 * @example
 * ```typescript
 * const config = loadTestFixture<TestConfigFixture>("test-config");
 * ```
 */
export async function loadTestFixture<T>(name: string): Promise<T> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const { fileURLToPath } = await import("url");

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const fixturePath = path.resolve(
    __dirname,
    `../fixtures/servers/${name}.json`,
  );
  const content = await fs.readFile(fixturePath, "utf-8");
  return JSON.parse(content) as T;
}

// ============================================
// Assertion Helpers
// ============================================

/**
 * Assert that a response is successful (2xx status)
 */
export function assertSuccessResponse(response: TestResponse): void {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `Expected success response, got ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }
}

/**
 * Assert that a response has expected status code
 */
export function assertStatusCode(
  response: TestResponse,
  expected: number,
): void {
  if (response.status !== expected) {
    throw new Error(
      `Expected status ${expected}, got ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }
}

/**
 * Assert that response body matches expected structure
 */
export function assertResponseBody<T>(
  response: TestResponse,
  validator: (body: unknown) => body is T,
): asserts response is TestResponse & { body: T } {
  if (!validator(response.body)) {
    throw new Error(
      `Response body validation failed: ${JSON.stringify(response.body)}`,
    );
  }
}

// ============================================
// Test Data Generators
// ============================================

/**
 * Generate a unique test session ID
 */
export function generateTestSessionId(): string {
  return `test-session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate a unique test request ID
 */
export function generateTestRequestId(): string {
  return `test-req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate a unique test user ID
 */
export function generateTestUserId(): string {
  return `test-user-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================
// Framework-Specific Test Utilities
// ============================================

/**
 * Create test servers for all supported frameworks.
 * Useful for cross-framework parity testing.
 *
 * @param neurolink - NeuroLink instance
 * @param config - Shared server configuration
 * @returns Map of framework name to server instance
 *
 * @example
 * ```typescript
 * const servers = await createAllFrameworkServers(neurolink);
 * for (const [framework, server] of servers) {
 *   await server.start();
 *   // Run tests
 *   await server.stop();
 * }
 * ```
 */
export async function createAllFrameworkServers(
  neurolink?: NeuroLink,
  config?: Omit<TestServerConfig, "framework">,
): Promise<Map<ServerFramework, TestServerAdapter>> {
  const frameworks: ServerFramework[] = ["hono", "express", "fastify", "koa"];
  const servers = new Map<ServerFramework, TestServerAdapter>();

  for (const framework of frameworks) {
    const { server } = await createTestServer(neurolink, {
      ...config,
      framework,
    });
    servers.set(framework, server);
  }

  return servers;
}

/**
 * Run a test across all framework adapters
 *
 * @param testFn - Test function to run
 * @param config - Optional test configuration
 *
 * @example
 * ```typescript
 * await runCrossFrameworkTest(async (server, framework) => {
 *   await server.start();
 *   const response = await makeTestRequest(server, { path: "/api/health" });
 *   expect(response.status).toBe(200);
 *   await server.stop();
 * });
 * ```
 */
export async function runCrossFrameworkTest(
  testFn: (
    server: TestServerAdapter,
    framework: ServerFramework,
  ) => Promise<void>,
  config?: Omit<TestServerConfig, "framework">,
): Promise<void> {
  const servers = await createAllFrameworkServers(undefined, config);

  for (const [framework, server] of servers) {
    try {
      await testFn(server, framework);
    } finally {
      await cleanupTestServer(server);
    }
  }
}
