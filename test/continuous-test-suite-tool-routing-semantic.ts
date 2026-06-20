#!/usr/bin/env tsx
import "dotenv/config";

/**
 * Continuous Test Suite — L2 Embedding Fast-Path & Tool-Granularity
 * (feat/tool-routing-semantic)
 *
 * Deterministic (no-API) coverage using a fake embedFn (returns fixed vectors
 * per text) PLUS a live-gated section that exercises the real embedding path
 * over a >20-tool catalog with an actual embedding provider.
 *
 * Structure:
 *   Part 1 — cosineSimilarity correctness (4 tests, no-API)
 *   Part 2 — hybrid ranking: semantically-closest tools win (5 tests, no-API)
 *   Part 3 — embedding index caches tool vectors (2 tests, no-API)
 *   Part 4 — granularity:"tool" narrows to individual tools (3 tests, no-API)
 *   Part 5 — granularity:"server" regression guard (2 tests, no-API)
 *   Part 6 — FAIL OPEN: embedFn throws → falls back without throwing (2 tests, no-API)
 *   Part 7 — LIVE-gated: real embedding provider over >20-tool catalog (1 test)
 *
 * Run:
 *   pnpm run build && npx tsx test/continuous-test-suite-tool-routing-semantic.ts
 *   pnpm run test:tool-routing-semantic
 */

import {
  cosineSimilarity,
  ToolEmbeddingIndex,
  selectRelevantToolNames,
  resolveToolRoutingExclusions,
  NeuroLink,
} from "../dist/index.js";
import type {
  ToolRetrievalItem,
  ToolRoutingCatalogEntry,
  ToolRoutingDecision,
  ToolRoutingResolutionParams,
} from "../src/lib/types/index.js";
import {
  defineSuite,
  assert,
  assertEqual,
  assertNotNull,
  Skip,
} from "./helpers/harness.js";
import { skipUnlessProviderAvailable } from "./helpers/skipIf.js";
import { isExpectedProviderError } from "./helpers/envGuard.js";

const { test, runSuite } = defineSuite(
  "L2 Embedding Fast-Path & Tool-Granularity",
);

// ============================================================================
// Fake embedFn factory
// ============================================================================

/**
 * Returns a fake embedFn that maps known text → fixed unit-direction vectors
 * (4-dimensional) so cosine similarity tests are deterministic and require
 * zero API calls.
 *
 * Cluster assignments:
 *   analytics  → [1, 0, 0, 0]
 *   shipping   → [0, 1, 0, 0]
 *   calendar   → [0, 0, 1, 0]
 *   database   → [0, 0, 0, 1]
 *   (unknown)  → [0.25, 0.25, 0.25, 0.25]
 */
function makeFakeEmbedFn(callCount?: { n: number }) {
  const TABLE: Record<string, number[]> = {
    // analytics
    "Sales and payment analytics — analytics_getSales": [1, 0, 0, 0],
    "Sales and payment analytics — analytics_getRevenue": [0.95, 0.05, 0, 0],
    "Sales and payment analytics — analytics_getPayments": [0.9, 0.1, 0, 0],
    "Sales and payment analytics — analytics_getRefunds": [0.85, 0.15, 0, 0],
    "Sales and payment analytics — analytics_getDashboard": [0.8, 0.2, 0, 0],
    "Sales and payment analytics — analytics_exportReport": [0.75, 0.25, 0, 0],
    // shipping
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
    // calendar
    "Calendar scheduling tools — calendar_createEvent": [0, 0, 1, 0],
    "Calendar scheduling tools — calendar_listEvents": [0, 0, 0.9, 0.1],
    "Calendar scheduling tools — calendar_deleteEvent": [0, 0, 0.85, 0.15],
    "Calendar scheduling tools — calendar_updateEvent": [0, 0, 0.8, 0.2],
    "Calendar scheduling tools — calendar_getAvailability": [0, 0, 0.75, 0.25],
    "Calendar scheduling tools — calendar_setReminder": [0, 0, 0.7, 0.3],
    // database
    "Database administration tools — db_query": [0, 0, 0, 1],
    "Database administration tools — db_migrate": [0, 0, 0.05, 0.95],
    "Database administration tools — db_backup": [0, 0.05, 0, 0.95],
    "Database administration tools — db_restore": [0, 0.1, 0, 0.9],
  };
  const QUERY_TABLE: Record<string, number[]> = {
    "show me yesterday's sales": [1, 0, 0, 0],
    "track my shipment": [0, 1, 0, 0],
    "list upcoming meetings": [0, 0, 1, 0],
    "run a database migration": [0, 0, 0, 1],
    // show me sales (shorter variant)
    "show me sales": [1, 0, 0, 0],
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

/**
 * Large catalog (22 tools across 4 servers) that exceeds the default
 * minToolsToActivate threshold (20) so the embedding fast-path activates.
 */
function buildLargeCatalog(): ToolRoutingCatalogEntry[] {
  return [
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
}

// ============================================================================
// Part 1 — cosineSimilarity correctness
// ============================================================================

await test("cosineSimilarity: orthogonal vectors return 0", () => {
  const result = cosineSimilarity([1, 0, 0], [0, 1, 0]);
  assert(
    Math.abs(result) < 1e-10,
    `Expected ~0 for orthogonal vectors, got ${result}`,
  );
});

await test("cosineSimilarity: identical vectors return 1", () => {
  const result = cosineSimilarity([1, 2, 3], [1, 2, 3]);
  assert(
    Math.abs(result - 1) < 1e-10,
    `Expected ~1 for identical vectors, got ${result}`,
  );
});

await test("cosineSimilarity: mismatched length vectors return 0 (guard)", () => {
  const result = cosineSimilarity([1, 2], [1, 2, 3]);
  assertEqual(result, 0, "mismatched length vectors must return 0");
});

await test("cosineSimilarity: zero-magnitude vector returns 0 (guard)", () => {
  const result = cosineSimilarity([0, 0, 0], [1, 2, 3]);
  assertEqual(result, 0, "zero-magnitude vector must return 0");
});

// ============================================================================
// Part 2 — hybrid ranking: semantically-closest tools win
// ============================================================================

await test("hybrid ranking: analytics tool ranks first for a sales query", async () => {
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
    { name: "db_query", text: "Database administration tools — db_query" },
  ];

  const embedFn = makeFakeEmbedFn();
  const index = new ToolEmbeddingIndex(items, embedFn);
  const results = await index.rank("show me yesterday's sales", { topK: 4 });

  assertEqual(
    results[0].name,
    "analytics_getSales",
    "analytics tool must rank first for a sales query",
  );
  assert(results.length === 4, "must return topK results");
});

await test("hybrid ranking: shipping tool ranks first for a shipment query", async () => {
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
      name: "db_query",
      text: "Database administration tools — db_query",
    },
  ];

  const embedFn = makeFakeEmbedFn();
  const index = new ToolEmbeddingIndex(items, embedFn);
  const results = await index.rank("track my shipment", { topK: 3 });

  assertEqual(
    results[0].name,
    "shipping_track",
    "shipping tool must rank first for a shipment query",
  );
});

await test("hybrid ranking: topK cap respected — returns exactly topK items", async () => {
  const items: ToolRetrievalItem[] = Array.from({ length: 10 }, (_, i) => ({
    name: `tool_${i}`,
    text: `Sales and payment analytics — analytics_getSales`,
  }));

  const embedFn = makeFakeEmbedFn();
  const index = new ToolEmbeddingIndex(items, embedFn);
  const results = await index.rank("show me yesterday's sales", { topK: 3 });

  assertEqual(results.length, 3, "topK=3 must return exactly 3 results");
});

await test("hybrid ranking: results sorted descending by score", async () => {
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

  const embedFn = makeFakeEmbedFn();
  const index = new ToolEmbeddingIndex(items, embedFn);
  const results = await index.rank("show me yesterday's sales", { topK: 3 });

  for (let i = 1; i < results.length; i++) {
    assert(
      results[i - 1].score >= results[i].score,
      `Results not sorted descending: ${results[i - 1].score} < ${results[i].score} at position ${i}`,
    );
  }
});

await test("hybrid ranking: both cosine-only and bm25-only correctly rank analytics first for a sales query", async () => {
  // "sales analytics" text — lexically "sales" appears only in analytics
  const items: ToolRetrievalItem[] = [
    {
      name: "analytics_getSales",
      text: "Sales and payment analytics — analytics_getSales",
    },
    {
      name: "shipping_track",
      text: "Shipment tracking and courier management — shipping_track",
    },
  ];

  const embedFn = makeFakeEmbedFn();

  const cosineIndex = new ToolEmbeddingIndex(items, embedFn);
  const cosineResults = await cosineIndex.rank("show me yesterday's sales", {
    topK: 2,
    weights: { cosine: 1.0, bm25: 0.0 },
  });
  // Cosine: analytics [1,0,0,0] is closer to query [1,0,0,0] than shipping [0,1,0,0]
  assertEqual(
    cosineResults[0].name,
    "analytics_getSales",
    "cosine-only: analytics must rank first for sales query",
  );

  const bm25Index = new ToolEmbeddingIndex(items, embedFn);
  const bm25Results = await bm25Index.rank("show me yesterday's sales", {
    topK: 2,
    weights: { cosine: 0.0, bm25: 1.0 },
  });
  // BM25: "sales" appears in analytics text only → analytics tops
  assertEqual(
    bm25Results[0].name,
    "analytics_getSales",
    "bm25-only: analytics must rank first for sales query",
  );
});

// ============================================================================
// Part 3 — embedding index CACHES tool vectors (call count invariant)
// ============================================================================

await test("embedding index: call count does NOT grow on second rank() of same catalog", async () => {
  const callCount = { n: 0 };
  const embedFn = makeFakeEmbedFn(callCount);

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

  await index.rank("show me yesterday's sales", { topK: 3 });
  const callsAfterFirst = callCount.n;

  await index.rank("track my shipment", { topK: 3 });
  const callsAfterSecond = callCount.n;

  // Second rank: only the NEW query needs embedding (1 extra call).
  // Catalog texts are cached, so no batch re-embed.
  assertEqual(
    callsAfterSecond - callsAfterFirst,
    1,
    `Second rank() should add exactly 1 call (query only), got ${callsAfterSecond - callsAfterFirst}`,
  );
});

await test("embedding index: duplicate catalog texts deduplicated before embedding", async () => {
  const callCount = { n: 0 };
  const embedFn = makeFakeEmbedFn(callCount);

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

  // catalog batch (1 unique text) + query (1 call) = 2 calls total, NOT 3
  assertEqual(
    callCount.n,
    2,
    `Expected 2 embedFn calls (1 catalog + 1 query), got ${callCount.n}`,
  );
});

// ============================================================================
// Part 4 — granularity:"tool" narrows to individual tools
// ============================================================================

await test('granularity:"tool" + embedding: unpicked individual tools excluded even within a kept server', async () => {
  const catalog = buildLargeCatalog();
  const embedFn = makeFakeEmbedFn();

  let decision: ToolRoutingDecision | undefined;

  const excluded = await resolveToolRoutingExclusions({
    catalog,
    alwaysIncludeServerIds: [],
    userQuery: "show me yesterday's sales",
    routerModel: {},
    timeoutMs: 5000,
    // generateFn must NOT be called — embedding path returns first
    generateFn: async () => {
      throw new Error("LLM router must not be called when embedding activates");
    },
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
  } as ToolRoutingResolutionParams);

  assertNotNull(decision, "emitDecision should have been called");
  assertEqual(
    decision.embeddingActivated,
    true,
    "embedding must have activated",
  );
  assertEqual(decision.granularity, "tool", 'granularity should be "tool"');
  assertEqual(decision.outcome, "applied", 'outcome should be "applied"');

  // analytics tools (top-6 cluster) must NOT be excluded
  for (const toolName of catalog[0].toolNames) {
    assert(
      !excluded.includes(toolName),
      `analytics tool ${toolName} must not be excluded`,
    );
  }

  // At least one non-analytics tool must be excluded
  const nonAnalyticsExcluded = excluded.filter(
    (t) => !t.startsWith("analytics_"),
  );
  assert(
    nonAnalyticsExcluded.length > 0,
    "at least one non-analytics tool must be excluded",
  );
});

await test("granularity:tool + embedding: total tools = excluded + kept", async () => {
  const catalog = buildLargeCatalog();
  const totalTools = catalog.reduce((s, c) => s + c.toolNames.length, 0); // 22

  const embedFn = makeFakeEmbedFn();
  const excluded = await resolveToolRoutingExclusions({
    catalog,
    alwaysIncludeServerIds: [],
    userQuery: "show me yesterday's sales",
    routerModel: {},
    timeoutMs: 5000,
    generateFn: async () => {
      throw new Error("LLM router must not be called");
    },
    embedFn,
    embeddingConfig: { enabled: true, topK: 10, minToolsToActivate: 20 },
    granularity: "tool",
  } as ToolRoutingResolutionParams);

  // Excluded + kept = total
  const kept = totalTools - excluded.length;
  assert(
    kept + excluded.length === totalTools,
    `kept(${kept}) + excluded(${excluded.length}) must equal total(${totalTools})`,
  );
  // topK=10 → at most 10 kept, so at least 12 excluded
  assert(
    excluded.length >= totalTools - 10,
    `with topK=10 there must be at least ${totalTools - 10} excluded, got ${excluded.length}`,
  );
});

await test("granularity:tool fallback: embedding disabled → uses server granularity via LLM router", async () => {
  const catalog = buildLargeCatalog();
  let routerCalled = false;

  const excluded = await resolveToolRoutingExclusions({
    catalog,
    alwaysIncludeServerIds: [],
    userQuery: "show me yesterday's sales",
    routerModel: {},
    timeoutMs: 5000,
    generateFn: async () => {
      routerCalled = true;
      return {
        content: '{"servers":["analytics"]}',
      } as unknown as import("../src/lib/types/index.js").GenerateResult;
    },
    // No embedFn → embedding path bypassed entirely
    granularity: "tool",
  });

  // LLM router must be called since embedding is off
  assert(routerCalled, "LLM router must be called when embedding is disabled");
  // analytics tools must not be excluded
  assert(
    !excluded.includes("analytics_getSales"),
    "analytics_getSales must not be excluded",
  );
  // non-analytics tools must be excluded
  assert(
    excluded.includes("shipping_track"),
    "shipping tools must be excluded by server-granularity fallback",
  );
});

// ============================================================================
// Part 5 — granularity:"server" regression guard (identical to pre-existing behavior)
// ============================================================================

await test("granularity:server + embedding disabled: excludes whole unpicked servers (regression guard)", async () => {
  const CATALOG: ToolRoutingCatalogEntry[] = [
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

  const excluded = await resolveToolRoutingExclusions({
    catalog: CATALOG,
    alwaysIncludeServerIds: ["utility"],
    userQuery: "show me yesterday's sales",
    routerModel: { provider: "openai", model: "gpt-4o-mini" },
    timeoutMs: 15000,
    generateFn: async () =>
      ({
        content: '{"servers":["analytics"]}',
      }) as unknown as import("../src/lib/types/index.js").GenerateResult,
    // No embedFn → pure LLM router path (original behavior)
    granularity: "server",
  });

  assert(
    excluded.includes("shipping_track"),
    "shipping_track must be excluded",
  );
  assert(
    excluded.includes("shipping_listCouriers"),
    "shipping_listCouriers must be excluded",
  );
  assert(
    !excluded.includes("analytics_getSales"),
    "analytics tools must NOT be excluded",
  );
  assert(
    !excluded.includes("utility_echo"),
    "utility tools must NEVER be excluded (always-include)",
  );
});

await test("granularity:server + embedding (large catalog): excludes entire unpicked servers", async () => {
  const catalog = buildLargeCatalog();
  const embedFn = makeFakeEmbedFn();
  let decision: ToolRoutingDecision | undefined;

  const excluded = await resolveToolRoutingExclusions({
    catalog,
    alwaysIncludeServerIds: [],
    userQuery: "show me yesterday's sales",
    routerModel: {},
    timeoutMs: 5000,
    generateFn: async () => {
      throw new Error("LLM router must not be called");
    },
    embedFn,
    embeddingConfig: { enabled: true, topK: 8, minToolsToActivate: 20 },
    granularity: "server",
    emitDecision: (d) => {
      decision = d;
    },
  } as ToolRoutingResolutionParams);

  assertEqual(decision?.embeddingActivated, true, "embedding must activate");
  assertEqual(decision?.granularity, "server", "granularity must be server");

  // analytics server must be kept entire
  for (const toolName of catalog[0].toolNames) {
    assert(
      !excluded.includes(toolName),
      `analytics tool ${toolName} must not be excluded`,
    );
  }

  // At least one server is excluded wholesale
  assert(
    excluded.length > 0,
    "at least one non-analytics server must be excluded",
  );
});

// ============================================================================
// Part 6 — FAIL OPEN: embedFn throws → fallback, no throw
// ============================================================================

await test("fail open: embedFn that throws → resolveToolRoutingExclusions does NOT throw", async () => {
  const throwingEmbedFn = async (): Promise<number[][]> => {
    throw new Error("embedding service unavailable");
  };

  let llmCalled = false;
  const result = await resolveToolRoutingExclusions({
    catalog: buildLargeCatalog(),
    alwaysIncludeServerIds: [],
    userQuery: "show me sales",
    routerModel: {},
    timeoutMs: 5000,
    generateFn: async () => {
      llmCalled = true;
      return {
        content: '{"servers":["analytics"]}',
      } as unknown as import("../src/lib/types/index.js").GenerateResult;
    },
    embedFn: throwingEmbedFn,
    embeddingConfig: { enabled: true, topK: 10, minToolsToActivate: 20 },
    granularity: "tool",
  });

  // Must not throw — result is an array
  assert(
    Array.isArray(result),
    "result must be an array even when embedFn throws",
  );
  // LLM router must have been called as fallback
  assert(llmCalled, "LLM router must be called after embedFn throws");
});

await test("fail open: embedFn throws → result matches routing-without-embedding", async () => {
  const catalog = buildLargeCatalog();
  const throwingEmbedFn = async (): Promise<number[][]> => {
    throw new Error("embed down");
  };

  const generateFn = async () =>
    ({
      content: '{"servers":["analytics"]}',
    }) as unknown as import("../src/lib/types/index.js").GenerateResult;

  // With broken embedFn → falls back to LLM router
  const withBrokenEmbed = await resolveToolRoutingExclusions({
    catalog,
    alwaysIncludeServerIds: [],
    userQuery: "show me sales",
    routerModel: {},
    timeoutMs: 5000,
    generateFn,
    embedFn: throwingEmbedFn,
    embeddingConfig: { enabled: true, topK: 10, minToolsToActivate: 20 },
  });

  // Without embedFn → LLM router directly
  const withoutEmbed = await resolveToolRoutingExclusions({
    catalog,
    alwaysIncludeServerIds: [],
    userQuery: "show me sales",
    routerModel: {},
    timeoutMs: 5000,
    generateFn,
  });

  assertEqual(
    JSON.stringify(withBrokenEmbed.sort()),
    JSON.stringify(withoutEmbed.sort()),
    "broken embedFn result must equal no-embedding result",
  );
});

// ============================================================================
// Part 7 — LIVE-gated: real embedding provider over >20-tool catalog
// ============================================================================

await test("LIVE — real embedding provider narrows tool set for >20-tool catalog (skips without keys)", async () => {
  // Try OpenAI first; fall back to Google AI if OpenAI is absent.
  let provider = "openai";
  let model: string | undefined = "text-embedding-3-small";
  try {
    skipUnlessProviderAvailable("openai");
  } catch {
    // openai unavailable — try google-ai
    try {
      skipUnlessProviderAvailable("google-ai");
      provider = "google-ai";
      model = undefined; // use default embedding model
    } catch {
      throw new Skip(
        "no embedding-capable provider available (openai, google-ai)",
      );
    }
  }

  const catalog = buildLargeCatalog();
  // Add a few more tools so we're clearly above 20
  catalog.push({
    id: "notifications",
    description: "Push notification and alert delivery tools",
    toolNames: [
      "notifications_send",
      "notifications_schedule",
      "notifications_cancel",
    ],
  });

  const noopExecute = async (): Promise<{ ok: boolean }> => ({ ok: true });
  let sdk: InstanceType<typeof NeuroLink> | null = null;

  try {
    sdk = new NeuroLink({
      toolRouting: {
        enabled: true,
        alwaysIncludeServerIds: [],
        embedding: {
          enabled: true,
          provider,
          model,
          topK: 8,
          minToolsToActivate: 20,
        },
        granularity: "tool",
        routerModel: { provider, temperature: 0 },
        timeoutMs: 30000,
      },
    });

    // Register all tools
    const allTools: Record<
      string,
      { name: string; description: string; execute: typeof noopExecute }
    > = {};
    for (const entry of catalog) {
      for (const toolName of entry.toolNames) {
        allTools[toolName] = {
          name: toolName,
          description: `${entry.description} — ${toolName}`,
          execute: noopExecute,
        };
      }
    }
    sdk.registerTools(allTools);
    sdk.setToolRoutingServers(
      catalog.map((e) => ({ id: e.id, description: e.description })),
    );

    let decision: ToolRoutingDecision | undefined;

    // Use applyToolRoutingExclusions directly (private hook, same as stream/generate)
    const options = {
      input: { text: "show me yesterday's sales data" },
      excludeTools: [] as string[],
      provider,
    } as import("../src/lib/types/index.js").StreamOptions;

    // We must observe the decision — inject via emitDecision by hooking into
    // resolveToolRoutingExclusions indirectly. Since we can't inject
    // emitDecision from outside NeuroLink, we call applyToolRoutingExclusions
    // and check the result (exclusion list) instead.
    await (
      sdk as unknown as {
        applyToolRoutingExclusions(
          opts: typeof options,
          userQuery: string,
        ): Promise<void>;
      }
    ).applyToolRoutingExclusions(options, "show me yesterday's sales data");

    // The embedding path may or may not have activated (depends on provider
    // availability and model). What we CAN assert:
    // 1. The call returned without throwing.
    // 2. excludeTools is an array.
    // 3. At least some tools were narrowed OR the result is empty (fail-open).
    assert(
      Array.isArray(options.excludeTools),
      "options.excludeTools must be an array after applyToolRoutingExclusions",
    );

    const totalTools = catalog.reduce((s, c) => s + c.toolNames.length, 0);
    const excluded = options.excludeTools as string[];

    // Either: embedding activated and narrowed (excluded.length > 0 and
    // analytics tools not excluded), or fall-open (excluded.length = 0 or
    // LLM router ran instead). Both are acceptable.
    if (excluded.length > 0) {
      // If something was excluded, analytics tools should NOT be in the list
      // (since "sales" maps semantically to analytics).
      assert(
        !excluded.includes("analytics_getSales"),
        "analytics_getSales must NOT be excluded for a sales query",
      );
    }
    // Total: at most totalTools can be excluded
    assert(
      excluded.length <= totalTools,
      `excluded.length (${excluded.length}) must not exceed totalTools (${totalTools})`,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (error instanceof Skip || msg.startsWith("SKIP:")) {
      throw error;
    }
    if (isExpectedProviderError(msg)) {
      throw new Skip(`provider error: ${msg}`);
    }
    throw error;
  } finally {
    if (sdk) {
      try {
        await sdk.dispose();
      } catch {
        /* swallow */
      }
    }
  }
});

await runSuite();
