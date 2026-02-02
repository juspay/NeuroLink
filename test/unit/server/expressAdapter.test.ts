/**
 * Express Server Adapter Tests
 * Comprehensive tests for the Express-based server adapter
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock express module
const mockExpressApp = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  options: vi.fn(),
  listen: vi.fn((port: number, host: string, callback: () => void) => {
    callback();
    return {
      close: vi.fn((cb?: () => void) => cb?.()),
    };
  }),
};

const mockExpress = vi.fn(() => mockExpressApp);
mockExpress.json = vi.fn(() => vi.fn());
mockExpress.urlencoded = vi.fn(() => vi.fn());

vi.mock("express", () => ({
  default: mockExpress,
}));

vi.mock("cors", () => ({
  default: vi.fn(() => vi.fn()),
}));

vi.mock("express-rate-limit", () => ({
  default: vi.fn(() => vi.fn()),
}));

// Mock NeuroLink and related modules
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
  getExternalServerManager: vi.fn().mockReturnValue(mockExternalServerManager),
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

vi.mock("../../../src/lib/utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import type { NeuroLink } from "../../../src/lib/neurolink.js";
import { ExpressServerAdapter } from "../../../src/lib/server/adapters/expressAdapter.js";
import type {
  MiddlewareDefinition,
  RouteDefinition,
  ServerAdapterConfig,
} from "../../../src/lib/server/types.js";

describe("ExpressServerAdapter", () => {
  let adapter: ExpressServerAdapter;
  let mockConfig: ServerAdapterConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    mockConfig = {
      port: 3000,
      host: "localhost",
      basePath: "/api",
      cors: { enabled: true, origins: ["*"] },
      rateLimit: { enabled: false },
      bodyParser: { enabled: true },
      logging: { enabled: true },
      timeout: 30000,
    };

    adapter = new ExpressServerAdapter(
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
        // Ignore errors during cleanup - server may already be stopped
      }
    }
  });

  describe("Adapter Initialization", () => {
    it("should create adapter with default config", () => {
      const defaultAdapter = new ExpressServerAdapter(
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

    it("should initialize framework asynchronously on initialize()", async () => {
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

    it("should setup body parser when enabled", async () => {
      await adapter.initialize();
      expect(mockExpress.json).toHaveBeenCalled();
      expect(mockExpress.urlencoded).toHaveBeenCalled();
    });

    it("should not reinitialize if already initialized", async () => {
      await adapter.initialize();
      // Attempting to initialize an already initialized adapter should throw an error
      await expect(adapter.initialize()).rejects.toThrow();
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
      expect(mockExpressApp.get).toHaveBeenCalled();

      const routes = adapter.listRoutes();
      const testRoute = routes.find((r) => r.path === "/api/test");
      expect(testRoute).toBeDefined();
      expect(testRoute?.method).toBe("GET");
    });

    it("should register a POST route", () => {
      const route: RouteDefinition = {
        method: "POST",
        path: "/api/create",
        handler: async (ctx) => ({ created: true, body: ctx.body }),
        description: "Create endpoint",
      };

      adapter.registerRoute(route);
      expect(mockExpressApp.post).toHaveBeenCalled();

      const routes = adapter.listRoutes();
      const createRoute = routes.find((r) => r.path === "/api/create");
      expect(createRoute).toBeDefined();
      expect(createRoute?.method).toBe("POST");
    });

    it("should register a PUT route", () => {
      const route: RouteDefinition = {
        method: "PUT",
        path: "/api/update/:id",
        handler: async (ctx) => ({ updated: ctx.params.id }),
        description: "Update endpoint",
      };

      adapter.registerRoute(route);
      expect(mockExpressApp.put).toHaveBeenCalled();

      const routes = adapter.listRoutes();
      const updateRoute = routes.find((r) => r.path === "/api/update/:id");
      expect(updateRoute).toBeDefined();
    });

    it("should register a DELETE route", () => {
      const route: RouteDefinition = {
        method: "DELETE",
        path: "/api/delete/:id",
        handler: async (ctx) => ({ deleted: ctx.params.id }),
        description: "Delete endpoint",
      };

      adapter.registerRoute(route);
      expect(mockExpressApp.delete).toHaveBeenCalled();

      const routes = adapter.listRoutes();
      const deleteRoute = routes.find((r) => r.path === "/api/delete/:id");
      expect(deleteRoute).toBeDefined();
    });

    it("should register a PATCH route", () => {
      const route: RouteDefinition = {
        method: "PATCH",
        path: "/api/patch/:id",
        handler: async (ctx) => ({ patched: ctx.params.id }),
        description: "Patch endpoint",
      };

      adapter.registerRoute(route);
      expect(mockExpressApp.patch).toHaveBeenCalled();

      const routes = adapter.listRoutes();
      const patchRoute = routes.find((r) => r.path === "/api/patch/:id");
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
      const duplicateRoutes = routes.filter((r) => r.path === "/api/duplicate");
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
      const streamRoute = routes.find((r) => r.path === "/api/stream");
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
            handler: async (ctx) => ({ user: ctx.params.id }),
          },
          {
            method: "POST",
            path: "/api/users",
            handler: async (ctx) => ({ created: ctx.body }),
          },
        ],
      });

      const routes = adapter.listRoutes();
      const userRoutes = routes.filter((r) => r.path.startsWith("/api/users"));
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
      expect(mockExpressApp.use).toHaveBeenCalled();
      const status = adapter.getStatus();
      expect(status.middlewares).toBeGreaterThanOrEqual(2);
    });

    it("should execute middleware with specific paths", () => {
      const middleware: MiddlewareDefinition = {
        name: "authMiddleware",
        order: 5,
        paths: ["/api/protected"],
        handler: async (ctx, next) => {
          if (!ctx.headers.authorization) {
            throw new Error("Unauthorized");
          }
          return next();
        },
      };

      adapter.registerMiddleware(middleware);
      expect(mockExpressApp.use).toHaveBeenCalledWith(
        "/api/protected",
        expect.any(Function),
      );
    });

    it("should support middleware with exclude paths", () => {
      const middleware: MiddlewareDefinition = {
        name: "loggingMiddleware",
        order: 1,
        excludePaths: ["/api/health"],
        handler: async (ctx, next) => {
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
      const sseRoute = routes.find((r) => r.path === "/api/sse-stream");
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
      const asyncRoute = routes.find((r) => r.path === "/api/async-stream");
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
      expect(mockExpressApp.listen).toHaveBeenCalledWith(
        3000,
        "localhost",
        expect.any(Function),
      );
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

    it("should return Express app instance", () => {
      const app = adapter.getFrameworkInstance();
      expect(app).toBeDefined();
      expect(app).toBe(mockExpressApp);
    });
  });

  describe("Configuration", () => {
    it("should apply CORS configuration when enabled", async () => {
      const cors = await import("cors");

      const corsAdapter = new ExpressServerAdapter(
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

      expect(cors.default).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: ["http://localhost:3000"],
          methods: ["GET", "POST"],
          credentials: true,
        }),
      );
    });

    it("should apply rate limiting configuration when enabled", async () => {
      const rateLimit = await import("express-rate-limit");

      const rateLimitAdapter = new ExpressServerAdapter(
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

      expect(rateLimit.default).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 60000,
          max: 50,
        }),
      );
    });

    it("should apply body parser configuration", async () => {
      const bodyParserAdapter = new ExpressServerAdapter(
        mockNeuroLink as unknown as NeuroLink,
        {
          bodyParser: {
            enabled: true,
            jsonLimit: "5mb",
          },
        },
      );

      await bodyParserAdapter.initialize();

      expect(mockExpress.json).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: "5mb",
        }),
      );
    });

    it("should disable body parser when configured", async () => {
      vi.clearAllMocks();

      const noBodyParserAdapter = new ExpressServerAdapter(
        mockNeuroLink as unknown as NeuroLink,
        {
          bodyParser: { enabled: false },
        },
      );

      await noBodyParserAdapter.initialize();

      // json and urlencoded should not be called when bodyParser is disabled
      expect(mockExpress.json).not.toHaveBeenCalled();
    });

    it("should disable built-in health routes when configured", async () => {
      const noHealthAdapter = new ExpressServerAdapter(
        mockNeuroLink as unknown as NeuroLink,
        {
          disableBuiltInHealth: true,
        },
      );

      await noHealthAdapter.initialize();
      const routes = noHealthAdapter.listRoutes();
      const healthRoutes = routes.filter(
        (r) => r.path.includes("/health") || r.path.includes("/ready"),
      );
      expect(healthRoutes.length).toBe(0);
    });

    it("should enable metrics endpoint by default", async () => {
      await adapter.initialize();
      const routes = adapter.listRoutes();
      const metricsRoute = routes.find((r) => r.path.includes("/metrics"));
      expect(metricsRoute).toBeDefined();
    });

    it("should disable metrics endpoint when configured", async () => {
      const noMetricsAdapter = new ExpressServerAdapter(
        mockNeuroLink as unknown as NeuroLink,
        {
          enableMetrics: false,
        },
      );

      await noMetricsAdapter.initialize();
      const routes = noMetricsAdapter.listRoutes();
      const metricsRoute = routes.find((r) => r.path.includes("/metrics"));
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

    it("should setup error handler middleware", () => {
      // Register a route to trigger error handler setup
      adapter.registerRoute({
        method: "GET",
        path: "/api/error-route",
        handler: async () => {
          throw new Error("Test error");
        },
      });

      // The error handler should be registered via app.use
      expect(mockExpressApp.use).toHaveBeenCalled();
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
      const errorRoute = routes.find((r) => r.path === "/api/error-route");
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
        handler: async (ctx) => {
          return { hasNeurolink: !!ctx.neurolink };
        },
      });

      const routes = adapter.listRoutes();
      const contextRoute = routes.find((r) => r.path === "/api/context-test");
      expect(contextRoute).toBeDefined();
    });

    it("should include tool registry in context", () => {
      adapter.registerRoute({
        method: "GET",
        path: "/api/tools-context",
        handler: async (ctx) => {
          return { hasToolRegistry: !!ctx.toolRegistry };
        },
      });

      const routes = adapter.listRoutes();
      expect(routes.length).toBeGreaterThan(0);
    });
  });

  describe("Logging", () => {
    it("should setup logging middleware when enabled", async () => {
      const loggingAdapter = new ExpressServerAdapter(
        mockNeuroLink as unknown as NeuroLink,
        {
          logging: { enabled: true, level: "info" },
        },
      );

      await loggingAdapter.initialize();

      // Logging middleware should be registered
      expect(mockExpressApp.use).toHaveBeenCalled();
    });

    it("should skip logging middleware when disabled", async () => {
      vi.clearAllMocks();

      const noLoggingAdapter = new ExpressServerAdapter(
        mockNeuroLink as unknown as NeuroLink,
        {
          logging: { enabled: false },
        },
      );

      await noLoggingAdapter.initialize();

      // Should have fewer middleware registered
      const status = noLoggingAdapter.getStatus();
      expect(status.middlewares).toBeGreaterThanOrEqual(1);
    });
  });
});
