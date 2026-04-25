#!/usr/bin/env tsx
/**
 * Continuous Test Suite: Issue #6 — NoOutputGeneratedError missing context
 *
 * Curator P3-6: when AI SDK throws NoOutputGeneratedError, the sentinel
 * chunk yielded `{ noOutput: true, errorType: "NoOutputGeneratedError" }`
 * but no `finishReason`, no `usage`, no `providerError`, no
 * `modelResponseRaw`. Telemetry consumers had no way to differentiate
 * between content-filter, stop-sequence pre-emption, and abort-mid-stream.
 *
 * Test categories:
 *   1. DETERMINISTIC (6.0–6.4) — always run, prove the fix works:
 *      6.0 — shipped sentinel literal in dist contains all 6 enriched keys
 *      6.1 — every wired provider's compiled artifact uses the helper
 *      6.2 — `buildNoOutputSentinel` produces all 6 keys with correct types
 *      6.3 — helper reads partial finishReason / usage from a result-like
 *            and falls back to defaults when those promises reject
 *      6.4 — helper extracts `error.cause` into `modelResponseRaw`
 *
 *   2. END-TO-END (6.5) — production-trigger replay. A local HTTP server
 *      accepts the request, then kills the connection before any
 *      text-delta or completion event lands. AI SDK's flush sees 0
 *      recorded steps and rejects `result.finishReason` with
 *      NoOutputGeneratedError. The round-2 fix's `detectPostStreamNoOutput`
 *      helper awaits that promise after the textStream loop and yields
 *      the enriched sentinel — this test proves the sentinel actually
 *      fires end-to-end through real NeuroLink stream consumption.
 *
 *      Note on the round-2 fix: the original P3-6 catch block only fired
 *      when textStream itself threw NoOutputGeneratedError, which AI SDK
 *      v6.0.141 doesn't actually do. The new helper surfaces the
 *      rejection from `result.finishReason` so the production trigger
 *      now reliably yields the enriched sentinel.
 *
 *   3. BEST-EFFORT (6.x) — real-provider end-to-end attempt:
 *      One alphabet-wide stop-sequence recipe per configured provider.
 *      `NoOutputGeneratedError` fires only when the stream ends with empty
 *      text AND no tool calls — provider behavior varies wildly, so SKIP
 *      is the expected outcome for most provider/recipe combinations
 *      (the deterministic + end-to-end tests above already prove the
 *      contract). When the recipe DOES trigger, this verifies the
 *      production fix path against a real provider.
 *
 * Run: pnpm run build && npx tsx test/continuous-test-suite-issue-06-no-output-context.ts
 */
import "dotenv/config";

import { NeuroLink } from "../dist/index.js";
import {
  isExpectedProviderError,
  skipIfEnvMissing,
} from "./helpers/envGuard.js";

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m",
};

type Outcome = "PASS" | "FAIL" | "SKIP";
const results: { name: string; outcome: Outcome; detail: string }[] = [];

function record(name: string, outcome: Outcome, detail: string): void {
  results.push({ name, outcome, detail });
  const color =
    outcome === "PASS"
      ? colors.green
      : outcome === "FAIL"
        ? colors.red
        : colors.yellow;
  console.log(`${color}[${outcome}]${colors.reset} ${name} — ${detail}`);
}

function section(t: string): void {
  console.log(
    `\n${colors.cyan}${"=".repeat(72)}\n  ${t}\n${"=".repeat(72)}${colors.reset}`,
  );
}

type Recipe = {
  name: string;
  options: Record<string, unknown>;
};

// Best-effort recipe to trigger AI SDK's `NoOutputGeneratedError` against
// real providers. The error fires when a stream finishes with empty text
// AND no tool calls — provider behavior varies wildly here, so a SKIP
// (provider emitted some content) is expected and acceptable. The
// deterministic 6.0–6.4 tests above already prove the helper produces
// the right shape; this recipe only attempts end-to-end verification.
//
// Stop sequences cover every plausible first-token character a chat model
// might emit, so the sequence matches at or before the first chunk.
const ALPHABET_STOP_SEQUENCES = [
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."0123456789",
  " ",
  "\n",
  "\t",
  ".",
  ",",
  "!",
  "?",
  "*",
  "-",
  "_",
  "(",
  "[",
  "{",
  "<",
  '"',
  "'",
  "`",
  "#",
];

const RECIPES: Recipe[] = [
  {
    name: "alphabet-wide stop sequences (best-effort NoOutput trigger)",
    options: {
      input: { text: "Hello." },
      maxTokens: 50,
      stopSequences: ALPHABET_STOP_SEQUENCES,
      disableTools: true,
    },
  },
];

type ProviderTarget = {
  provider: string;
  envVars: string[];
  modelEnv?: string;
};

const TARGETS: ProviderTarget[] = [
  {
    provider: "vertex",
    envVars: ["GOOGLE_VERTEX_PROJECT", "GOOGLE_AUTH_CLIENT_EMAIL"],
    modelEnv: "VERTEX_MODEL",
  },
  {
    provider: "google-ai-studio",
    envVars: ["GOOGLE_AI_API_KEY"],
    modelEnv: "GOOGLE_AI_MODEL",
  },
  {
    provider: "litellm",
    envVars: ["LITELLM_BASE_URL", "LITELLM_API_KEY", "LITELLM_MODEL"],
    modelEnv: "LITELLM_MODEL",
  },
];

type ChunkRecord = {
  contentLen: number;
  metadata?: Record<string, unknown>;
};

async function tryRecipe(
  target: ProviderTarget,
  recipe: Recipe,
): Promise<ChunkRecord[] | { skip: string }> {
  const sdk = new NeuroLink();
  const chunks: ChunkRecord[] = [];
  const ac = new AbortController();
  const abortAfter = (recipe.options as { _abortAfterMs?: number })
    ._abortAfterMs;
  // Reviewer follow-up: capture the abort timer handle so the finally
  // block can clear it. Otherwise a recipe that completes before the
  // abort fires leaves a dangling timer that keeps the event loop
  // alive past the test.
  let abortTimer: ReturnType<typeof setTimeout> | undefined;
  if (abortAfter) {
    abortTimer = setTimeout(() => ac.abort(), abortAfter);
  }
  try {
    const model = target.modelEnv ? process.env[target.modelEnv] : undefined;
    const opts = { ...recipe.options };
    delete (opts as { _abortAfterMs?: number })._abortAfterMs;
    const r = await sdk.stream({
      provider: target.provider as never,
      ...(model && { model }),
      ...(opts as Record<string, unknown>),
      ...(abortAfter && { signal: ac.signal }),
    } as never);
    for await (const chunk of r.stream) {
      chunks.push({
        contentLen: (chunk.content ?? "").length,
        metadata: (chunk as { metadata?: Record<string, unknown> }).metadata,
      });
    }
    return chunks;
  } catch (err) {
    // Reviewer follow-up: providers like LiteLLM yield the enriched
    // sentinel and then re-throw to drive the fallback chain. The
    // `for await` loop above pushes the sentinel into `chunks` BEFORE
    // the throw escapes — so on rejection, return whatever chunks we
    // collected if any of them carry the noOutput sentinel. Only fall
    // back to SKIP when no usable chunk was yielded.
    const sawNoOutput = chunks.some(
      (c) =>
        (c.metadata as Record<string, unknown> | undefined)?.noOutput === true,
    );
    if (sawNoOutput) {
      return chunks;
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (isExpectedProviderError(msg)) {
      return { skip: msg.slice(0, 120) };
    }
    return { skip: `recipe error: ${msg.slice(0, 200)}` };
  } finally {
    if (abortTimer !== undefined) {
      clearTimeout(abortTimer);
    }
    await sdk.shutdown?.()?.catch(() => {});
  }
}

async function reproduceForTarget(target: ProviderTarget): Promise<void> {
  const skip = skipIfEnvMissing(...target.envVars);
  if (skip) {
    record(`6.x — ${target.provider}`, "SKIP", skip);
    return;
  }
  for (const recipe of RECIPES) {
    const testName = `6.x — ${target.provider} / ${recipe.name}`;
    const out = await tryRecipe(target, recipe);
    if ("skip" in out) {
      record(testName, "SKIP", out.skip);
      continue;
    }
    const noOutputChunk = out.find(
      (c) =>
        (c.metadata as Record<string, unknown> | undefined)?.noOutput === true,
    );
    if (!noOutputChunk) {
      const totalContent = out.reduce((n, c) => n + c.contentLen, 0);
      record(
        testName,
        "SKIP",
        `recipe did not trigger NoOutputGeneratedError; chunks=${out.length}, totalContent=${totalContent}`,
      );
      continue;
    }
    // Sentinel chunk found. Inspect what's present and what's missing.
    const meta = (noOutputChunk.metadata ?? {}) as Record<string, unknown>;
    const has = (k: string) => meta[k] !== undefined;
    const missing = [
      "finishReason",
      "usage",
      "providerError",
      "modelResponseRaw",
    ].filter((k) => !has(k));
    if (missing.length === 0) {
      record(
        testName,
        "PASS",
        `sentinel enriched: ${JSON.stringify(meta).slice(0, 200)}`,
      );
    } else {
      record(
        testName,
        "FAIL",
        `bug-confirmed: sentinel missing keys [${missing.join(", ")}]; present=${JSON.stringify(meta)}`,
      );
    }
  }
}

async function test_6_static_artifact_shape(): Promise<void> {
  const testName = "6.0 — STATIC: shipped NoOutput sentinel metadata literal";
  // Read the shared helper's compiled artifact (the single source of truth
  // for the sentinel shape, used by every provider stream-transformer plus
  // StreamHandler). Verify the literal carries finishReason / usage /
  // providerError so downstream telemetry has structured failure context.
  const fs = await import("node:fs/promises");
  const path = "dist/lib/utils/noOutputSentinel.js";
  let src: string;
  try {
    src = await fs.readFile(path, "utf-8");
  } catch (err) {
    record(testName, "SKIP", `cannot read ${path}: ${(err as Error).message}`);
    return;
  }
  const literal =
    /metadata:\s*\{[\s\S]{0,400}?noOutput:\s*true[\s\S]{0,400}?\}/m.exec(src);
  if (!literal) {
    record(
      testName,
      "FAIL",
      "noOutput sentinel literal not found in shipped artifact",
    );
    return;
  }
  const block = literal[0];
  // Match either `key: value` or shorthand `key,` / `key }` forms.
  const has = (key: string) => new RegExp(`\\b${key}\\s*[:,}]`).test(block);

  const present: string[] = [];
  const absent: string[] = [];
  for (const k of [
    "noOutput",
    "errorType",
    "finishReason",
    "usage",
    "providerError",
    "modelResponseRaw",
  ]) {
    (has(k) ? present : absent).push(k);
  }

  // Reviewer follow-up: also require `modelResponseRaw` so the static
  // verifier locks in the full sentinel contract — the helper now always
  // populates it (falls back to `${error.name}: ${error.message}` when
  // there's no `cause`), so a missing field is a real regression.
  const required = [
    "finishReason",
    "usage",
    "providerError",
    "modelResponseRaw",
  ];
  const missingRequired = required.filter((k) => !has(k));
  if (missingRequired.length > 0) {
    record(
      testName,
      "FAIL",
      `bug-confirmed: shipped sentinel missing [${missingRequired.join(", ")}]; present=[${present.join(", ")}]; absent=[${absent.join(", ")}]`,
    );
  } else {
    record(
      testName,
      "PASS",
      `sentinel enriched: present=[${present.join(", ")}]`,
    );
  }
}

// ---------------------------------------------------------------------------
//   Test 6.1 — STATIC: every provider's compiled stream-transformer is wired
//   to `buildNoOutputSentinel`. Prevents a future provider from regressing
//   to the un-enriched `{ noOutput: true }` sentinel.
// ---------------------------------------------------------------------------
async function test_6_1_all_providers_wired(): Promise<void> {
  // Providers whose `executeStream` catches AI SDK's NoOutputGeneratedError
  // and yields an enriched sentinel via the shared helper. googleAiStudio
  // and googleVertex deliberately use a different defensive pattern (they
  // catch `result.text` rejection on the side, not inside the stream
  // generator) so they're excluded.
  const providers = [
    "openAI",
    "openaiCompatible",
    "litellm",
    "huggingFace",
    "openRouter",
    "anthropicBaseProvider",
  ];
  // StreamHandler is also a wired site (when transformations don't go
  // through a provider-specific generator).
  const otherSites = ["core/modules/StreamHandler"];

  const fs = await import("node:fs/promises");
  for (const p of [...providers.map((n) => `providers/${n}`), ...otherSites]) {
    const testName = `6.1 — ${p} wired to NoOutput sentinel helper`;
    const path = `dist/lib/${p}.js`;
    let src: string;
    try {
      src = await fs.readFile(path, "utf-8");
    } catch (err) {
      record(
        testName,
        "SKIP",
        `cannot read ${path}: ${(err as Error).message}`,
      );
      continue;
    }
    const hasIsInstance = /NoOutputGeneratedError\.isInstance/.test(src);
    const usesHelper = /buildNoOutputSentinel/.test(src);
    if (hasIsInstance && usesHelper) {
      record(testName, "PASS", `both markers present`);
    } else {
      record(
        testName,
        "FAIL",
        `bug-confirmed: missing markers — isInstance=${hasIsInstance}, helper=${usesHelper}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
//   Test 6.2 — RUNTIME: helper produces all 6 enriched keys with correct
//   types when given a synthetic NoOutputGeneratedError-shaped error.
//   This deterministically exercises the production helper code regardless
//   of whether any live provider triggers NoOutputGeneratedError today.
// ---------------------------------------------------------------------------
async function test_6_2_helper_produces_full_sentinel(): Promise<void> {
  const testName =
    "6.2 — RUNTIME: buildNoOutputSentinel produces all 6 enriched keys";
  const mod = await import("../dist/lib/utils/noOutputSentinel.js");
  if (typeof mod.buildNoOutputSentinel !== "function") {
    return record(
      testName,
      "FAIL",
      "buildNoOutputSentinel not exported from shipped artifact",
    );
  }

  // Real Error instance — not a mock. The helper checks `error instanceof Error`
  // and builds the sentinel from the real message + name.
  const err = new Error("Stream produced no output");
  err.name = "AI_NoOutputGeneratedError";

  const sentinel = await mod.buildNoOutputSentinel(err);
  const meta = (sentinel as { metadata: Record<string, unknown> }).metadata;

  const issues: string[] = [];
  if (meta.noOutput !== true) {
    issues.push(`noOutput=${String(meta.noOutput)}`);
  }
  if (typeof meta.errorType !== "string" || !meta.errorType) {
    issues.push(`errorType=${typeof meta.errorType}`);
  }
  if (meta.finishReason === undefined) {
    issues.push(`finishReason=undefined`);
  }
  if (meta.usage === undefined || typeof meta.usage !== "object") {
    issues.push(`usage=${typeof meta.usage}`);
  }
  if (typeof meta.providerError !== "string" || !meta.providerError) {
    issues.push(`providerError=${typeof meta.providerError}`);
  }
  if (typeof meta.modelResponseRaw !== "string" || !meta.modelResponseRaw) {
    issues.push(`modelResponseRaw=${typeof meta.modelResponseRaw}`);
  }

  if (issues.length === 0) {
    record(
      testName,
      "PASS",
      `all keys present with correct types: ${JSON.stringify(meta).slice(0, 200)}`,
    );
  } else {
    record(
      testName,
      "FAIL",
      `bug-confirmed: helper output missing/malformed: [${issues.join(", ")}]`,
    );
  }
}

// ---------------------------------------------------------------------------
//   Test 6.3 — RUNTIME: helper surfaces partial finishReason/usage from a
//   resolved AI-SDK-shaped result, AND falls back when result fields reject.
// ---------------------------------------------------------------------------
async function test_6_3_helper_reads_partial_values(): Promise<void> {
  const testName =
    "6.3 — RUNTIME: buildNoOutputSentinel reads partial values from result-like";
  const mod = await import("../dist/lib/utils/noOutputSentinel.js");

  // Case A: resolved result fields surface to the sentinel.
  const errA = new Error("Stream produced no output");
  errA.name = "AI_NoOutputGeneratedError";
  const resolvedResult = {
    finishReason: Promise.resolve("length"),
    totalUsage: Promise.resolve({
      promptTokens: 100,
      completionTokens: 0,
      totalTokens: 100,
    }),
  };
  const sentinelA = await mod.buildNoOutputSentinel(errA, resolvedResult);
  const metaA = (sentinelA as { metadata: Record<string, unknown> }).metadata;

  // Case B: rejecting result fields fall back to defaults without throwing.
  const errB = new Error("Stream produced no output");
  errB.name = "AI_NoOutputGeneratedError";
  const rejectingResult = {
    finishReason: Promise.reject(new Error("AI_NoOutputGeneratedError")),
    totalUsage: Promise.reject(new Error("AI_NoOutputGeneratedError")),
  };
  const sentinelB = await mod.buildNoOutputSentinel(errB, rejectingResult);
  const metaB = (sentinelB as { metadata: Record<string, unknown> }).metadata;

  const issues: string[] = [];
  if (metaA.finishReason !== "length") {
    issues.push(`A.finishReason=${String(metaA.finishReason)}`);
  }
  if ((metaA.usage as { promptTokens?: number })?.promptTokens !== 100) {
    issues.push(`A.usage.promptTokens=${JSON.stringify(metaA.usage)}`);
  }
  if (metaB.finishReason !== "error") {
    issues.push(
      `B.finishReason=${String(metaB.finishReason)} (expected fallback)`,
    );
  }
  if ((metaB.usage as { totalTokens?: number })?.totalTokens !== 0) {
    issues.push(
      `B.usage.totalTokens=${JSON.stringify(metaB.usage)} (expected fallback)`,
    );
  }

  if (issues.length === 0) {
    record(
      testName,
      "PASS",
      `case A: finishReason=${metaA.finishReason}, promptTokens=${(metaA.usage as { promptTokens?: number })?.promptTokens}; case B: fallback defaults applied`,
    );
  } else {
    record(testName, "FAIL", `bug-confirmed: [${issues.join("; ")}]`);
  }
}

// ---------------------------------------------------------------------------
//   Test 6.4 — RUNTIME: helper extracts AI-SDK error.cause into
//   modelResponseRaw, otherwise falls back to error name+message.
// ---------------------------------------------------------------------------
async function test_6_4_helper_extracts_cause(): Promise<void> {
  const testName =
    "6.4 — RUNTIME: buildNoOutputSentinel surfaces error.cause into modelResponseRaw";
  const mod = await import("../dist/lib/utils/noOutputSentinel.js");

  // Case A: error has a `cause` (AI SDK wraps the underlying provider error).
  const errA = new Error("AI_NoOutputGeneratedError") as Error & {
    cause?: unknown;
  };
  errA.cause = "provider returned empty stream — content_filter triggered";
  const sA = await mod.buildNoOutputSentinel(errA);
  const metaA = (sA as { metadata: Record<string, unknown> }).metadata;

  // Case B: no cause — fallback to error.name + error.message.
  const errB = new Error("Stream produced no output");
  errB.name = "AI_NoOutputGeneratedError";
  const sB = await mod.buildNoOutputSentinel(errB);
  const metaB = (sB as { metadata: Record<string, unknown> }).metadata;

  const issues: string[] = [];
  if (
    typeof metaA.modelResponseRaw !== "string" ||
    !metaA.modelResponseRaw.includes("content_filter")
  ) {
    issues.push(
      `A.modelResponseRaw=${JSON.stringify(metaA.modelResponseRaw).slice(0, 80)} (expected to contain 'content_filter')`,
    );
  }
  if (
    typeof metaB.modelResponseRaw !== "string" ||
    !metaB.modelResponseRaw.includes("AI_NoOutputGeneratedError")
  ) {
    issues.push(
      `B.modelResponseRaw=${JSON.stringify(metaB.modelResponseRaw).slice(0, 80)} (expected fallback to include error name)`,
    );
  }

  if (issues.length === 0) {
    record(
      testName,
      "PASS",
      `cause extracted in A; fallback applied in B (length=${(metaB.modelResponseRaw as string)?.length})`,
    );
  } else {
    record(testName, "FAIL", `bug-confirmed: [${issues.join("; ")}]`);
  }
}

// ---------------------------------------------------------------------------
//   Test 6.5 — END-TO-END REGRESSION GATE: a local HTTP server replays the
//   production trigger by accepting the request and then killing the
//   connection before any text-delta or completion event lands. AI SDK
//   records 0 steps and rejects `result.finishReason` with
//   `NoOutputGeneratedError`.
//
//   The PR's `detectPostStreamNoOutput` helper awaits that promise after
//   the textStream loop completes and yields the enriched sentinel. This
//   test runs the full path through real `sdk.stream()` with the
//   `openai-compatible` provider pointed at the local server, consumes
//   the stream, and asserts a sentinel chunk surfaces with all 6
//   enriched keys (noOutput, errorType, finishReason, usage,
//   providerError, modelResponseRaw). On bind failures (e.g. EPERM in
//   sandboxes) the test records SKIP with a diagnostic; on missing or
//   malformed sentinel it records FAIL — i.e. this IS a CI gate. The
//   prior comment claimed this was informational; it isn't anymore.
// ---------------------------------------------------------------------------
async function test_6_5_local_server_triggers_real_sentinel(): Promise<void> {
  const testName =
    "6.5 — END-TO-END: local connection-kill triggers enriched sentinel via real NeuroLink stream";
  const http = await import("node:http");

  // Production trigger replay: server returns 200 OK then kills the
  // connection before any text-delta / completion event is emitted. AI
  // SDK's flush sees 0 recorded steps and rejects result.finishReason
  // with NoOutputGeneratedError. The fix's `detectPostStreamNoOutput`
  // helper surfaces that rejection so the enriched sentinel actually
  // fires — without this, the bug Curator captured persists silently.
  const server = http.createServer((req, res) => {
    if (req.url === "/v1/models") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: [{ id: "test-model" }] }));
      return;
    }
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    res.destroy();
  });
  // Reviewer follow-up: handle the `error` event so a listen failure
  // (EPERM/EADDRINUSE in restricted sandboxes) records SKIP cleanly
  // instead of crashing the suite before later tests run.
  let bindError: Error | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", (err) => reject(err));
      server.listen(0, "127.0.0.1", () => resolve());
    });
  } catch (err) {
    bindError = err instanceof Error ? err : new Error(String(err));
  }
  if (bindError) {
    try {
      server.close();
    } catch {
      /* already closed */
    }
    return record(
      testName,
      "SKIP",
      `cannot bind local HTTP server in this environment: ${bindError.message}`,
    );
  }
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    return record(testName, "FAIL", "could not bind local HTTP server");
  }
  const baseURL = `http://127.0.0.1:${address.port}/v1`;

  const sdk = new NeuroLink();
  const chunks: { content?: string; metadata?: Record<string, unknown> }[] = [];
  let streamErr: unknown;
  try {
    const r = await sdk.stream({
      provider: "openai-compatible" as never,
      model: "test-model",
      input: { text: "hi" },
      maxTokens: 10,
      disableTools: true,
      // Block NeuroLink's internal fallback so we test the sentinel
      // path, not a real-provider fallback.
      disableInternalFallback: true,
      credentials: {
        openaiCompatible: { baseURL, apiKey: "test-key" },
      },
    } as never);
    for await (const chunk of r.stream) {
      chunks.push(
        chunk as { content?: string; metadata?: Record<string, unknown> },
      );
    }
  } catch (err) {
    streamErr = err;
  } finally {
    await sdk.shutdown?.()?.catch(() => {});
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  const sentinelChunk = chunks.find(
    (c) =>
      (c.metadata as Record<string, unknown> | undefined)?.noOutput === true,
  );
  if (!sentinelChunk) {
    const sample = chunks
      .slice(0, 3)
      .map(
        (c) =>
          `{contentLen=${(c.content ?? "").length}, meta=${JSON.stringify(c.metadata ?? {}).slice(0, 80)}}`,
      )
      .join(" | ");
    return record(
      testName,
      "FAIL",
      `bug-confirmed: no enriched sentinel chunk yielded for production trigger; chunks=${chunks.length}, streamErr=${streamErr instanceof Error ? streamErr.message.slice(0, 120) : String(streamErr).slice(0, 120)}, sample=[${sample}]`,
    );
  }

  const meta = (sentinelChunk.metadata ?? {}) as Record<string, unknown>;
  const required = [
    "noOutput",
    "errorType",
    "finishReason",
    "usage",
    "providerError",
    "modelResponseRaw",
  ];
  const missing = required.filter((k) => meta[k] === undefined);
  if (missing.length > 0) {
    return record(
      testName,
      "FAIL",
      `bug-confirmed: sentinel missing keys [${missing.join(", ")}]; present=${JSON.stringify(meta).slice(0, 200)}`,
    );
  }
  record(
    testName,
    "PASS",
    `real end-to-end sentinel: errorType=${String(meta.errorType)}, finishReason=${String(meta.finishReason)}, providerError="${String(meta.providerError).slice(0, 60)}", modelResponseRaw="${String(meta.modelResponseRaw).slice(0, 60)}"`,
  );
}

// ---------------------------------------------------------------------------
//   Test 6.6 — REGRESSION: StreamHandler must not yield duplicate sentinels
//   when both the catch and the post-stream detection paths see NoOutput
//   in the same iteration (reviewer Finding #3 — verified via synthetic
//   stream that produced count=2 sentinels before this fix).
// ---------------------------------------------------------------------------
async function test_6_6_streamhandler_no_duplicate_sentinel(): Promise<void> {
  const testName =
    "6.6 — REGRESSION: StreamHandler does not yield duplicate sentinels when catch + post-stream both detect NoOutput";
  // Read the shipped artifact and verify the catch block returns after
  // yielding the sentinel (so the post-stream detection block doesn't run).
  const fs = await import("node:fs/promises");
  const path = "dist/lib/core/modules/StreamHandler.js";
  let src: string;
  try {
    src = await fs.readFile(path, "utf-8");
  } catch (err) {
    return record(
      testName,
      "SKIP",
      `cannot read ${path}: ${(err as Error).message}`,
    );
  }
  // Look for `yield sentinel;` followed by `return;` inside the catch
  // path. The compiled output preserves the comments between them, so
  // allow up to ~600 chars of intermediate text (comments / whitespace)
  // but stop before the next `yield` statement so we don't match across
  // the post-stream detect block.
  const yieldThenReturn =
    /yield\s+sentinel\s*;[^;]*?(?:\/\/[^\n]*\n[^;]*?)*return\s*;/m.test(src);
  if (yieldThenReturn) {
    record(
      testName,
      "PASS",
      `'yield sentinel; return;' present in dist artifact`,
    );
  } else {
    record(
      testName,
      "FAIL",
      `bug-confirmed: 'yield sentinel; return;' not found in shipped StreamHandler — the catch path can fall through to post-stream detection and emit a duplicate sentinel`,
    );
  }
}

// ---------------------------------------------------------------------------
//   Test 6.7 — REGRESSION: Pipeline B preserves the enriched
//   langfuse.status_message StreamHandler stamps (reviewer Finding #1 —
//   instrumentation.ts previously overwrote it unconditionally).
// ---------------------------------------------------------------------------
async function test_6_7_pipeline_b_preserves_status_message(): Promise<void> {
  const testName =
    "6.7 — REGRESSION: Pipeline B applyNonErrorLangfuseLevel preserves enriched langfuse.status_message";
  const fs = await import("node:fs/promises");
  const path = "dist/lib/services/server/ai/observability/instrumentation.js";
  let src: string;
  try {
    src = await fs.readFile(path, "utf-8");
  } catch (err) {
    return record(
      testName,
      "SKIP",
      `cannot read ${path}: ${(err as Error).message}`,
    );
  }
  // The fix gates the overwrite on the existing message being absent.
  // Look for that gating pattern near the no_output branch.
  const noOutputBranch =
    /neurolink\.no_output[\s\S]{0,400}?typeof\s+attrs\["langfuse\.status_message"\]\s*!==\s*"string"/.test(
      src,
    );
  if (noOutputBranch) {
    record(
      testName,
      "PASS",
      `applyNonErrorLangfuseLevel gates the no_output overwrite on the existing message being absent`,
    );
  } else {
    record(
      testName,
      "FAIL",
      `bug-confirmed: applyNonErrorLangfuseLevel still unconditionally overwrites langfuse.status_message — StreamHandler's enriched message is lost in Pipeline B`,
    );
  }
}

// ---------------------------------------------------------------------------
//   Test 6.8 — REGRESSION: OpenRouter and LiteLLM gate on contentYielded,
//   not raw chunkCount (reviewer Finding #1: AI SDK fullStream emits
//   { type: "start" } before any text-delta, so chunkCount is non-zero
//   even when no content was produced — making the post-stream NoOutput
//   detect dead).
// ---------------------------------------------------------------------------
async function test_6_8_fullstream_providers_gate_on_content_yielded(): Promise<void> {
  const testName =
    "6.8 — REGRESSION: OpenRouter/LiteLLM gate post-stream NoOutput detect on contentYielded, not raw chunkCount";
  const fs = await import("node:fs/promises");
  const targets = [
    "dist/lib/providers/openRouter.js",
    "dist/lib/providers/litellm.js",
  ];
  const issues: string[] = [];
  for (const path of targets) {
    let src: string;
    try {
      src = await fs.readFile(path, "utf-8");
    } catch (err) {
      issues.push(`cannot read ${path}: ${(err as Error).message}`);
      continue;
    }
    // Look for the production-fix gate. Both providers should reference
    // `contentYielded` (the corrected counter). If either still uses
    // `chunkCount` near `detectPostStreamNoOutput`, the gate is dead.
    const usesContentYielded =
      /contentYielded\s*===\s*0[\s\S]{0,400}?detectPostStreamNoOutput/.test(
        src,
      );
    if (!usesContentYielded) {
      issues.push(
        `${path}: 'contentYielded === 0 ... detectPostStreamNoOutput' pattern not found`,
      );
    }
  }
  if (issues.length === 0) {
    record(
      testName,
      "PASS",
      `both fullStream providers gate post-stream detect on contentYielded`,
    );
  } else {
    record(testName, "FAIL", `bug-confirmed: ${issues.join("; ")}`);
  }
}

// ---------------------------------------------------------------------------
//   Test 6.9 — REGRESSION: every wired provider stamps the active OTel
//   span via `stampNoOutputSpan` so Pipeline B sees the WARNING level
//   (reviewer Finding #2: previously only StreamHandler stamped the span,
//   so provider-specific paths yielded the sentinel to direct consumers
//   but Pipeline B saw nothing).
// ---------------------------------------------------------------------------
async function test_6_9_all_wired_sites_stamp_otel_span(): Promise<void> {
  const fs = await import("node:fs/promises");
  const targets = [
    "providers/openAI",
    "providers/openaiCompatible",
    "providers/litellm",
    "providers/huggingFace",
    "providers/openRouter",
    "providers/anthropicBaseProvider",
    "core/modules/StreamHandler",
  ];
  for (const t of targets) {
    const testName = `6.9 — ${t} stamps OTel span via stampNoOutputSpan`;
    const path = `dist/lib/${t}.js`;
    let src: string;
    try {
      src = await fs.readFile(path, "utf-8");
    } catch (err) {
      record(
        testName,
        "SKIP",
        `cannot read ${path}: ${(err as Error).message}`,
      );
      continue;
    }
    if (/stampNoOutputSpan/.test(src)) {
      record(testName, "PASS", `stampNoOutputSpan call present`);
    } else {
      record(
        testName,
        "FAIL",
        `bug-confirmed: stampNoOutputSpan not called — Pipeline B will not see no_output for this site`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
//   Test 6.10 — REGRESSION: buildNoOutputStatusMessage handles AI SDK v6
//   usage shape (reviewer Finding #5: previously only read v4
//   promptTokens/completionTokens; v6 uses inputTokens/outputTokens).
// ---------------------------------------------------------------------------
async function test_6_10_status_message_handles_v6_usage(): Promise<void> {
  const testName =
    "6.10 — REGRESSION: buildNoOutputStatusMessage reads AI SDK v6 usage fields";
  const mod = await import("../dist/lib/utils/noOutputSentinel.js");
  // v6 shape
  const v6 = mod.buildNoOutputStatusMessage("stop", {
    inputTokens: 42,
    outputTokens: 7,
  });
  // v4 shape
  const v4 = mod.buildNoOutputStatusMessage("stop", {
    promptTokens: 42,
    completionTokens: 7,
  });
  const v6OK = v6.includes("inputTokens=42") && v6.includes("outputTokens=7");
  const v4OK = v4.includes("inputTokens=42") && v4.includes("outputTokens=7");
  if (v6OK && v4OK) {
    record(testName, "PASS", `both v4 and v6 shapes surface 42/7`);
  } else {
    record(
      testName,
      "FAIL",
      `bug-confirmed: v6=${v6OK ? "ok" : v6}, v4=${v4OK ? "ok" : v4}`,
    );
  }
}

// ---------------------------------------------------------------------------
//   Test 6.11 — REGRESSION: NeuroLink wrapper distinguishes sentinel
//   chunks from real content for fallback purposes (reviewer Finding:
//   AI SDK can mask real provider failures as NoOutputGeneratedError;
//   counting the sentinel as content suppresses handleStreamFallback
//   so the failure goes silent. Use realContentChunks for the fallback
//   gate instead).
// ---------------------------------------------------------------------------
async function test_6_11_wrapper_excludes_sentinel_from_fallback_gate(): Promise<void> {
  const testName =
    "6.11 — REGRESSION: NeuroLink stream wrapper excludes NoOutputSentinel from fallback content gate";
  const fs = await import("node:fs/promises");
  const path = "dist/lib/neurolink.js";
  let src: string;
  try {
    src = await fs.readFile(path, "utf-8");
  } catch (err) {
    return record(
      testName,
      "SKIP",
      `cannot read ${path}: ${(err as Error).message}`,
    );
  }
  const usesRealOutputChunks =
    /realOutputChunks\s*===\s*0[\s\S]{0,500}?handleStreamFallback/.test(src);
  const incrementsForRealOnly =
    /isNoOutputSentinel[\s\S]{0,400}?realOutputChunks\+\+/.test(src);
  if (usesRealOutputChunks && incrementsForRealOnly) {
    record(
      testName,
      "PASS",
      `wrapper gates fallback on realOutputChunks and excludes sentinel chunks from the count`,
    );
  } else {
    record(
      testName,
      "FAIL",
      `bug-confirmed: gate=${usesRealOutputChunks}, exclusion=${incrementsForRealOnly} — real provider failures masked as NoOutput will not trigger fallback`,
    );
  }
}

// ---------------------------------------------------------------------------
//   Test 6.12 — REGRESSION: media-only streams (audio, image) are NOT
//   counted as "no output" by the wrapper's fallback gate (reviewer
//   Finding #1: previous fix counted only text content, so valid
//   audio-only Google Live streams and image-only generators triggered
//   spurious text fallback).
// ---------------------------------------------------------------------------
async function test_6_12_media_chunks_count_as_real_output(): Promise<void> {
  const testName =
    "6.12 — REGRESSION: wrapper counts audio/image chunks as real output (no spurious fallback)";
  const fs = await import("node:fs/promises");
  const path = "dist/lib/neurolink.js";
  let src: string;
  try {
    src = await fs.readFile(path, "utf-8");
  } catch (err) {
    return record(
      testName,
      "SKIP",
      `cannot read ${path}: ${(err as Error).message}`,
    );
  }
  // The fix increments realOutputChunks when the chunk has either
  // text content OR a media payload (type === "audio" / "image").
  const handlesMedia =
    /hasMediaPayload[\s\S]{0,200}?(?:"audio"|'audio')[\s\S]{0,200}?(?:"image"|'image')/.test(
      src,
    );
  // The variable should be named realOutputChunks (not realContentChunks
  // which would imply text-only).
  const usesRealOutputChunks = /realOutputChunks/.test(src);
  if (handlesMedia && usesRealOutputChunks) {
    record(
      testName,
      "PASS",
      `wrapper counts media chunks (audio/image) as real output and gates fallback on realOutputChunks`,
    );
  } else {
    record(
      testName,
      "FAIL",
      `bug-confirmed: handlesMedia=${handlesMedia}, realOutputChunks=${usesRealOutputChunks} — media-only streams will trigger spurious text fallback`,
    );
  }
}

// ---------------------------------------------------------------------------
//   Test 6.13 — REGRESSION: helper accepts an `underlyingError` parameter
//   so providers' onError-captured errors propagate into the sentinel
//   (reviewer Finding #2: AI SDK NoOutputGeneratedError carries no
//   `cause`, so without the captured upstream error the sentinel
//   defaults to generic "No output generated" messages).
// ---------------------------------------------------------------------------
async function test_6_13_helper_accepts_underlying_error(): Promise<void> {
  const testName =
    "6.13 — REGRESSION: buildNoOutputSentinel accepts underlyingError and prefers it for providerError/modelResponseRaw";
  const mod = await import("../dist/lib/utils/noOutputSentinel.js");
  const aiSdkError = new Error(
    "No output generated. Check the stream for errors.",
  );
  aiSdkError.name = "AI_NoOutputGeneratedError";
  const realProviderError = new Error(
    "OpenRouter: 503 — upstream model overloaded",
  );
  const sentinel = await mod.buildNoOutputSentinel(
    aiSdkError,
    undefined,
    realProviderError,
  );
  const meta = (sentinel as { metadata: Record<string, unknown> }).metadata;
  const issues: string[] = [];
  if (
    typeof meta.providerError !== "string" ||
    !meta.providerError.includes("upstream model overloaded")
  ) {
    issues.push(
      `providerError="${String(meta.providerError).slice(0, 80)}" (expected to include the upstream error)`,
    );
  }
  if (
    typeof meta.modelResponseRaw !== "string" ||
    !meta.modelResponseRaw.includes("upstream model overloaded")
  ) {
    issues.push(
      `modelResponseRaw="${String(meta.modelResponseRaw).slice(0, 80)}" (expected to include the upstream error)`,
    );
  }
  if (issues.length === 0) {
    record(
      testName,
      "PASS",
      `underlyingError surfaces in providerError + modelResponseRaw instead of the generic AI SDK message`,
    );
  } else {
    record(testName, "FAIL", `bug-confirmed: ${issues.join("; ")}`);
  }
}

// ---------------------------------------------------------------------------
//   Test 6.14 — REGRESSION: providers capture onError into a closure-scoped
//   variable and pass it to buildNoOutputSentinel / detectPostStreamNoOutput.
//   Lock this in for all 5 providers that go through their own streamText
//   call (StreamHandler-based providers don't have their own streamText).
// ---------------------------------------------------------------------------
async function test_6_14_providers_capture_and_pass_error(): Promise<void> {
  const fs = await import("node:fs/promises");
  const targets = [
    "providers/openAI",
    "providers/openaiCompatible",
    "providers/litellm",
    "providers/huggingFace",
    "providers/openRouter",
    "providers/anthropicBaseProvider",
  ];
  for (const t of targets) {
    const testName = `6.14 — ${t} captures onError and passes underlyingError to NoOutput helpers`;
    const path = `dist/lib/${t}.js`;
    let src: string;
    try {
      src = await fs.readFile(path, "utf-8");
    } catch (err) {
      record(
        testName,
        "SKIP",
        `cannot read ${path}: ${(err as Error).message}`,
      );
      continue;
    }
    const capturesOnError =
      /capturedProviderError\s*=\s*(?:event\.error|error)/.test(src);
    const passesToHelper =
      /capturedProviderError(?:\s*\)|\s*,)|getCapturedProviderError\s*\?\s*\.\s*\(/.test(
        src,
      );
    if (capturesOnError && passesToHelper) {
      record(testName, "PASS", `captures onError and threads through helpers`);
    } else {
      record(
        testName,
        "FAIL",
        `bug-confirmed: capture=${capturesOnError}, passes=${passesToHelper}`,
      );
    }
  }
}

async function main(): Promise<void> {
  section("Issue #6 — NoOutputGeneratedError sentinel chunk metadata");
  await test_6_static_artifact_shape();
  await test_6_1_all_providers_wired();
  await test_6_2_helper_produces_full_sentinel();
  await test_6_3_helper_reads_partial_values();
  await test_6_4_helper_extracts_cause();
  await test_6_5_local_server_triggers_real_sentinel();
  await test_6_6_streamhandler_no_duplicate_sentinel();
  await test_6_7_pipeline_b_preserves_status_message();
  await test_6_8_fullstream_providers_gate_on_content_yielded();
  await test_6_9_all_wired_sites_stamp_otel_span();
  await test_6_10_status_message_handles_v6_usage();
  await test_6_11_wrapper_excludes_sentinel_from_fallback_gate();
  await test_6_12_media_chunks_count_as_real_output();
  await test_6_13_helper_accepts_underlying_error();
  await test_6_14_providers_capture_and_pass_error();
  for (const t of TARGETS) {
    await reproduceForTarget(t);
    await new Promise((r) => setTimeout(r, 1000));
  }
  const passed = results.filter((r) => r.outcome === "PASS").length;
  const failed = results.filter((r) => r.outcome === "FAIL").length;
  const skipped = results.filter((r) => r.outcome === "SKIP").length;
  console.log(
    `\n${colors.bright}Results:${colors.reset} ${passed} passed, ${failed} failed, ${skipped} skipped`,
  );
  // Reviewer follow-up: exit non-zero on failures so CI actually catches
  // regressions of the enriched sentinel contract.
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
