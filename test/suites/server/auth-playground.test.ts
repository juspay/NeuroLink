/**
 * Auth Playground Skip Tests
 * Tests for dev playground authentication bypass feature
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createAuthMiddleware,
  isDevPlayground,
  DEV_PLAYGROUND_USER,
} from "../../../src/lib/server/middleware/auth.js";
import {
  AuthenticationError,
  InvalidAuthenticationError,
} from "../../../src/lib/server/errors.js";
import { createMockContext } from "../../utils/server-test-utils.js";

describe("isDevPlayground", () => {
  it("should return true for x-neurolink-dev-playground header", () => {
    const headers = { "x-neurolink-dev-playground": "true" };
    expect(isDevPlayground(headers)).toBe(true);
  });

  it("should return true for x-neurolink-playground header", () => {
    const headers = { "x-neurolink-playground": "true" };
    expect(isDevPlayground(headers)).toBe(true);
  });

  it("should return false when headers are not present", () => {
    const headers = {};
    expect(isDevPlayground(headers)).toBe(false);
  });

  it("should return false when header value is not 'true'", () => {
    const headers = { "x-neurolink-dev-playground": "false" };
    expect(isDevPlayground(headers)).toBe(false);
  });

  it("should handle array header values", () => {
    const headers = { "x-neurolink-dev-playground": ["true", "false"] };
    expect(isDevPlayground(headers)).toBe(true);
  });

  it("should handle case-insensitive header names", () => {
    // Headers object keys should be lowercase per HTTP spec
    const headers = { "x-neurolink-dev-playground": "true" };
    expect(isDevPlayground(headers)).toBe(true);
  });
});

describe("DEV_PLAYGROUND_USER", () => {
  it("should have correct structure", () => {
    expect(DEV_PLAYGROUND_USER).toEqual({
      id: "playground",
      roles: ["developer"],
    });
  });
});

describe("createAuthMiddleware - dev playground skip", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Reset NODE_ENV before each test
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("should bypass auth for dev playground in non-production (default)", async () => {
    const validateFn = vi.fn();
    const middleware = createAuthMiddleware({
      type: "bearer",
      validate: validateFn,
    });

    const ctx = createMockContext({
      headers: { "x-neurolink-dev-playground": "true" },
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware.handler(ctx, next);

    // Validate should not be called
    expect(validateFn).not.toHaveBeenCalled();
    // User should be set to playground user
    expect(ctx.user).toEqual({
      id: "playground",
      email: undefined,
      roles: ["developer"],
    });
    // Next should be called
    expect(next).toHaveBeenCalled();
  });

  it("should NOT bypass auth in production environment", async () => {
    process.env.NODE_ENV = "production";

    const validateFn = vi.fn().mockResolvedValue(null);
    const middleware = createAuthMiddleware({
      type: "bearer",
      validate: validateFn,
    });

    const ctx = createMockContext({
      headers: {
        "x-neurolink-dev-playground": "true",
        authorization: "Bearer valid-token",
      },
    });
    const next = vi.fn().mockResolvedValue(undefined);

    // Should throw because validate returns null (invalid token)
    await expect(middleware.handler(ctx, next)).rejects.toThrow(
      InvalidAuthenticationError,
    );
    expect(validateFn).toHaveBeenCalled();
  });

  it("should NOT bypass auth when skipDevPlayground is false", async () => {
    const validateFn = vi.fn().mockResolvedValue(null);
    const middleware = createAuthMiddleware({
      type: "bearer",
      validate: validateFn,
      skipDevPlayground: false,
    });

    const ctx = createMockContext({
      headers: {
        "x-neurolink-dev-playground": "true",
        authorization: "Bearer some-token",
      },
    });
    const next = vi.fn().mockResolvedValue(undefined);

    // Should throw because validate returns null (invalid token)
    await expect(middleware.handler(ctx, next)).rejects.toThrow(
      InvalidAuthenticationError,
    );
    expect(validateFn).toHaveBeenCalled();
  });

  it("should require auth when playground header is not present", async () => {
    const validateFn = vi.fn().mockResolvedValue(null);
    const middleware = createAuthMiddleware({
      type: "bearer",
      validate: validateFn,
    });

    const ctx = createMockContext({
      headers: {}, // No playground header
    });
    const next = vi.fn().mockResolvedValue(undefined);

    // Should throw because no token is provided
    await expect(middleware.handler(ctx, next)).rejects.toThrow(
      AuthenticationError,
    );
  });

  it("should work with x-neurolink-playground header", async () => {
    const validateFn = vi.fn();
    const middleware = createAuthMiddleware({
      type: "bearer",
      validate: validateFn,
    });

    const ctx = createMockContext({
      headers: { "x-neurolink-playground": "true" },
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware.handler(ctx, next);

    expect(validateFn).not.toHaveBeenCalled();
    expect(ctx.user?.id).toBe("playground");
    expect(next).toHaveBeenCalled();
  });

  it("should proceed with normal auth when playground header is 'false'", async () => {
    const validateFn = vi.fn().mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
    });
    const middleware = createAuthMiddleware({
      type: "bearer",
      validate: validateFn,
    });

    const ctx = createMockContext({
      headers: {
        "x-neurolink-dev-playground": "false",
        authorization: "Bearer valid-token",
      },
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware.handler(ctx, next);

    // Should use normal auth flow
    expect(validateFn).toHaveBeenCalledWith("valid-token", ctx);
    expect(ctx.user?.id).toBe("user-123");
  });
});

describe("createAuthMiddleware - integration with other options", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env.NODE_ENV = undefined;
  });

  it("should respect skipPaths alongside skipDevPlayground", async () => {
    const validateFn = vi.fn();
    const middleware = createAuthMiddleware({
      type: "bearer",
      validate: validateFn,
      skipPaths: ["/health"],
    });

    // excludePaths should be set
    expect(middleware.excludePaths).toContain("/health");
  });

  it("should work with different auth types", async () => {
    const validateFn = vi.fn();

    // API key auth with dev playground skip
    const middleware = createAuthMiddleware({
      type: "api-key",
      validate: validateFn,
    });

    const ctx = createMockContext({
      headers: { "x-neurolink-dev-playground": "true" },
    });
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware.handler(ctx, next);

    expect(validateFn).not.toHaveBeenCalled();
    expect(ctx.user?.id).toBe("playground");
  });
});
