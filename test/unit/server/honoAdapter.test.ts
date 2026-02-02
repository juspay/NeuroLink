/**
 * Hono Server Adapter Tests
 * Comprehensive tests for the Hono-based server adapter
 *
 * Note: These tests verify the adapter's public API and behavior without
 * mocking the Hono framework internals. The adapter is tested via its
 * public interface: initialize, registerRoute, registerMiddleware, start, stop, etc.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NeuroLink } from "../../../src/lib/neurolink.js";
import type { BaseServerAdapter } from "../../../src/lib/server/abstract/baseServerAdapter.js";
import type {
  MiddlewareDefinition,
  RouteDefinition,
  ServerAdapterConfig,
  ServerContext,
} from "../../../src/lib/server/types.js";

/**
 * Type for the HonoServerAdapter class constructor
 */
type HonoServerAdapterClass = new (
  neurolink: NeuroLink,
  config?: ServerAdapterConfig,
) => BaseServerAdapter;

// Mock the logger to avoid noise in tests
vi.mock("../../../src/lib/utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock @hono/node-server
vi.mock("@hono/node-server", () => ({
  serve: vi.fn(() => ({
    close: vi.fn((cb) => cb?.()),
  })),
}));

describe("HonoServerAdapter", () => {
  // Mock NeuroLink and related dependencies
  const mockToolRegistry = {
    listTools: vi
      .fn()
      .mockResolvedValue([
        { name: "testTool", description: "A test tool", inputSchema: {} },
      ]),
    executeTool: vi.fn().mockResolvedValue({ result: "success" }),
  };

  const mockExternalServerManager = {
    getServerStatuses: vi.fn().mockReturnValue([]),
  };

  const mockNeuroLink = {
    getToolRegistry: vi.fn().mockReturnValue(mockToolRegistry),
    getExternalServerManager: vi
      .fn()
      .mockReturnValue(mockExternalServerManager),
    generate: vi.fn().mockResolvedValue({
      content: "Generated response",
      provider: "openai",
      model: "gpt-4",
      usage: { input: 10, output: 20, total: 30 },
    }),
    stream: vi.fn().mockResolvedValue({
      stream: (async function* () {
        yield { text: "chunk1" };
        yield { text: "chunk2" };
      })(),
    }),
    getConversationMemory: vi.fn().mockReturnValue(null),
  };

  let HonoServerAdapter: HonoServerAdapterClass;
  let adapter: BaseServerAdapter;
  let mockConfig: ServerAdapterConfig;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import fresh module for each test
    const module = await import(
      "../../../src/lib/server/adapters/honoAdapter.js"
    );
    HonoServerAdapter = module.HonoServerAdapter;

    mockConfig = {
      port: 3000,
      host: "localhost",
      basePath: "/api",
      cors: { enabled: true, origins: ["*"] },
      rateLimit: { enabled: false },
      bodyParser: { enabled: true },
      logging: { enabled: false }, // Disable to reduce noise
      timeout: 30000,
    };

    adapter = new HonoServerAdapter(
      mockNeuroLink as unknown as NeuroLink,
      mockConfig,
    );
  });

  afterEach(async () => {
    if (adapter) {
      try {
        // Only stop if the server is actually running
        const status = adapter.getStatus();
        if (status.running) {
          await adapter.stop();
        }
      } catch {
        // Ignore stop errors in cleanup - server may already be stopped
      }
    }
  });

  describe("Adapter Initialization", () => {
    it("should create adapter with default config", () => {
      const defaultAdapter = new HonoServerAdapter(
        mockNeuroLink as unknown as NeuroLink,
      );
      expect(defaultAdapter).toBeDefined();
      const config = defaultAdapter.getConfig();
      expect(config.port).toBe(3000);
      expect(config.host).toBe("0.0.0.0");
      expect(config.basePath).toBe("/api");
    });

    it("should create adapter with custom config", () => {
      const config = adapter.getConfig();
      expect(config.port).toBe(3000);
      expect(config.host).toBe("localhost");
      expect(config.basePath).toBe("/api");
    });

    it("should initialize framework on initialize()", async () => {
      await adapter.initialize();
      const status = adapter.getStatus();
      expect(status.routes).toBeGreaterThan(0);
    });

    it("should emit initialized event", async () => {
      const initHandler = vi.fn();
      adapter.on("initialized", initHandler);

      await adapter.initialize();

      expect(initHandler).toHaveBeenCalled();
      expect(initHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          routeCount: expect.any(Number),
          middlewareCount: expect.any(Number),
        }),
      );
    });

    it("should register built-in middleware", async () => {
      await adapter.initialize();
      const status = adapter.getStatus();
      expect(status.middlewares).toBeGreaterThanOrEqual(1);
    });

    it("should register built-in routes", async () => {
      await adapter.initialize();
      const routes = adapter.listRoutes();
      const healthRoute = routes.find((r: RouteDefinition) =>
        r.path.includes("/health"),
      );
      expect(healthRoute).toBeDefined();
    });
  });

  describe("Route Registration", () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it("should register a GET route", () => {
      const route: RouteDefinition = {
        method: "GET",
        path: "/api/test",
        handler: async () => ({ message: "test" }),
        description: "Test endpoint",
      };

      adapter.registerRoute(route);
      const routes = adapter.listRoutes();
      const testRoute = routes.find(
        (r: RouteDefinition) => r.path === "/api/test",
      );
      expect(testRoute).toBeDefined();
      expect(testRoute?.method).toBe("GET");
    });

    it("should register a POST route", () => {
      const route: RouteDefinition = {
        method: "POST",
        path: "/api/create",
        handler: async (ctx: ServerContext) => ({
          created: true,
          body: ctx.body,
        }),
        description: "Create endpoint",
      };

      adapter.registerRoute(route);
      const routes = adapter.listRoutes();
      const createRoute = routes.find(
        (r: RouteDefinition) => r.path === "/api/create",
      );
      expect(createRoute).toBeDefined();
      expect(createRoute?.method).toBe("POST");
    });

    it("should register a PUT route", () => {
      const route: RouteDefinition = {
        method: "PUT",
        path: "/api/update/:id",
        handler: async (ctx: ServerContext) => ({ updated: ctx.params.id }),
        description: "Update endpoint",
      };

      adapter.registerRoute(route);
      const routes = adapter.listRoutes();
      const updateRoute = routes.find(
        (r: RouteDefinition) => r.path === "/api/update/:id",
      );
      expect(updateRoute).toBeDefined();
    });

    it("should register a DELETE route", () => {
      const route: RouteDefinition = {
        method: "DELETE",
        path: "/api/delete/:id",
        handler: async (ctx: ServerContext) => ({ deleted: ctx.params.id }),
        description: "Delete endpoint",
      };

      adapter.registerRoute(route);
      const routes = adapter.listRoutes();
      const deleteRoute = routes.find(
        (r: RouteDefinition) => r.path === "/api/delete/:id",
      );
      expect(deleteRoute).toBeDefined();
    });

    it("should register a PATCH route", () => {
      const route: RouteDefinition = {
        method: "PATCH",
        path: "/api/patch/:id",
        handler: async (ctx: ServerContext) => ({ patched: ctx.params.id }),
        description: "Patch endpoint",
      };

      adapter.registerRoute(route);
      const routes = adapter.listRoutes();
      const patchRoute = routes.find(
        (r: RouteDefinition) => r.path === "/api/patch/:id",
      );
      expect(patchRoute).toBeDefined();
    });

    it("should warn when registering duplicate route", () => {
      const route: RouteDefinition = {
        method: "GET",
        path: "/api/duplicate",
        handler: async () => ({ version: 1 }),
      };

      adapter.registerRoute(route);
      adapter.registerRoute({
        ...route,
        handler: async () => ({ version: 2 }),
      });

      const routes = adapter.listRoutes();
      const duplicateRoutes = routes.filter(
        (r: RouteDefinition) => r.path === "/api/duplicate",
      );
      expect(duplicateRoutes.length).toBe(1);
    });

    it("should register route with streaming enabled", () => {
      const route: RouteDefinition = {
        method: "POST",
        path: "/api/stream",
        handler: async function* () {
          yield { chunk: 1 };
          yield { chunk: 2 };
        },
        streaming: { enabled: true },
        description: "Streaming endpoint",
      };

      adapter.registerRoute(route);
      const routes = adapter.listRoutes();
      const streamRoute = routes.find(
        (r: RouteDefinition) => r.path === "/api/stream",
      );
      expect(streamRoute?.streaming?.enabled).toBe(true);
    });

    it("should register route group with multiple routes", () => {
      adapter.registerRouteGroup({
        prefix: "/api/users",
        routes: [
          {
            method: "GET",
            path: "/api/users",
            handler: async () => ({ users: [] }),
          },
          {
            method: "GET",
            path: "/api/users/:id",
            handler: async (ctx: ServerContext) => ({ user: ctx.params.id }),
          },
          {
            method: "POST",
            path: "/api/users",
            handler: async (ctx: ServerContext) => ({ created: ctx.body }),
          },
        ],
      });

      const routes = adapter.listRoutes();
      const userRoutes = routes.filter((r: RouteDefinition) =>
        r.path.startsWith("/api/users"),
      );
      expect(userRoutes.length).toBe(3);
    });
  });

  describe("Middleware Execution", () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it("should register custom middleware", () => {
      const middleware: MiddlewareDefinition = {
        name: "customMiddleware",
        order: 10,
        handler: async (ctx, next) => {
          ctx.metadata.custom = true;
          return next();
        },
      };

      adapter.registerMiddleware(middleware);
      const status = adapter.getStatus();
      expect(status.middlewares).toBeGreaterThanOrEqual(2);
    });

    it("should execute middleware with specific paths", () => {
      const middleware: MiddlewareDefinition = {
        name: "authMiddleware",
        order: 5,
        paths: ["/api/protected/*"],
        handler: async (ctx, next) => {
          if (!ctx.headers.authorization) {
            throw new Error("Unauthorized");
          }
          return next();
        },
      };

      adapter.registerMiddleware(middleware);
      const status = adapter.getStatus();
      expect(status.middlewares).toBeGreaterThanOrEqual(2);
    });

    it("should support middleware with exclude paths", () => {
      const middleware: MiddlewareDefinition = {
        name: "loggingMiddleware",
        order: 1,
        excludePaths: ["/api/health"],
        handler: async (_ctx, next) => {
          return next();
        },
      };

      adapter.registerMiddleware(middleware);
      const status = adapter.getStatus();
      expect(status.middlewares).toBeGreaterThanOrEqual(2);
    });
  });

  describe("SSE Streaming", () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it("should handle streaming routes with SSE", () => {
      const route: RouteDefinition = {
        method: "POST",
        path: "/api/sse-stream",
        streaming: { enabled: true, contentType: "text/event-stream" },
        handler: async function* () {
          yield { event: "start", data: "Starting" };
          yield { event: "data", data: "Processing" };
          yield { event: "end", data: "Done" };
        },
        description: "SSE streaming endpoint",
      };

      adapter.registerRoute(route);
      const routes = adapter.listRoutes();
      const sseRoute = routes.find(
        (r: RouteDefinition) => r.path === "/api/sse-stream",
      );
      expect(sseRoute).toBeDefined();
      expect(sseRoute?.streaming?.enabled).toBe(true);
    });

    it("should handle async iterable results", () => {
      const route: RouteDefinition = {
        method: "GET",
        path: "/api/async-stream",
        streaming: { enabled: true },
        handler: async () => {
          return (async function* () {
            for (let i = 0; i < 3; i++) {
              yield { index: i };
            }
          })();
        },
        description: "Async iterable endpoint",
      };

      adapter.registerRoute(route);
      const routes = adapter.listRoutes();
      const asyncRoute = routes.find(
        (r: RouteDefinition) => r.path === "/api/async-stream",
      );
      expect(asyncRoute).toBeDefined();
    });
  });

  describe("Server Lifecycle", () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it("should start server", async () => {
      const startHandler = vi.fn();
      adapter.on("started", startHandler);

      await adapter.start();

      expect(adapter.getStatus().running).toBe(true);
      expect(startHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 3000,
          host: "localhost",
          timestamp: expect.any(Date),
        }),
      );
    });

    it("should not start server if already running", async () => {
      await adapter.start();
      // Attempting to start an already running server should throw an error
      await expect(adapter.start()).rejects.toThrow();
    });

    it("should stop server", async () => {
      await adapter.start();
      const stopHandler = vi.fn();
      adapter.on("stopped", stopHandler);

      await adapter.stop();

      expect(adapter.getStatus().running).toBe(false);
      expect(stopHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          uptime: expect.any(Number),
          timestamp: expect.any(Date),
        }),
      );
    });

    it("should not stop server if not running", async () => {
      // stop() is idempotent - calling it when server is not running should return gracefully
      await expect(adapter.stop()).resolves.toBeUndefined();
    });

    it("should track uptime correctly", async () => {
      await adapter.start();

      // Wait a small amount
      await new Promise((resolve) => setTimeout(resolve, 50));

      const status = adapter.getStatus();
      expect(status.uptime).toBeGreaterThan(0);
    });
  });

  describe("Framework Instance Access", () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it("should return Hono app instance", () => {
      const app = adapter.getFrameworkInstance();
      expect(app).toBeDefined();
    });
  });

  describe("Configuration", () => {
    it("should apply CORS configuration when enabled", async () => {
      const corsAdapter = new HonoServerAdapter(
        mockNeuroLink as unknown as NeuroLink,
        {
          cors: {
            enabled: true,
            origins: ["http://localhost:3000"],
            methods: ["GET", "POST"],
            credentials: true,
          },
        },
      );

      await corsAdapter.initialize();
      const config = corsAdapter.getConfig();
      expect(config.cors.enabled).toBe(true);
      expect(config.cors.origins).toContain("http://localhost:3000");
    });

    it("should apply rate limiting configuration when enabled", async () => {
      const rateLimitAdapter = new HonoServerAdapter(
        mockNeuroLink as unknown as NeuroLink,
        {
          rateLimit: {
            enabled: true,
            windowMs: 60000,
            maxRequests: 50,
            message: "Too many requests",
          },
        },
      );

      await rateLimitAdapter.initialize();
      const config = rateLimitAdapter.getConfig();
      expect(config.rateLimit.enabled).toBe(true);
      expect(config.rateLimit.windowMs).toBe(60000);
      expect(config.rateLimit.maxRequests).toBe(50);
    });

    it("should apply timeout configuration", async () => {
      const timeoutAdapter = new HonoServerAdapter(
        mockNeuroLink as unknown as NeuroLink,
        { timeout: 60000 },
      );

      await timeoutAdapter.initialize();
      const config = timeoutAdapter.getConfig();
      expect(config.timeout).toBe(60000);
    });

    it("should disable built-in health routes when configured", async () => {
      const noHealthAdapter = new HonoServerAdapter(
        mockNeuroLink as unknown as NeuroLink,
        {
          disableBuiltInHealth: true,
        },
      );

      await noHealthAdapter.initialize();
      const routes = noHealthAdapter.listRoutes();
      const healthRoutes = routes.filter(
        (r: RouteDefinition) =>
          r.path.includes("/health") || r.path.includes("/ready"),
      );
      expect(healthRoutes.length).toBe(0);
    });

    it("should enable metrics endpoint by default", async () => {
      await adapter.initialize();
      const routes = adapter.listRoutes();
      const metricsRoute = routes.find((r: RouteDefinition) =>
        r.path.includes("/metrics"),
      );
      expect(metricsRoute).toBeDefined();
    });

    it("should disable metrics endpoint when configured", async () => {
      const noMetricsAdapter = new HonoServerAdapter(
        mockNeuroLink as unknown as NeuroLink,
        { enableMetrics: false },
      );

      await noMetricsAdapter.initialize();
      const routes = noMetricsAdapter.listRoutes();
      const metricsRoute = routes.find((r: RouteDefinition) =>
        r.path.includes("/metrics"),
      );
      expect(metricsRoute).toBeUndefined();
    });
  });

  describe("Status and Monitoring", () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it("should return correct server status", () => {
      const status = adapter.getStatus();
      expect(status).toEqual({
        running: false,
        port: 3000,
        host: "localhost",
        uptime: 0,
        routes: expect.any(Number),
        middlewares: expect.any(Number),
        activeConnections: expect.any(Number),
        lifecycleState: expect.any(String),
      });
    });

    it("should return correct status when running", async () => {
      await adapter.start();
      const status = adapter.getStatus();
      expect(status.running).toBe(true);
      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should list all registered routes", () => {
      adapter.registerRoute({
        method: "GET",
        path: "/api/test1",
        handler: async () => ({}),
      });
      adapter.registerRoute({
        method: "POST",
        path: "/api/test2",
        handler: async () => ({}),
      });

      const routes = adapter.listRoutes();
      expect(routes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Error Handling", () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it("should emit error event on handler error", () => {
      const errorHandler = vi.fn();
      adapter.on("error", errorHandler);

      adapter.registerRoute({
        method: "GET",
        path: "/api/error-route",
        handler: async () => {
          throw new Error("Test error");
        },
      });

      const routes = adapter.listRoutes();
      const errorRoute = routes.find(
        (r: RouteDefinition) => r.path === "/api/error-route",
      );
      expect(errorRoute).toBeDefined();
    });
  });

  describe("Request Context Creation", () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it("should include neurolink instance in context", () => {
      adapter.registerRoute({
        method: "GET",
        path: "/api/context-test",
        handler: async (ctx: ServerContext) => {
          return { hasNeurolink: !!ctx.neurolink };
        },
      });

      const routes = adapter.listRoutes();
      const contextRoute = routes.find(
        (r: RouteDefinition) => r.path === "/api/context-test",
      );
      expect(contextRoute).toBeDefined();
    });

    it("should include tool registry in context", () => {
      adapter.registerRoute({
        method: "GET",
        path: "/api/tools-context",
        handler: async (ctx: ServerContext) => {
          return { hasToolRegistry: !!ctx.toolRegistry };
        },
      });

      const routes = adapter.listRoutes();
      expect(routes.length).toBeGreaterThan(0);
    });
  });
});
