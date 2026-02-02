/**
 * Route Deprecation Middleware Tests
 * Tests for RFC 8594 compliant deprecation headers
 */

import { describe, it, expect, vi } from "vitest";
import { createDeprecationMiddleware } from "../../../src/lib/server/middleware/deprecation.js";
import type { RouteDefinition } from "../../../src/lib/server/types.js";
import { createMockContext } from "../../utils/server-test-utils.js";

describe("createDeprecationMiddleware", () => {
  describe("Deprecation header", () => {
    it("should add Deprecation header for deprecated routes", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: true,
          },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(next).toHaveBeenCalled();
      expect(ctx.responseHeaders).toBeDefined();
      expect(ctx.responseHeaders!["Deprecation"]).toBe("true");
    });

    it("should add Deprecation header with since version info", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: true,
            since: "2.0.0",
          },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(ctx.responseHeaders!["Deprecation"]).toBe("true");
      expect(ctx.responseHeaders!["X-Deprecation-Notice"]).toContain(
        "since version 2.0.0",
      );
    });

    it("should not add headers for non-deprecated routes", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          // No deprecated field
        },
        {
          method: "GET",
          path: "/api/v2/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: false, // Explicitly disabled
          },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v2/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(next).toHaveBeenCalled();
      expect(ctx.responseHeaders?.["Deprecation"]).toBeUndefined();
    });
  });

  describe("Sunset header", () => {
    it("should add Sunset header when removeIn is specified", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: true,
            removeIn: "3.0.0",
          },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(ctx.responseHeaders!["Sunset"]).toBeDefined();
      // Sunset header should be a valid HTTP date
      const sunsetDate = new Date(ctx.responseHeaders!["Sunset"]);
      expect(sunsetDate.getTime()).toBeGreaterThan(Date.now());
    });

    it("should not add Sunset header when removeIn is not specified", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: true,
            since: "2.0.0",
            // No removeIn
          },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(ctx.responseHeaders!["Deprecation"]).toBe("true");
      expect(ctx.responseHeaders!["Sunset"]).toBeUndefined();
    });
  });

  describe("Link header", () => {
    it("should add Link header when alternative is specified", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: true,
            alternative: "/api/v2/users",
          },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(ctx.responseHeaders!["Link"]).toBe(
        '</api/v2/users>; rel="successor-version"',
      );
    });

    it("should not add Link header when alternative is not specified", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: true,
            since: "2.0.0",
            // No alternative
          },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(ctx.responseHeaders!["Deprecation"]).toBe("true");
      expect(ctx.responseHeaders!["Link"]).toBeUndefined();
    });

    it("should not add Link header when includeLink is false", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: true,
            alternative: "/api/v2/users",
          },
        },
      ];

      const middleware = createDeprecationMiddleware({
        routes,
        includeLink: false,
      });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(ctx.responseHeaders!["Deprecation"]).toBe("true");
      expect(ctx.responseHeaders!["Link"]).toBeUndefined();
    });
  });

  describe("X-Deprecation-Notice header", () => {
    it("should add custom deprecation notice", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: true,
            message: "This endpoint is obsolete. Please use /api/v2/users.",
          },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(ctx.responseHeaders!["X-Deprecation-Notice"]).toBe(
        "This endpoint is obsolete. Please use /api/v2/users.",
      );
    });

    it("should generate default notice from since and removeIn", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: true,
            since: "2.0.0",
            removeIn: "3.0.0",
          },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      const notice = ctx.responseHeaders!["X-Deprecation-Notice"];
      expect(notice).toContain("deprecated since version 2.0.0");
      expect(notice).toContain("will be removed in version 3.0.0");
    });

    it("should allow custom notice header name", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: true,
            message: "Use v2 instead",
          },
        },
      ];

      const middleware = createDeprecationMiddleware({
        routes,
        noticeHeader: "X-API-Deprecation",
      });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(ctx.responseHeaders!["X-API-Deprecation"]).toBe("Use v2 instead");
      expect(ctx.responseHeaders!["X-Deprecation-Notice"]).toBeUndefined();
    });
  });

  describe("Route matching", () => {
    it("should match routes by method and path", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: { enabled: true },
        },
        {
          method: "POST",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          // Not deprecated
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });

      // GET should be deprecated
      const getCtx = createMockContext({
        method: "GET",
        path: "/api/v1/users",
      });
      const getNext = vi.fn().mockResolvedValue({ data: [] });
      await middleware.handler(getCtx, getNext);
      expect(getCtx.responseHeaders?.["Deprecation"]).toBe("true");

      // POST should not be deprecated
      const postCtx = createMockContext({
        method: "POST",
        path: "/api/v1/users",
      });
      const postNext = vi.fn().mockResolvedValue({ data: [] });
      await middleware.handler(postCtx, postNext);
      expect(postCtx.responseHeaders?.["Deprecation"]).toBeUndefined();
    });

    it("should match parameterized routes", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users/:id",
          handler: async () => ({ data: {} }),
          deprecated: {
            enabled: true,
            alternative: "/api/v2/users/:id",
          },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({
        method: "GET",
        path: "/api/v1/users/123",
      });
      const next = vi.fn().mockResolvedValue({ data: {} });

      await middleware.handler(ctx, next);

      expect(ctx.responseHeaders!["Deprecation"]).toBe("true");
    });

    it("should not match unrelated paths", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: { enabled: true },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({
        method: "GET",
        path: "/api/v1/products",
      });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(ctx.responseHeaders?.["Deprecation"]).toBeUndefined();
    });
  });

  describe("Metadata", () => {
    it("should store deprecation info in context metadata", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: true,
            since: "2.0.0",
            removeIn: "3.0.0",
            alternative: "/api/v2/users",
          },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(ctx.metadata.deprecation).toEqual({
        route: "/api/v1/users",
        method: "GET",
        since: "2.0.0",
        removeIn: "3.0.0",
        alternative: "/api/v2/users",
      });
    });
  });

  describe("Handler result passthrough", () => {
    it("should return the handler result unchanged", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [{ id: 1, name: "John" }] }),
          deprecated: { enabled: true },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const expectedResult = { data: [{ id: 1, name: "John" }] };
      const next = vi.fn().mockResolvedValue(expectedResult);

      const result = await middleware.handler(ctx, next);

      expect(result).toEqual(expectedResult);
    });

    it("should call next() exactly once", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: { enabled: true },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("Complete deprecation scenario", () => {
    it("should add all headers for fully specified deprecation", async () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/v1/users",
          handler: async () => ({ data: [] }),
          deprecated: {
            enabled: true,
            since: "2.0.0",
            removeIn: "3.0.0",
            alternative: "/api/v2/users",
            message: "Please migrate to /api/v2/users",
          },
        },
      ];

      const middleware = createDeprecationMiddleware({ routes });
      const ctx = createMockContext({ path: "/api/v1/users" });
      const next = vi.fn().mockResolvedValue({ data: [] });

      await middleware.handler(ctx, next);

      expect(ctx.responseHeaders).toEqual({
        Deprecation: "true",
        Sunset: expect.any(String),
        Link: '</api/v2/users>; rel="successor-version"',
        "X-Deprecation-Notice": "Please migrate to /api/v2/users",
      });
    });
  });
});
