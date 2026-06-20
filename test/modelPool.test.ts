/**
 * Vitest integration tests for ModelPool + RequestRouter wiring inside NeuroLink.
 *
 * Uses vi.spyOn to intercept AIProviderFactory.createProvider so no real
 * provider credentials are required.
 *
 * Run:
 *   pnpm exec vitest run test/modelPool.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AIProviderFactory } from "../src/lib/core/factory.js";
import { NeuroLink } from "../src/lib/neurolink.js";
import { ModelPool, classifyProviderError } from "../src/lib/routing/index.js";
import { createDefaultRequestRouter } from "../src/lib/routing/requestRouter.js";
import type { AIProvider } from "../src/lib/types/index.js";
import type {
  ModelPoolMember,
  RouterInputContext,
  RequestRouter,
} from "../src/lib/types/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a minimal AIProvider stub whose generate() resolves immediately. */
function makeProviderStub(
  providerName: string,
  content: string,
): Partial<AIProvider> {
  return {
    generate: vi.fn().mockResolvedValue({
      content,
      provider: providerName,
      model: "stub-model",
      usage: { inputTokens: 1, outputTokens: 1 },
      finishReason: "stop" as const,
      toolsUsed: [],
      toolExecutions: [],
    }),
    stream: vi.fn().mockReturnValue({
      stream: (async function* () {
        yield { type: "content" as const, content };
      })(),
      metadata: Promise.resolve({
        content,
        provider: providerName,
        model: "stub-model",
        finishReason: "stop" as const,
        toolsUsed: [],
        toolExecutions: [],
      }),
    }),
    setTraceContext: vi.fn(),
    setupToolExecutor: vi.fn(),
    getAllTools: vi.fn().mockResolvedValue([]),
    getCustomTools: vi.fn().mockReturnValue({}),
    setSystemPrompt: vi.fn(),
    clearHistory: vi.fn(),
    registerTool: vi.fn(),
    getTools: vi.fn().mockReturnValue([]),
  } as Partial<AIProvider>;
}

/** Minimal config for NeuroLink that disables persistence/telemetry side-effects. */
const BASE_CONFIG = {
  conversationMemory: { enabled: false },
  disableTools: true,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Shared spy lifecycle
// ─────────────────────────────────────────────────────────────────────────────

let createProviderSpy: ReturnType<
  typeof vi.spyOn<typeof AIProviderFactory, "createProvider">
>;

beforeEach(() => {
  // Restore the real implementation before each test; individual tests
  // configure their own mock behaviour.
  createProviderSpy = vi.spyOn(AIProviderFactory, "createProvider");
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Pool fallback: member#1 rate-limit → member#2 succeeds
// ─────────────────────────────────────────────────────────────────────────────

describe("ModelPool: generate() fallback", () => {
  it("falls back to member#2 when member#1 throws a rate-limit error", async () => {
    const m1: ModelPoolMember = { provider: "openai", model: "gpt-4o" };
    const m2: ModelPoolMember = {
      provider: "anthropic",
      model: "claude-haiku-3-5",
    };

    const m2Stub = makeProviderStub("anthropic", "hello-from-m2");

    // First call (openai/gpt-4o) throws a rate-limit error with no typed class
    // so isNonRetryableProviderError returns false and the pool continues.
    createProviderSpy.mockImplementation(
      async (providerName: string, _model?: string | null) => {
        if (providerName === "openai") {
          // Plain Error: no status, no typed error class → not non-retryable
          // but classifyProviderError → "rate_limit"
          throw new Error("rate limit exceeded, please retry after 60s");
        }
        return m2Stub as unknown as AIProvider;
      },
    );

    const nl = new NeuroLink({
      ...BASE_CONFIG,
      modelPool: {
        members: [m1, m2],
        strategy: "priority",
        cooldownMs: 0,
      },
    });

    const result = await nl.generate({
      input: { text: "ping" },
      disableTools: true,
    });

    expect(result.content).toBe("hello-from-m2");
    expect(result.provider).toBe("anthropic");

    // Pool should have recorded a failure on m1
    const pool = (nl as unknown as { modelPool: ModelPool }).modelPool!;
    // After the call, m1 should be in cooldown (rate_limit → cooldownMs=0 → just expired,
    // but recordFailure was called).
    // We verify indirectly: the stub for anthropic was called
    expect(m2Stub.generate).toHaveBeenCalled();
  });

  it("records failure on member#1 and success on member#2", async () => {
    const m1: ModelPoolMember = { provider: "openai", model: "gpt-4o" };
    const m2: ModelPoolMember = {
      provider: "anthropic",
      model: "claude-haiku-3-5",
    };
    const m2Stub = makeProviderStub("anthropic", "m2-ok");

    createProviderSpy.mockImplementation(async (providerName: string) => {
      if (providerName === "openai") {
        throw new Error("too many requests");
      }
      return m2Stub as unknown as AIProvider;
    });

    const nl = new NeuroLink({
      ...BASE_CONFIG,
      modelPool: {
        members: [m1, m2],
        strategy: "priority",
        cooldownMs: 30_000,
      },
    });

    await nl.generate({ input: { text: "ping" }, disableTools: true });

    // m1 should be cooled (rate_limit → cooldownMs=30s)
    const pool = (nl as unknown as { modelPool: ModelPool }).modelPool!;
    const available = pool.availableMembers();
    expect(available.some((m) => m.provider === "openai")).toBe(false);
    expect(available.some((m) => m.provider === "anthropic")).toBe(true);
  });

  it("classifies rate-limit error correctly", () => {
    const err = new Error("too many requests");
    expect(classifyProviderError(err)).toBe("rate_limit");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Auth error on member#1: non-retryable classification, pool tries member#2
// ─────────────────────────────────────────────────────────────────────────────

describe("ModelPool: auth error handling", () => {
  it("classifies plain 'unauthorized' error as auth", () => {
    const err = new Error("unauthorized: invalid api key");
    expect(classifyProviderError(err)).toBe("auth");
  });

  it("falls back to member#2 when member#1 throws a plain auth error (no status code)", async () => {
    // A plain Error with "unauthorized" in the message is classified as "auth"
    // by classifyProviderError, but isNonRetryableProviderError returns false
    // (it only checks typed error classes and HTTP status objects) — so the pool
    // does NOT short-circuit and still tries member#2.
    const m1: ModelPoolMember = { provider: "openai", model: "gpt-4o" };
    const m2: ModelPoolMember = {
      provider: "anthropic",
      model: "claude-haiku-3-5",
    };
    const m2Stub = makeProviderStub("anthropic", "auth-fallback-ok");

    createProviderSpy.mockImplementation(async (providerName: string) => {
      if (providerName === "openai") {
        // Plain Error, no `.status`, no typed class → isNonRetryableProviderError=false
        throw new Error("unauthorized: invalid api key provided");
      }
      return m2Stub as unknown as AIProvider;
    });

    const nl = new NeuroLink({
      ...BASE_CONFIG,
      modelPool: { members: [m1, m2], strategy: "priority", cooldownMs: 0 },
    });

    const result = await nl.generate({
      input: { text: "ping" },
      disableTools: true,
    });

    expect(result.content).toBe("auth-fallback-ok");
    expect(m2Stub.generate).toHaveBeenCalled();
  });

  it("records auth failure with permanent cooldown on m1", async () => {
    const m1: ModelPoolMember = { provider: "openai", model: "gpt-4o" };
    const m2: ModelPoolMember = {
      provider: "anthropic",
      model: "claude-haiku-3-5",
    };
    const m2Stub = makeProviderStub("anthropic", "ok");

    createProviderSpy.mockImplementation(async (providerName: string) => {
      if (providerName === "openai") {
        throw new Error("unauthorized access — please check your api key");
      }
      return m2Stub as unknown as AIProvider;
    });

    const nl = new NeuroLink({
      ...BASE_CONFIG,
      modelPool: { members: [m1, m2], strategy: "priority", cooldownMs: 1_000 },
    });

    await nl.generate({ input: { text: "ping" }, disableTools: true });

    // Auth failure → permanent cooldown: m1 should remain unavailable even
    // long after the cooldownMs configured on the pool.
    const pool = (nl as unknown as { modelPool: ModelPool }).modelPool!;
    const available = pool.availableMembers();
    expect(available.some((m) => m.provider === "openai")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. requestRouter rewrites provider/model only when user didn't set them
// ─────────────────────────────────────────────────────────────────────────────

describe("requestRouter integration", () => {
  it("applies router when user did not set options.provider / options.model", async () => {
    const targetStub = makeProviderStub("anthropic", "routed-response");

    // Track which provider name is passed to createProvider
    const providerNames: string[] = [];
    createProviderSpy.mockImplementation(async (providerName: string) => {
      providerNames.push(providerName);
      return targetStub as unknown as AIProvider;
    });

    const router = createDefaultRequestRouter({
      smallTier: { provider: "anthropic", model: "claude-haiku-3-5" },
      largeTier: { provider: "anthropic", model: "claude-sonnet-4-5" },
    });

    const nl = new NeuroLink({ ...BASE_CONFIG, requestRouter: router });

    await nl.generate({
      input: { text: "hello" },
      disableTools: true,
      // No explicit provider or model — router should rewrite
    });

    // The router should have been applied, resulting in anthropic being used
    expect(providerNames.length).toBeGreaterThan(0);
    expect(providerNames[0]).toBe("anthropic");
  });

  it("does NOT apply router when caller explicitly sets options.provider", async () => {
    const targetStub = makeProviderStub("openai", "explicit-provider-response");

    const providerNames: string[] = [];
    createProviderSpy.mockImplementation(async (providerName: string) => {
      providerNames.push(providerName);
      return targetStub as unknown as AIProvider;
    });

    // Router wants to route everything to vertex
    const router = createDefaultRequestRouter({
      smallTier: { provider: "vertex", model: "gemini-2.5-flash" },
      largeTier: { provider: "vertex", model: "gemini-2.5-pro" },
    });

    const nl = new NeuroLink({ ...BASE_CONFIG, requestRouter: router });

    await nl.generate({
      provider:
        "openai" as import("../src/lib/constants/enums.js").AIProviderName,
      model: "gpt-4o",
      input: { text: "hello" },
      disableTools: true,
    });

    // Router should NOT have overridden the explicit provider
    expect(providerNames.some((p) => p === "openai")).toBe(true);
    expect(providerNames.some((p) => p === "vertex")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. No modelPool / no requestRouter → existing path unchanged
// ─────────────────────────────────────────────────────────────────────────────

describe("no modelPool / no requestRouter: existing path unchanged", () => {
  it("a basic mocked generate() still works without any pool or router config", async () => {
    const stub = makeProviderStub("openai", "plain-response");

    createProviderSpy.mockResolvedValue(stub as unknown as AIProvider);

    const nl = new NeuroLink({
      ...BASE_CONFIG,
      // No modelPool, no requestRouter
    });

    const result = await nl.generate({
      provider:
        "openai" as import("../src/lib/constants/enums.js").AIProviderName,
      model: "gpt-4o",
      input: { text: "hello" },
      disableTools: true,
    });

    expect(result.content).toBe("plain-response");
  });

  it("modelPool is null when not configured", () => {
    const nl = new NeuroLink({ ...BASE_CONFIG });
    const pool = (nl as unknown as { modelPool: ModelPool | null }).modelPool;
    expect(pool).toBeNull();
  });

  it("requestRouter is null when not configured", () => {
    const nl = new NeuroLink({ ...BASE_CONFIG });
    const router = (nl as unknown as { requestRouter: unknown }).requestRouter;
    expect(router).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ModelPool unit-level integration with NeuroLink constructor
// ─────────────────────────────────────────────────────────────────────────────

describe("ModelPool constructor integration", () => {
  it("constructs a ModelPool instance from config", () => {
    const nl = new NeuroLink({
      ...BASE_CONFIG,
      modelPool: {
        members: [
          { provider: "openai", model: "gpt-4o" },
          { provider: "anthropic", model: "claude-haiku-3-5" },
        ],
        strategy: "round-robin",
        cooldownMs: 5_000,
      },
    });

    const pool = (nl as unknown as { modelPool: ModelPool | null }).modelPool;
    expect(pool).not.toBeNull();
    expect(pool!.availableMembers()).toHaveLength(2);
    expect(pool!.maxAttempts).toBe(2);
  });

  it("requestRouter instance is stored when provided", () => {
    const router = createDefaultRequestRouter({
      smallTier: { provider: "anthropic", model: "claude-haiku-3-5" },
    });

    const nl = new NeuroLink({ ...BASE_CONFIG, requestRouter: router });
    const storedRouter = (nl as unknown as { requestRouter: unknown })
      .requestRouter;
    expect(storedRouter).toBe(router);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. RouterInputContext satisfaction
// ─────────────────────────────────────────────────────────────────────────────

describe("createDefaultRequestRouter context routing", () => {
  it("routes vision context to visionTier", async () => {
    const router = createDefaultRequestRouter({
      visionTier: { provider: "vertex", model: "gemini-2.5-flash" },
      largeTier: { provider: "anthropic", model: "claude-sonnet-4-5" },
      smallTier: { provider: "anthropic", model: "claude-haiku-3-5" },
    });

    const ctx: RouterInputContext = {
      prompt: "describe image",
      requiresVision: true,
    };
    const decision = await router(ctx);
    expect(decision.provider).toBe("vertex");
    expect(decision.model).toBe("gemini-2.5-flash");
  });

  it("returns empty decision ({}) for tiny prompt with no smallTier configured", async () => {
    const router = createDefaultRequestRouter({
      largeTier: { provider: "anthropic", model: "claude-sonnet-4-5" },
    });

    const ctx: RouterInputContext = {
      prompt: "hi",
      estimatedInputTokens: 2,
    };
    const decision = await router(ctx);
    expect(decision.provider).toBeUndefined();
    expect(decision.model).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Stream pool fallback (HIGH — createMCPStream pool path was uncovered)
// ─────────────────────────────────────────────────────────────────────────────

describe("ModelPool: stream() fallback", () => {
  it("falls back to member#2 when member#1's provider creation throws a retryable error", async () => {
    // member#1 uses a non-default provider so the initial getBestProvider()
    // provider creation inside createMCPStream (which runs before the pool
    // loop) is never the failing one regardless of env defaults.
    const m1: ModelPoolMember = { provider: "mistral", model: "mistral-large" };
    const m2: ModelPoolMember = {
      provider: "anthropic",
      model: "claude-haiku-3-5",
    };
    const m2Stub = makeProviderStub("anthropic", "hello-from-m2-stream");
    const fallbackStub = makeProviderStub("openai", "init-stub");

    const providerNames: string[] = [];
    createProviderSpy.mockImplementation(async (providerName: string) => {
      providerNames.push(providerName);
      if (providerName === "mistral") {
        throw new Error("rate limit exceeded, please retry after 60s");
      }
      if (providerName === "anthropic") {
        return m2Stub as unknown as AIProvider;
      }
      return fallbackStub as unknown as AIProvider;
    });

    const nl = new NeuroLink({
      ...BASE_CONFIG,
      modelPool: { members: [m1, m2], strategy: "priority", cooldownMs: 0 },
    });

    const result = await nl.stream({
      input: { text: "ping" },
      disableTools: true,
    });

    // Consume the stream so the wrapping async generator records success.
    const chunks: unknown[] = [];
    for await (const chunk of result.stream) {
      chunks.push(chunk);
    }

    expect(result.provider).toBe("anthropic");
    expect(m2Stub.stream).toHaveBeenCalled();
    expect(providerNames).toContain("mistral");
    expect(providerNames).toContain("anthropic");
    expect(JSON.stringify(chunks)).toContain("hello-from-m2-stream");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Non-retryable short-circuit (HIGH — typed/HTTP-status branch was bypassed)
// ─────────────────────────────────────────────────────────────────────────────

describe("ModelPool: non-retryable short-circuit (generate)", () => {
  it("stops the pool and rejects when member#1 throws HTTP 401; member#2 is never attempted", async () => {
    const m1: ModelPoolMember = { provider: "openai", model: "gpt-4o" };
    const m2: ModelPoolMember = {
      provider: "anthropic",
      model: "claude-haiku-3-5",
    };
    const m2Stub = makeProviderStub("anthropic", "should-never-be-used");

    const providerNames: string[] = [];
    createProviderSpy.mockImplementation(async (providerName: string) => {
      providerNames.push(providerName);
      if (providerName === "openai") {
        // status 401 → isNonRetryableProviderError → pool short-circuits.
        throw Object.assign(new Error("Unauthorized"), { status: 401 });
      }
      return m2Stub as unknown as AIProvider;
    });

    const nl = new NeuroLink({
      ...BASE_CONFIG,
      modelPool: { members: [m1, m2], strategy: "priority", cooldownMs: 0 },
    });

    await expect(
      nl.generate({ input: { text: "ping" }, disableTools: true }),
    ).rejects.toThrow();

    // member#2 must never be attempted on a non-retryable error.
    expect(providerNames).toContain("openai");
    expect(providerNames).not.toContain("anthropic");
    expect(m2Stub.generate).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Pool exhaustion (MEDIUM — all members fail → generate rejects)
// ─────────────────────────────────────────────────────────────────────────────

describe("ModelPool: exhaustion (generate)", () => {
  it("rejects and cools every member when all fail with a retryable error", async () => {
    const m1: ModelPoolMember = { provider: "openai", model: "gpt-4o" };
    const m2: ModelPoolMember = {
      provider: "anthropic",
      model: "claude-haiku-3-5",
    };

    createProviderSpy.mockImplementation(async () => {
      throw new Error("too many requests");
    });

    const nl = new NeuroLink({
      ...BASE_CONFIG,
      modelPool: {
        members: [m1, m2],
        strategy: "priority",
        cooldownMs: 30_000,
      },
    });

    await expect(
      nl.generate({ input: { text: "ping" }, disableTools: true }),
    ).rejects.toThrow(/ModelPool/);

    // Both members are cooled (rate_limit → 30s cooldown), so none available.
    const pool = (nl as unknown as { modelPool: ModelPool }).modelPool;
    expect(pool.availableMembers()).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. requestRouter fails open (MEDIUM — router throw must not abort the call)
// ─────────────────────────────────────────────────────────────────────────────

describe("requestRouter fails open", () => {
  it("proceeds with the call (unrouted) when the router itself throws", async () => {
    const stub = makeProviderStub("openai", "fail-open-ok");
    createProviderSpy.mockResolvedValue(stub as unknown as AIProvider);

    const throwingRouter: RequestRouter = () => {
      throw new Error("router exploded");
    };

    const nl = new NeuroLink({
      ...BASE_CONFIG,
      requestRouter: throwingRouter,
    });

    // No explicit provider/model so the router is actually invoked (and throws).
    const result = await nl.generate({
      input: { text: "hello" },
      disableTools: true,
    });

    expect(result.content).toBe("fail-open-ok");
  });
});
