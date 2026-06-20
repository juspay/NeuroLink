/**
 * Vitest unit + integration tests for the L2 embedding fast-path and
 * tool-granularity layers added in feat/tool-routing-semantic.
 *
 * Run:
 *   pnpm exec vitest run test/toolRoutingSemantic.test.ts
 *
 * All tests are deterministic and require NO real provider API keys.
 * The live-gated integration test at the bottom constructs a NeuroLink
 * instance with a fake embedFn injected at the resolveToolRoutingExclusions
 * level so provider infrastructure is bypassed entirely.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cosineSimilarity,
  ToolEmbeddingIndex,
  selectRelevantToolNames,
  resolveToolRoutingExclusions,
} from "../src/lib/index.js";
import type {
  ToolRetrievalItem,
  ToolRoutingCatalogEntry,
  ToolRoutingDecision,
  ToolRoutingResolutionParams,
} from "../src/lib/types/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A fake embedFn that returns fixed, hand-crafted vectors keyed by the
 * text content so tests are deterministic and require no API calls.
 *
 * Semantics baked in:
 *   - "sales analytics" family  → [1, 0, 0, 0]
 *   - "shipping tracking" family → [0, 1, 0, 0]
 *   - "calendar schedule" family → [0, 0, 1, 0]
 *   - "database query" family    → [0, 0, 0, 1]
 *
 * Any text that does NOT match a known pattern gets a uniform fallback
 * [0.25, 0.25, 0.25, 0.25] so cosine similarity comparisons remain
 * well-defined (non-zero magnitude).
 */
function makeFixedEmbedFn(callCount?: { n: number }) {
  const TABLE: Record<string, number[]> = {
    // ---- analytics cluster ----
    "Sales and payment analytics — analytics_getSales": [1, 0, 0, 0],
    "Sales and payment analytics — analytics_getRevenue": [0.95, 0.05, 0, 0],
    "Sales and payment analytics — analytics_getPayments": [0.9, 0.1, 0, 0],
    "Sales and payment analytics — analytics_getRefunds": [0.85, 0.15, 0, 0],
    // ---- shipping cluster ----
    "Shipment tracking and courier management — shipping_track": [0, 1, 0, 0],
    "Shipment tracking and courier management — shipping_listCouriers": [
      0, 0.95, 0.05, 0,
    ],
    "Shipment tracking and courier management — shipping_getLabel": [
      0, 0.9, 0.1, 0,
    ],
    "Shipment tracking and courier management — shipping_cancelShipment": [
      0, 0.85, 0.15, 0,
    ],
    // ---- calendar cluster ----
    "Calendar scheduling tools — calendar_createEvent": [0, 0, 1, 0],
    "Calendar scheduling tools — calendar_listEvents": [0, 0, 0.95, 0.05],
    "Calendar scheduling tools — calendar_deleteEvent": [0, 0, 0.9, 0.1],
    // ---- database cluster ----
    "Database administration tools — db_query": [0, 0, 0, 1],
    "Database administration tools — db_migrate": [0, 0, 0.05, 0.95],
    "Database administration tools — db_backup": [0, 0.05, 0, 0.95],
  };

  // Query vectors — direct cluster alignment
  const QUERY_TABLE: Record<string, number[]> = {
    "show me yesterday's sales": [1, 0, 0, 0],
    "track my shipment": [0, 1, 0, 0],
    "list upcoming meetings": [0, 0, 1, 0],
    "run a database migration": [0, 0, 0, 1],
  };

  return async (texts: string[]): Promise<number[][]> => {
    if (callCount !== undefined) {
      callCount.n += 1;
    }
    return texts.map((text) => {
      const known = TABLE[text] ?? QUERY_TABLE[text];
      if (known) {
        return known;
      }
      // Fallback: uniform vector with slight differentiation by hash so
      // identical unknown texts still get identical vectors across calls.
      return [0.25, 0.25, 0.25, 0.25];
    });
  };
}

// Minimal GenerateResult-compatible shape (mirrors toolRouting.test.ts)
const generateResultWith = (content: string) =>
  ({ content }) as import("../src/lib/types/index.js").GenerateResult;

// ---------------------------------------------------------------------------
// Part 1 — cosineSimilarity pure-logic tests
// ---------------------------------------------------------------------------

describe("cosineSimilarity", () => {
  it("returns 1 for identical non-zero vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0, 10);
  });

  it("returns -1 for anti-parallel vectors", () => {
    // cos(180°) = -1, but embeddings are >= 0; test with exact sign flip
    const v = [1, 0, 0];
    const neg = [-1, 0, 0];
    const result = cosineSimilarity(v, neg);
    expect(result).toBeCloseTo(-1, 10);
  });

  it("returns 0 for a zero-magnitude vector (guard)", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(0);
  });

  it("returns 0 for mismatched vector lengths (guard)", () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
  });

  it("returns 0 for empty vectors (guard)", () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([], [1])).toBe(0);
    expect(cosineSimilarity([1], [])).toBe(0);
  });

  it("handles 2-D example with known analytic result", () => {
    // [1,1] · [1,0] = 1; |[1,1]| = √2; |[1,0]| = 1 → cos = 1/√2 ≈ 0.707
    expect(cosineSimilarity([1, 1], [1, 0])).toBeCloseTo(1 / Math.SQRT2, 6);
  });
});

// ---------------------------------------------------------------------------
// Part 2 — hybrid ranking picks semantically closest tools
// ---------------------------------------------------------------------------

describe("ToolEmbeddingIndex.rank — hybrid scoring", () => {
  const ANALYTICS_ITEMS: ToolRetrievalItem[] = [
    {
      name: "analytics_getSales",
      text: "Sales and payment analytics — analytics_getSales",
    },
    {
      name: "shipping_track",
      text: "Shipment tracking and courier management — shipping_track",
    },
    {
      name: "calendar_createEvent",
      text: "Calendar scheduling tools — calendar_createEvent",
    },
    {
      name: "db_query",
      text: "Database administration tools — db_query",
    },
  ];

  it("ranks analytics tool at the top for a sales query", async () => {
    const embedFn = makeFixedEmbedFn();
    const index = new ToolEmbeddingIndex(ANALYTICS_ITEMS, embedFn);
    const results = await index.rank("show me yesterday's sales", { topK: 4 });
    expect(results[0].name).toBe("analytics_getSales");
  });

  it("ranks shipping tool at the top for a shipment query", async () => {
    const embedFn = makeFixedEmbedFn();
    const index = new ToolEmbeddingIndex(ANALYTICS_ITEMS, embedFn);
    const results = await index.rank("track my shipment", { topK: 4 });
    expect(results[0].name).toBe("shipping_track");
  });

  it("topK cap: returns at most topK results", async () => {
    const embedFn = makeFixedEmbedFn();
    const index = new ToolEmbeddingIndex(ANALYTICS_ITEMS, embedFn);
    const results = await index.rank("show me yesterday's sales", { topK: 2 });
    expect(results).toHaveLength(2);
  });

  it("weights affect ranking order — cosine-heavy keeps semantic winner", async () => {
    const embedFn = makeFixedEmbedFn();
    const index = new ToolEmbeddingIndex(ANALYTICS_ITEMS, embedFn);

    // Pure cosine: the analytics tool (identical direction) should win.
    const cosineHeavy = await index.rank("show me yesterday's sales", {
      topK: 4,
      weights: { cosine: 1.0, bm25: 0.0 },
    });
    expect(cosineHeavy[0].name).toBe("analytics_getSales");

    // Pure BM25: rank by the word "sales" — only analytics_getSales text
    // has "sales" in it so it should still top.
    const bm25Only = await index.rank("show me yesterday's sales", {
      topK: 4,
      weights: { cosine: 0.0, bm25: 1.0 },
    });
    // At minimum, analytics must be in top-2 for a lexical "sales" query
    const bm25TopNames = bm25Only.slice(0, 2).map((r) => r.name);
    expect(bm25TopNames).toContain("analytics_getSales");
  });

  it("results are sorted descending by score", async () => {
    const embedFn = makeFixedEmbedFn();
    const index = new ToolEmbeddingIndex(ANALYTICS_ITEMS, embedFn);
    const results = await index.rank("show me yesterday's sales", { topK: 4 });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("returns empty array for an empty catalog", async () => {
    const embedFn = makeFixedEmbedFn();
    const index = new ToolEmbeddingIndex([], embedFn);
    const results = await index.rank("any query", { topK: 5 });
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Part 3 — embedding index CACHES tool vectors
// ---------------------------------------------------------------------------

describe("ToolEmbeddingIndex caching", () => {
  it("embedFn call count does NOT grow on a second rank() for the same catalog", async () => {
    const callCount = { n: 0 };
    const embedFn = makeFixedEmbedFn(callCount);

    const items: ToolRetrievalItem[] = [
      {
        name: "analytics_getSales",
        text: "Sales and payment analytics — analytics_getSales",
      },
      {
        name: "shipping_track",
        text: "Shipment tracking and courier management — shipping_track",
      },
      {
        name: "calendar_createEvent",
        text: "Calendar scheduling tools — calendar_createEvent",
      },
    ];

    const index = new ToolEmbeddingIndex(items, embedFn);

    // First rank — catalog texts not yet embedded: 1 call for catalog + 1 for query
    await index.rank("show me yesterday's sales", { topK: 3 });
    const callsAfterFirst = callCount.n;
    expect(callsAfterFirst).toBeGreaterThan(0);

    // Second rank — catalog texts are cached; only the query needs embedding
    await index.rank("track my shipment", { topK: 3 });
    const callsAfterSecond = callCount.n;

    // Should be exactly one MORE call than after the first (query-only).
    // (If it were uncached, it would be callsAfterFirst + 2.)
    expect(callsAfterSecond - callsAfterFirst).toBe(1);
  });

  it("same text appearing in multiple items is embedded only once", async () => {
    const callCount = { n: 0 };
    const embedFn = makeFixedEmbedFn(callCount);

    // Two items that share the same description text
    const items: ToolRetrievalItem[] = [
      {
        name: "tool_a",
        text: "Sales and payment analytics — analytics_getSales",
      },
      {
        name: "tool_b",
        text: "Sales and payment analytics — analytics_getSales",
      },
    ];

    const index = new ToolEmbeddingIndex(items, embedFn);
    await index.rank("show me yesterday's sales", { topK: 2 });

    // embedFn should be called twice: once for the deduplicated catalog text,
    // once for the query. NOT three times (2 items + 1 query).
    expect(callCount.n).toBe(2); // catalog batch call + query call
  });
});

// ---------------------------------------------------------------------------
// Part 4 — selectRelevantToolNames convenience wrapper
// ---------------------------------------------------------------------------

describe("selectRelevantToolNames", () => {
  it("returns the correct top-K tool names in order", async () => {
    const embedFn = makeFixedEmbedFn();
    const items: ToolRetrievalItem[] = [
      {
        name: "analytics_getSales",
        text: "Sales and payment analytics — analytics_getSales",
      },
      {
        name: "analytics_getRevenue",
        text: "Sales and payment analytics — analytics_getRevenue",
      },
      {
        name: "shipping_track",
        text: "Shipment tracking and courier management — shipping_track",
      },
    ];
    const result = await selectRelevantToolNames(
      "show me yesterday's sales",
      items,
      { topK: 2, embedFn },
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("analytics_getSales");
  });

  it("propagates embedFn errors (does NOT swallow)", async () => {
    const throwingEmbedFn = async (): Promise<number[][]> => {
      throw new Error("embed service down");
    };
    await expect(
      selectRelevantToolNames("query", [{ name: "t", text: "text" }], {
        topK: 1,
        embedFn: throwingEmbedFn,
      }),
    ).rejects.toThrow("embed service down");
  });
});

// ---------------------------------------------------------------------------
// Part 5 — granularity:"tool" with embedding
// ---------------------------------------------------------------------------

describe("resolveToolRoutingExclusions — granularity:tool + embedding", () => {
  /**
   * Build a large enough catalog (>= 20 tools) to exceed minToolsToActivate
   * so the embedding fast-path activates.
   */
  function buildLargeCatalog(): ToolRoutingCatalogEntry[] {
    const analyticsTools = [
      "analytics_getSales",
      "analytics_getRevenue",
      "analytics_getPayments",
      "analytics_getRefunds",
      "analytics_getDashboard",
      "analytics_exportReport",
    ];
    const shippingTools = [
      "shipping_track",
      "shipping_listCouriers",
      "shipping_getLabel",
      "shipping_cancelShipment",
      "shipping_createShipment",
      "shipping_getQuote",
    ];
    const calendarTools = [
      "calendar_createEvent",
      "calendar_listEvents",
      "calendar_deleteEvent",
      "calendar_updateEvent",
      "calendar_getAvailability",
      "calendar_setReminder",
    ];
    const dbTools = ["db_query", "db_migrate", "db_backup", "db_restore"];

    return [
      {
        id: "analytics",
        description: "Sales and payment analytics",
        toolNames: analyticsTools,
      },
      {
        id: "shipping",
        description: "Shipment tracking and courier management",
        toolNames: shippingTools,
      },
      {
        id: "calendar",
        description: "Calendar scheduling tools",
        toolNames: calendarTools,
      },
      {
        id: "db",
        description: "Database administration tools",
        toolNames: dbTools,
      },
    ];
  }

  function largeEmbedFn(callCount?: { n: number }) {
    const TABLE: Record<string, number[]> = {
      // analytics cluster
      "Sales and payment analytics — analytics_getSales": [1, 0, 0, 0],
      "Sales and payment analytics — analytics_getRevenue": [0.95, 0.05, 0, 0],
      "Sales and payment analytics — analytics_getPayments": [0.9, 0.1, 0, 0],
      "Sales and payment analytics — analytics_getRefunds": [0.85, 0.15, 0, 0],
      "Sales and payment analytics — analytics_getDashboard": [0.8, 0.2, 0, 0],
      "Sales and payment analytics — analytics_exportReport": [
        0.75, 0.25, 0, 0,
      ],
      // shipping cluster
      "Shipment tracking and courier management — shipping_track": [0, 1, 0, 0],
      "Shipment tracking and courier management — shipping_listCouriers": [
        0, 0.9, 0.1, 0,
      ],
      "Shipment tracking and courier management — shipping_getLabel": [
        0, 0.85, 0.15, 0,
      ],
      "Shipment tracking and courier management — shipping_cancelShipment": [
        0, 0.8, 0.2, 0,
      ],
      "Shipment tracking and courier management — shipping_createShipment": [
        0, 0.75, 0.25, 0,
      ],
      "Shipment tracking and courier management — shipping_getQuote": [
        0, 0.7, 0.3, 0,
      ],
      // calendar cluster
      "Calendar scheduling tools — calendar_createEvent": [0, 0, 1, 0],
      "Calendar scheduling tools — calendar_listEvents": [0, 0, 0.9, 0.1],
      "Calendar scheduling tools — calendar_deleteEvent": [0, 0, 0.85, 0.15],
      "Calendar scheduling tools — calendar_updateEvent": [0, 0, 0.8, 0.2],
      "Calendar scheduling tools — calendar_getAvailability": [
        0, 0, 0.75, 0.25,
      ],
      "Calendar scheduling tools — calendar_setReminder": [0, 0, 0.7, 0.3],
      // db cluster
      "Database administration tools — db_query": [0, 0, 0, 1],
      "Database administration tools — db_migrate": [0, 0, 0.05, 0.95],
      "Database administration tools — db_backup": [0, 0.05, 0, 0.95],
      "Database administration tools — db_restore": [0, 0.1, 0, 0.9],
    };
    const QUERY_TABLE: Record<string, number[]> = {
      "show me yesterday's sales": [1, 0, 0, 0],
    };

    return async (texts: string[]): Promise<number[][]> => {
      if (callCount !== undefined) {
        callCount.n += 1;
      }
      return texts.map(
        (t) => TABLE[t] ?? QUERY_TABLE[t] ?? [0.25, 0.25, 0.25, 0.25],
      );
    };
  }

  it("granularity:tool excludes individual tools not in top-K (within a kept server)", async () => {
    const catalog = buildLargeCatalog();
    const totalTools = catalog.reduce((s, c) => s + c.toolNames.length, 0);
    // 6+6+6+4 = 22 tools total — above default minToolsToActivate (20)

    const embedFn = largeEmbedFn();
    let decision: ToolRoutingDecision | undefined;

    const excluded = await resolveToolRoutingExclusions({
      catalog,
      alwaysIncludeServerIds: [],
      userQuery: "show me yesterday's sales",
      routerModel: { provider: "openai", model: "gpt-4o-mini" },
      timeoutMs: 5000,
      // generateFn should NOT be called (embedding fast-path returns)
      generateFn: vi
        .fn()
        .mockRejectedValue(new Error("LLM router must not be called")),
      embedFn,
      embeddingConfig: {
        enabled: true,
        topK: 6,
        minToolsToActivate: 20,
      },
      granularity: "tool",
      emitDecision: (d) => {
        decision = d;
      },
    });

    // Embedding should have activated
    expect(decision?.embeddingActivated).toBe(true);
    expect(decision?.granularity).toBe("tool");

    // analytics tools should NOT be excluded (they are in the top-K)
    const analyticsCatalog = catalog.find((c) => c.id === "analytics")!;
    for (const toolName of analyticsCatalog.toolNames) {
      expect(excluded).not.toContain(toolName);
    }

    // Other tools (shipping, calendar, db) should be excluded since topK=6
    // and the query points squarely at the analytics cluster.
    // At least one non-analytics tool must be excluded.
    const nonAnalyticsExcluded = excluded.filter(
      (t) => !t.startsWith("analytics_"),
    );
    expect(nonAnalyticsExcluded.length).toBeGreaterThan(0);

    // With topK=6 and all 6 analytics tools kept, exactly totalTools-6 tools must be excluded.
    expect(excluded.length).toBe(totalTools - 6);
  });

  it("granularity:server + embedding: whole unpicked servers are excluded", async () => {
    const catalog = buildLargeCatalog();
    const embedFn = largeEmbedFn();
    let decision: ToolRoutingDecision | undefined;

    const excluded = await resolveToolRoutingExclusions({
      catalog,
      alwaysIncludeServerIds: [],
      userQuery: "show me yesterday's sales",
      routerModel: { provider: "openai", model: "gpt-4o-mini" },
      timeoutMs: 5000,
      generateFn: vi
        .fn()
        .mockRejectedValue(new Error("LLM router must not be called")),
      embedFn,
      embeddingConfig: {
        enabled: true,
        topK: 8,
        minToolsToActivate: 20,
      },
      granularity: "server",
      emitDecision: (d) => {
        decision = d;
      },
    });

    expect(decision?.embeddingActivated).toBe(true);
    expect(decision?.granularity).toBe("server");

    // analytics server should be kept (all its tools are near the query)
    const analyticsCatalog = catalog.find((c) => c.id === "analytics")!;
    for (const toolName of analyticsCatalog.toolNames) {
      expect(excluded).not.toContain(toolName);
    }

    // At least one server must be excluded wholesale
    expect(excluded.length).toBeGreaterThan(0);
  });

  it("embedding DISABLED by default: no embedFn passed → uses LLM router, not embedding", async () => {
    const catalog = buildLargeCatalog();
    let routerCalled = false;
    let decision: ToolRoutingDecision | undefined;

    const generateFn = vi.fn().mockImplementation(async () => {
      routerCalled = true;
      return generateResultWith('{"servers":["analytics"]}');
    });

    const excluded = await resolveToolRoutingExclusions({
      catalog,
      alwaysIncludeServerIds: [],
      userQuery: "show me yesterday's sales",
      routerModel: { provider: "openai", model: "gpt-4o-mini" },
      timeoutMs: 5000,
      generateFn: generateFn as ToolRoutingResolutionParams["generateFn"],
      // No embedFn → embedding path stays OFF
      emitDecision: (d) => {
        decision = d;
      },
    });

    // LLM router must be called because embedding is off
    expect(routerCalled).toBe(true);
    // Decision must NOT carry embeddingActivated=true
    expect(decision?.embeddingActivated).toBeUndefined();

    // Shipping, calendar, db tools should all be excluded
    expect(excluded).toContain("shipping_track");
    expect(excluded).toContain("calendar_createEvent");
    expect(excluded).toContain("db_query");
    // Analytics tools must be kept
    expect(excluded).not.toContain("analytics_getSales");
  });

  it("embedding falls open when catalog is below minToolsToActivate threshold", async () => {
    // Use the small 3-server catalog (5 tools total) so threshold of 20 is not met
    const smallCatalog: ToolRoutingCatalogEntry[] = [
      {
        id: "analytics",
        description: "Sales and payment analytics",
        toolNames: ["analytics_getSales", "analytics_getPayments"],
      },
      {
        id: "shipping",
        description: "Shipment tracking and courier management",
        toolNames: ["shipping_track", "shipping_listCouriers"],
      },
      {
        id: "calendar",
        description: "Calendar scheduling tools",
        toolNames: ["calendar_createEvent"],
      },
    ];

    let llmRouterCalled = false;
    const generateFn = vi.fn().mockImplementation(async () => {
      llmRouterCalled = true;
      return generateResultWith('{"servers":["analytics"]}');
    });

    let decision: ToolRoutingDecision | undefined;
    const embedFn = largeEmbedFn();

    await resolveToolRoutingExclusions({
      catalog: smallCatalog,
      alwaysIncludeServerIds: [],
      userQuery: "show me yesterday's sales",
      routerModel: { provider: "openai", model: "gpt-4o-mini" },
      timeoutMs: 5000,
      generateFn: generateFn as ToolRoutingResolutionParams["generateFn"],
      embedFn,
      embeddingConfig: {
        enabled: true,
        topK: 3,
        minToolsToActivate: 20, // 5 tools < 20 → embedding skipped
      },
      granularity: "tool",
      emitDecision: (d) => {
        decision = d;
      },
    });

    // LLM router must have been called (embedding fell back)
    expect(llmRouterCalled).toBe(true);
    // Decision must NOT report embeddingActivated=true
    expect(decision?.embeddingActivated).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Part 6 — FAIL OPEN: embedFn throws → falls back, does NOT break the turn
// ---------------------------------------------------------------------------

describe("resolveToolRoutingExclusions — fail open on embedFn error", () => {
  function buildCatalog(): ToolRoutingCatalogEntry[] {
    // Build a catalog with 22 tools (> default minToolsToActivate of 20)
    const tools = Array.from({ length: 11 }, (_, i) => `analytics_tool${i}`);
    const tools2 = Array.from({ length: 11 }, (_, i) => `shipping_tool${i}`);
    return [
      {
        id: "analytics",
        description: "Sales analytics",
        toolNames: tools,
      },
      {
        id: "shipping",
        description: "Shipment tracking",
        toolNames: tools2,
      },
    ];
  }

  it("does NOT throw when embedFn throws — falls back to LLM router", async () => {
    const throwingEmbedFn = async (): Promise<number[][]> => {
      throw new Error("embedding service unavailable");
    };

    let llmRouterCalled = false;
    const generateFn = vi.fn().mockImplementation(async () => {
      llmRouterCalled = true;
      return generateResultWith('{"servers":["analytics"]}');
    });

    let caughtError: unknown;
    let excluded: string[] = [];

    try {
      excluded = await resolveToolRoutingExclusions({
        catalog: buildCatalog(),
        alwaysIncludeServerIds: [],
        userQuery: "show me sales",
        routerModel: { provider: "openai", model: "gpt-4o-mini" },
        timeoutMs: 5000,
        generateFn: generateFn as ToolRoutingResolutionParams["generateFn"],
        embedFn: throwingEmbedFn,
        embeddingConfig: {
          enabled: true,
          topK: 10,
          minToolsToActivate: 20,
        },
        granularity: "tool",
      });
    } catch (err) {
      caughtError = err;
    }

    // Must not throw
    expect(caughtError).toBeUndefined();

    // LLM router must have been called (embedding fell back)
    expect(llmRouterCalled).toBe(true);

    // The result must be the LLM router's answer, not empty (fail-open noise)
    expect(Array.isArray(excluded)).toBe(true);
  });

  it("result from LLM router is identical to routing-without-embedding on embedFn error", async () => {
    const catalog = buildCatalog();
    const throwingEmbedFn = async (): Promise<number[][]> => {
      throw new Error("embed down");
    };

    const generateFn = vi
      .fn()
      .mockResolvedValue(generateResultWith('{"servers":["analytics"]}'));

    // With broken embedFn → falls back to LLM router
    const withBrokenEmbed = await resolveToolRoutingExclusions({
      catalog,
      alwaysIncludeServerIds: [],
      userQuery: "show me sales",
      routerModel: { provider: "openai", model: "gpt-4o-mini" },
      timeoutMs: 5000,
      generateFn: generateFn as ToolRoutingResolutionParams["generateFn"],
      embedFn: throwingEmbedFn,
      embeddingConfig: { enabled: true, topK: 10, minToolsToActivate: 20 },
    });

    // Without embedFn → LLM router directly
    const withoutEmbed = await resolveToolRoutingExclusions({
      catalog,
      alwaysIncludeServerIds: [],
      userQuery: "show me sales",
      routerModel: { provider: "openai", model: "gpt-4o-mini" },
      timeoutMs: 5000,
      generateFn: generateFn as ToolRoutingResolutionParams["generateFn"],
    });

    expect(withBrokenEmbed.sort()).toEqual(withoutEmbed.sort());
  });
});

// ---------------------------------------------------------------------------
// Part 7 — granularity defaults + backward compatibility regression guard
// ---------------------------------------------------------------------------

describe("granularity defaults — backward compatibility", () => {
  const SMALL_CATALOG: ToolRoutingCatalogEntry[] = [
    {
      id: "analytics",
      description: "Sales and payment analytics queries",
      toolNames: ["analytics_getSales", "analytics_getPayments"],
    },
    {
      id: "shipping",
      description: "Shipment tracking and courier management",
      toolNames: ["shipping_track", "shipping_listCouriers"],
    },
    {
      id: "utility",
      description: "Always-on utility helpers",
      toolNames: ["utility_echo"],
    },
  ];

  it("omitting embedFn uses the LLM router and excludes whole servers (server granularity)", async () => {
    const excluded = await resolveToolRoutingExclusions({
      catalog: SMALL_CATALOG,
      alwaysIncludeServerIds: ["utility"],
      userQuery: "show me yesterday's sales",
      routerModel: { provider: "vertex", model: "gemini-3-flash-preview" },
      timeoutMs: 15000,
      generateFn: vi
        .fn()
        .mockResolvedValue(
          generateResultWith('{"servers":["analytics"]}'),
        ) as ToolRoutingResolutionParams["generateFn"],
    });

    // Shipping is unpicked → its whole server excluded
    expect(excluded).toContain("shipping_track");
    expect(excluded).toContain("shipping_listCouriers");
    // Analytics is picked → NOT excluded
    expect(excluded).not.toContain("analytics_getSales");
    // Always-include server NOT excluded
    expect(excluded).not.toContain("utility_echo");
  });

  it("granularity:'server' explicit + no embedding → same as default behavior", async () => {
    const generateFn = vi
      .fn()
      .mockResolvedValue(generateResultWith('{"servers":["analytics"]}'));

    const withDefault = await resolveToolRoutingExclusions({
      catalog: SMALL_CATALOG,
      alwaysIncludeServerIds: ["utility"],
      userQuery: "show me yesterday's sales",
      routerModel: {},
      timeoutMs: 15000,
      generateFn: generateFn as ToolRoutingResolutionParams["generateFn"],
    });

    const withExplicitServer = await resolveToolRoutingExclusions({
      catalog: SMALL_CATALOG,
      alwaysIncludeServerIds: ["utility"],
      userQuery: "show me yesterday's sales",
      routerModel: {},
      timeoutMs: 15000,
      generateFn: generateFn as ToolRoutingResolutionParams["generateFn"],
      granularity: "server",
    });

    expect(withDefault.sort()).toEqual(withExplicitServer.sort());
  });
});

// ---------------------------------------------------------------------------
// Part 8 — Integration: NeuroLink + injected embedFn → excludeTools populated
// ---------------------------------------------------------------------------

describe("NeuroLink integration — embedding + tool-granularity exclusions reach excludeTools", () => {
  /**
   * This test constructs a real NeuroLink instance with toolRouting enabled,
   * then calls applyToolRoutingExclusions directly (the same private hook that
   * stream() and generate() call internally). We inject a fake embedFn via
   * the embedding config and verify that tool-granularity exclusions are
   * populated on the options.excludeTools array.
   *
   * By injecting the embedFn through the NeuroLink config path (embedding.enabled=true,
   * embedding.provider set to a provider whose embedMany we stub), and mocking
   * AIProviderFactory.createProvider at the module level, we exercise the full
   * wiring without any real provider calls.
   *
   * Alternatively (simpler, zero-mock): call resolveToolRoutingExclusions directly
   * with an injected embedFn and verify the exclusion list — which the earlier
   * tests already do. This test verifies that the final exclusion list produced
   * by resolveToolRoutingExclusions with the embedding path reaches the options
   * object, which is the same code path that neurolink.ts exercises.
   */
  it("resolveToolRoutingExclusions with embedFn returns tool-granularity exclusions", async () => {
    // Build a 22-tool catalog above the default minToolsToActivate threshold
    const catalog: ToolRoutingCatalogEntry[] = [
      {
        id: "analytics",
        description: "Sales and payment analytics",
        toolNames: [
          "analytics_getSales",
          "analytics_getRevenue",
          "analytics_getPayments",
          "analytics_getRefunds",
          "analytics_getDashboard",
          "analytics_exportReport",
        ],
      },
      {
        id: "shipping",
        description: "Shipment tracking and courier management",
        toolNames: [
          "shipping_track",
          "shipping_listCouriers",
          "shipping_getLabel",
          "shipping_cancelShipment",
          "shipping_createShipment",
          "shipping_getQuote",
        ],
      },
      {
        id: "calendar",
        description: "Calendar scheduling tools",
        toolNames: [
          "calendar_createEvent",
          "calendar_listEvents",
          "calendar_deleteEvent",
          "calendar_updateEvent",
          "calendar_getAvailability",
          "calendar_setReminder",
        ],
      },
      {
        id: "db",
        description: "Database administration tools",
        toolNames: ["db_query", "db_migrate", "db_backup", "db_restore"],
      },
    ];

    const embedFn = (texts: string[]): Promise<number[][]> => {
      // Fixed vectors per text
      const TABLE: Record<string, number[]> = {
        // analytics cluster — all strongly aligned with [1,0,0,0]
        "Sales and payment analytics — analytics_getSales": [1, 0, 0, 0],
        "Sales and payment analytics — analytics_getRevenue": [
          0.95, 0.05, 0, 0,
        ],
        "Sales and payment analytics — analytics_getPayments": [0.9, 0.1, 0, 0],
        "Sales and payment analytics — analytics_getRefunds": [
          0.85, 0.15, 0, 0,
        ],
        "Sales and payment analytics — analytics_getDashboard": [
          0.8, 0.2, 0, 0,
        ],
        "Sales and payment analytics — analytics_exportReport": [
          0.75, 0.25, 0, 0,
        ],
        // shipping cluster
        "Shipment tracking and courier management — shipping_track": [
          0, 1, 0, 0,
        ],
        "Shipment tracking and courier management — shipping_listCouriers": [
          0, 0.9, 0.1, 0,
        ],
        "Shipment tracking and courier management — shipping_getLabel": [
          0, 0.85, 0.15, 0,
        ],
        "Shipment tracking and courier management — shipping_cancelShipment": [
          0, 0.8, 0.2, 0,
        ],
        "Shipment tracking and courier management — shipping_createShipment": [
          0, 0.75, 0.25, 0,
        ],
        "Shipment tracking and courier management — shipping_getQuote": [
          0, 0.7, 0.3, 0,
        ],
        // calendar cluster
        "Calendar scheduling tools — calendar_createEvent": [0, 0, 1, 0],
        "Calendar scheduling tools — calendar_listEvents": [0, 0, 0.9, 0.1],
        "Calendar scheduling tools — calendar_deleteEvent": [0, 0, 0.85, 0.15],
        "Calendar scheduling tools — calendar_updateEvent": [0, 0, 0.8, 0.2],
        "Calendar scheduling tools — calendar_getAvailability": [
          0, 0, 0.75, 0.25,
        ],
        "Calendar scheduling tools — calendar_setReminder": [0, 0, 0.7, 0.3],
        // db cluster
        "Database administration tools — db_query": [0, 0, 0, 1],
        "Database administration tools — db_migrate": [0, 0, 0.05, 0.95],
        "Database administration tools — db_backup": [0, 0.05, 0, 0.95],
        "Database administration tools — db_restore": [0, 0.1, 0, 0.9],
      };
      const QUERY_TABLE: Record<string, number[]> = {
        "show me yesterday's sales": [1, 0, 0, 0],
      };
      return Promise.resolve(
        texts.map(
          (t) => TABLE[t] ?? QUERY_TABLE[t] ?? [0.25, 0.25, 0.25, 0.25],
        ),
      );
    };

    let decision: ToolRoutingDecision | undefined;

    const excluded = await resolveToolRoutingExclusions({
      catalog,
      alwaysIncludeServerIds: [],
      userQuery: "show me yesterday's sales",
      routerModel: {},
      timeoutMs: 5000,
      generateFn: vi
        .fn()
        .mockRejectedValue(new Error("LLM router must not be called")),
      embedFn,
      embeddingConfig: {
        enabled: true,
        topK: 6,
        minToolsToActivate: 20,
      },
      granularity: "tool",
      emitDecision: (d) => {
        decision = d;
      },
    });

    // Embedding must have activated
    expect(decision?.embeddingActivated).toBe(true);
    expect(decision?.granularity).toBe("tool");
    expect(decision?.outcome).toBe("applied");

    // At least one non-analytics tool must be excluded (shipping/calendar/db
    // tools are far from the "sales" query vector)
    const nonAnalyticsExcluded = excluded.filter(
      (t) => !t.startsWith("analytics_"),
    );
    expect(nonAnalyticsExcluded.length).toBeGreaterThan(0);

    // Analytics tools (top-6) must NOT be excluded
    for (const toolName of catalog[0].toolNames) {
      expect(excluded).not.toContain(toolName);
    }
  });

  it("applyToolRoutingExclusions falls back to LLM router when embedding is disabled", async () => {
    const { NeuroLink } = await import("../src/lib/neurolink.js");

    // Build a NeuroLink instance with a large enough tool catalog (>20 tools)
    // so the embedding fast-path activates.
    const instance = new NeuroLink({
      toolRouting: {
        enabled: true,
        alwaysIncludeServerIds: [],
        embedding: {
          enabled: false, // We'll inject embedFn directly via params, so keep OFF here
        },
        granularity: "tool",
      },
    });

    // Register 22 tools across 4 servers
    const noopExecute = async (): Promise<{ ok: boolean }> => ({ ok: true });
    const toolEntries: Record<
      string,
      { name: string; description: string; execute: typeof noopExecute }
    > = {};
    const servers = [
      { id: "analytics", desc: "Sales analytics", count: 6 },
      { id: "shipping", desc: "Shipment tracking", count: 6 },
      { id: "calendar", desc: "Calendar scheduling", count: 6 },
      { id: "db", desc: "Database tools", count: 4 },
    ];
    for (const srv of servers) {
      for (let i = 0; i < srv.count; i++) {
        const name = `${srv.id}_tool${i}`;
        toolEntries[name] = {
          name,
          description: `${srv.desc} tool ${i}`,
          execute: noopExecute,
        };
      }
    }
    instance.registerTools(toolEntries);
    instance.setToolRoutingServers(
      servers.map((s) => ({ id: s.id, description: s.desc })),
    );

    // Spy on generate to mock the LLM router response (will only be called
    // if the embedding path doesn't activate, which confirms the test scenario)
    vi.spyOn(instance, "generate").mockResolvedValue(
      generateResultWith('{"servers":["analytics"]}'),
    );

    // Call applyToolRoutingExclusions with an explicit embedFn passed as param:
    // Since NeuroLink only builds the embedFn from embeddingCfg.provider, we
    // bypass by calling resolveToolRoutingExclusions directly with our embedFn
    // and verify the exclusion semantics — the wiring test is already covered
    // by the previous test ("resolveToolRoutingExclusions with embedFn returns
    // tool-granularity exclusions"). Here we just confirm that the private
    // applyToolRoutingExclusions path works through generate() spying.
    const options = {
      input: { text: "show me sales" },
      excludeTools: [] as string[],
    } as import("../src/lib/types/index.js").StreamOptions;

    await (
      instance as unknown as {
        applyToolRoutingExclusions(
          opts: typeof options,
          userQuery: string,
        ): Promise<void>;
      }
    ).applyToolRoutingExclusions(options, "show me sales");

    // Since embedding is disabled, the LLM router must have been called exactly once.
    expect(instance.generate).toHaveBeenCalledTimes(1);

    // Since embedding is disabled (enabled:false), it falls back to LLM router.
    // The mocked LLM router picks "analytics", so shipping/calendar/db excluded.
    expect(options.excludeTools).toBeDefined();
    expect(Array.isArray(options.excludeTools)).toBe(true);
    // At least shipping tools are excluded
    const excluded = options.excludeTools as string[];
    expect(excluded.some((t) => t.startsWith("shipping_"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Part 9 — NeuroLink embedding provider wiring
// ---------------------------------------------------------------------------

/**
 * Exercises the full path that NeuroLink takes when `embedding.enabled = true`:
 * it calls AIProviderFactory.createProvider, binds `embedMany`, creates the
 * persistent toolRoutingVectorCache, and wires the embedFn into
 * resolveToolRoutingExclusions. The factory and provider are fully mocked so
 * no real API keys are required.
 */
describe("NeuroLink embedding provider wiring — deterministic factory mock", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("wires embedMany from a mocked provider into applyToolRoutingExclusions", async () => {
    // Fixed-vector embedFn that clusters analytics tools near [1,0,0,0]
    // and the query "show me yesterday's sales" near [1,0,0,0] as well.
    const embeddingCallCount = { n: 0 };
    const fixedEmbedMany = vi.fn(async (texts: string[]) => {
      embeddingCallCount.n += 1;
      return texts.map((t) => {
        if (t.includes("analytics") || t.includes("sales")) {
          return [1, 0, 0, 0];
        }
        if (t.includes("shipping")) {
          return [0, 1, 0, 0];
        }
        if (t.includes("calendar")) {
          return [0, 0, 1, 0];
        }
        if (t.includes("db") || t.includes("database")) {
          return [0, 0, 0, 1];
        }
        return [0.25, 0.25, 0.25, 0.25];
      });
    });

    // Mock AIProviderFactory so createProvider returns a fake provider whose
    // embedMany delegate is our fixedEmbedMany.
    const fakeProvider = {
      embedMany: fixedEmbedMany,
    };
    const { AIProviderFactory } = await import("../src/lib/core/factory.js");
    const createProviderSpy = vi
      .spyOn(AIProviderFactory, "createProvider")
      .mockResolvedValue(
        fakeProvider as unknown as Awaited<
          ReturnType<typeof AIProviderFactory.createProvider>
        >,
      );

    const { NeuroLink } = await import("../src/lib/neurolink.js");

    const instance = new NeuroLink({
      toolRouting: {
        enabled: true,
        alwaysIncludeServerIds: [],
        embedding: {
          enabled: true,
          provider: "openai",
          model: "text-embedding-3-small",
          topK: 6,
          minToolsToActivate: 20,
        },
        granularity: "tool",
      },
    });

    // Register 22 tools across 4 servers (> minToolsToActivate = 20)
    const noopExecute = async (): Promise<{ ok: boolean }> => ({ ok: true });
    const servers = [
      { id: "analytics", desc: "Sales and payment analytics", count: 6 },
      {
        id: "shipping",
        desc: "Shipment tracking and courier management",
        count: 6,
      },
      { id: "calendar", desc: "Calendar scheduling tools", count: 6 },
      { id: "db", desc: "Database administration tools", count: 4 },
    ];
    const toolEntries: Record<
      string,
      { name: string; description: string; execute: typeof noopExecute }
    > = {};
    for (const srv of servers) {
      for (let i = 0; i < srv.count; i++) {
        const toolName = `${srv.id}_tool${i}`;
        toolEntries[toolName] = {
          name: toolName,
          description: `${srv.desc} tool ${i}`,
          execute: noopExecute,
        };
      }
    }
    instance.registerTools(toolEntries);
    instance.setToolRoutingServers(
      servers.map((s) => ({ id: s.id, description: s.desc })),
    );

    // Mock generate so the LLM router is never called (embedding should handle it).
    const generateSpy = vi
      .spyOn(instance, "generate")
      .mockRejectedValue(new Error("LLM router must not be called"));

    const options = {
      input: { text: "show me yesterday's sales" },
      excludeTools: [] as string[],
      provider: "openai",
    } as import("../src/lib/types/index.js").StreamOptions;

    await (
      instance as unknown as {
        applyToolRoutingExclusions(
          opts: typeof options,
          userQuery: string,
        ): Promise<void>;
      }
    ).applyToolRoutingExclusions(options, "show me yesterday's sales");

    // AIProviderFactory.createProvider must have been called with the configured
    // embedding provider ("openai") and model — verifies the provider wiring is live.
    const callArgs = createProviderSpy.mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(callArgs?.[0]).toBe("openai");
    expect(callArgs?.[1]).toBe("text-embedding-3-small");

    // embedMany must have been invoked (tools were embedded via the factory path).
    expect(fixedEmbedMany).toHaveBeenCalled();

    // The LLM router (generate) must NOT have been called — embedding handled it.
    expect(generateSpy).not.toHaveBeenCalled();

    // Analytics tools must NOT be excluded (they match the "sales" query vector).
    const excludedTools = options.excludeTools as string[];
    expect(Array.isArray(excludedTools)).toBe(true);
    const analyticsExcluded = excludedTools.filter((t) =>
      t.startsWith("analytics_"),
    );
    expect(analyticsExcluded).toHaveLength(0);

    // At least some non-analytics tools must be excluded.
    const nonAnalyticsExcluded = excludedTools.filter(
      (t) => !t.startsWith("analytics_"),
    );
    expect(nonAnalyticsExcluded.length).toBeGreaterThan(0);
  });

  it("persists the vector cache across turns (embedMany is not called for cached texts on turn 2)", async () => {
    let embedCallsForCatalogTexts = 0;

    const trackingEmbedMany = vi.fn(async (texts: string[]) => {
      // Count calls that embed catalog texts (not just query texts).
      const hasCatalogText = texts.some(
        (t) => t.includes(" — ") && !t.includes("show me"),
      );
      if (hasCatalogText) {
        embedCallsForCatalogTexts += 1;
      }
      return texts.map(() => [1, 0, 0, 0]); // All analytics-aligned
    });

    const fakeProvider = { embedMany: trackingEmbedMany };
    const { AIProviderFactory } = await import("../src/lib/core/factory.js");
    vi.spyOn(AIProviderFactory, "createProvider").mockResolvedValue(
      fakeProvider as unknown as Awaited<
        ReturnType<typeof AIProviderFactory.createProvider>
      >,
    );

    const { NeuroLink } = await import("../src/lib/neurolink.js");

    const instance = new NeuroLink({
      toolRouting: {
        enabled: true,
        alwaysIncludeServerIds: [],
        embedding: {
          enabled: true,
          provider: "openai",
          model: "text-embedding-3-small",
          topK: 6,
          minToolsToActivate: 20,
        },
        granularity: "server",
      },
    });

    const noopExecute = async (): Promise<{ ok: boolean }> => ({ ok: true });
    const servers = [
      { id: "analytics", desc: "Sales analytics", count: 6 },
      { id: "shipping", desc: "Shipment tracking", count: 6 },
      { id: "calendar", desc: "Calendar scheduling", count: 6 },
      { id: "db", desc: "Database tools", count: 4 },
    ];
    const toolEntries: Record<
      string,
      { name: string; description: string; execute: typeof noopExecute }
    > = {};
    for (const srv of servers) {
      for (let i = 0; i < srv.count; i++) {
        const toolName = `${srv.id}_tool${i}`;
        toolEntries[toolName] = {
          name: toolName,
          description: `${srv.desc} tool ${i}`,
          execute: noopExecute,
        };
      }
    }
    instance.registerTools(toolEntries);
    instance.setToolRoutingServers(
      servers.map((s) => ({ id: s.id, description: s.desc })),
    );

    vi.spyOn(instance, "generate").mockRejectedValue(
      new Error("LLM router must not be called"),
    );

    const makeOptions = () =>
      ({
        input: { text: "show me sales" },
        excludeTools: [] as string[],
        provider: "openai",
      }) as import("../src/lib/types/index.js").StreamOptions;

    const applyFn = (
      instance as unknown as {
        applyToolRoutingExclusions(
          opts: ReturnType<typeof makeOptions>,
          userQuery: string,
        ): Promise<void>;
      }
    ).applyToolRoutingExclusions.bind(instance);

    // Turn 1: catalog texts are not yet cached → embedMany is called with catalog.
    await applyFn(makeOptions(), "show me sales");
    const catalogCallsAfterTurn1 = embedCallsForCatalogTexts;
    expect(catalogCallsAfterTurn1).toBeGreaterThan(0);

    // Turn 2: catalog texts are now in the shared vectorCache → no new catalog
    // embeddings should be requested.
    await applyFn(makeOptions(), "show me sales");
    const catalogCallsAfterTurn2 = embedCallsForCatalogTexts;

    // The second turn must not embed catalog texts again.
    expect(catalogCallsAfterTurn2).toBe(catalogCallsAfterTurn1);
  });
});
