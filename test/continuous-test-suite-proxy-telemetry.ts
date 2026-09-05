#!/usr/bin/env tsx
/**
 * Determinism exception (CLAUDE.md rule 15): delayed and partially successful
 * filesystem writes, recorded upstream stream faults, and terminal-frame close
 * races cannot be produced on demand with a live provider. Fixtures drive the
 * real HTTP application and built analyze CLI in an isolated home. Every
 * provider response is recorded; the installed proxy is never a test target.
 */
import "./helpers/proxyTestIsolation.js";
import { appendFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { assert, assertEqual, defineSuite, runCLI } from "./helpers/harness.js";
import {
  __proxyLifecycleTestHooks,
  configureProxyLifecycleLogger,
  flushProxyLifecycleEvents,
  getProxyLifecycleLoggerSnapshot,
  logProxyLifecycleEvent,
  resetProxyLifecycleLoggerForTests,
} from "../src/lib/proxy/proxyLifecycle.js";
import {
  initRequestLogger,
  logRequest,
  getRequestLoggerSnapshot,
  flushRequestLogs,
  __requestLoggerTestHooks,
} from "../src/lib/proxy/requestLogger.js";
import { createProxyStartApp } from "../src/cli/commands/proxy.js";
import { getProxyActivitySnapshot } from "../src/lib/proxy/proxyActivity.js";
import { ProxyRuntimeConfigStore } from "../src/lib/proxy/runtimeConfig.js";
import { tokenStore } from "../src/lib/auth/tokenStore.js";

const { test, runSuite } = defineSuite("Proxy Telemetry Accuracy", {
  offline: true,
});
const pause = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
async function eventually(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 4_000;
  while (!predicate() && Date.now() < deadline) {
    await pause(5);
  }
  assert(predicate(), "terminal bookkeeping did not settle");
}
async function withWriter(run: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "telemetry-writer-"));
  resetProxyLifecycleLoggerForTests();
  configureProxyLifecycleLogger({
    enabled: true,
    logDir: dir,
    flushIntervalMs: 10_000,
  });
  try {
    await run(dir);
  } finally {
    await flushProxyLifecycleEvents();
    resetProxyLifecycleLoggerForTests();
    await rm(dir, { recursive: true, force: true });
  }
}
function enqueue(id = "one") {
  logProxyLifecycleEvent({
    event: "request_accepted",
    requestId: id,
    method: "POST",
    path: "/v1/messages",
  });
}
async function lines(
  dir: string,
  prefix: string,
): Promise<Array<Record<string, unknown>>> {
  const file = join(
    dir,
    `${prefix}-${new Date().toISOString().slice(0, 10)}.jsonl`,
  );
  return (await readFile(file, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

await test("a late successful append is never retried while its original write is pending", async () => {
  await withWriter(async (dir) => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    __proxyLifecycleTestHooks.setAppendFileForTests(async (...args) => {
      calls += 1;
      await gate;
      return appendFile(...args);
    });
    enqueue();
    const draining = flushProxyLifecycleEvents();
    await pause(2_100);
    assertEqual(calls, 1, "a pending append was replayed");
    assertEqual(
      getProxyLifecycleLoggerSnapshot().writeTimeouts,
      1,
      "slow write was not visible",
    );
    assertEqual(
      getProxyLifecycleLoggerSnapshot().written,
      0,
      "pending write was reported as confirmed",
    );
    release();
    await draining;
    assertEqual(
      (await lines(dir, "proxy-lifecycle")).length,
      1,
      "late write duplicated a record",
    );
    assertEqual(
      getProxyLifecycleLoggerSnapshot().written,
      1,
      "late completion was not confirmed",
    );
  });
});

await test("an ambiguous append failure retains uncertainty without replaying a committed prefix", async () => {
  await withWriter(async (dir) => {
    let calls = 0;
    __proxyLifecycleTestHooks.setAppendFileForTests(async (...args) => {
      calls += 1;
      await appendFile(...args);
      throw Object.assign(new Error("recorded write fault"), { code: "EIO" });
    });
    enqueue();
    await flushProxyLifecycleEvents();
    assertEqual(calls, 1, "uncertain append was replayed");
    assertEqual(
      (await lines(dir, "proxy-lifecycle")).length,
      1,
      "uncertain write duplicated a record",
    );
    assertEqual(
      getProxyLifecycleLoggerSnapshot().unconfirmedWrites,
      1,
      "uncertain result was hidden",
    );
    assertEqual(
      getProxyLifecycleLoggerSnapshot().written,
      0,
      "uncertain result was claimed as confirmed",
    );
  });
});

await test("a definite open failure can recover without duplicate records", async () => {
  await withWriter(async (dir) => {
    let calls = 0;
    __proxyLifecycleTestHooks.setAppendFileForTests(async (...args) => {
      if (++calls === 1) {
        throw Object.assign(new Error("recorded open fault"), {
          code: "EACCES",
        });
      }
      return appendFile(...args);
    });
    enqueue();
    await flushProxyLifecycleEvents();
    assertEqual(
      (await lines(dir, "proxy-lifecycle")).length,
      1,
      "recovered write was not unique",
    );
    assertEqual(
      getProxyLifecycleLoggerSnapshot().writeRetries,
      1,
      "retry accounting was wrong",
    );
  });
});

await test("a flush deadline preserves ownership and pending counters", async () => {
  await withWriter(async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    __proxyLifecycleTestHooks.setAppendFileForTests(async (...args) => {
      await gate;
      return appendFile(...args);
    });
    enqueue();
    let timedOut = false;
    try {
      await flushProxyLifecycleEvents(10);
    } catch {
      timedOut = true;
    }
    assert(timedOut, "flush did not honor its deadline");
    assertEqual(
      getProxyLifecycleLoggerSnapshot().inFlight,
      1,
      "flush discarded a pending write",
    );
    release();
    await flushProxyLifecycleEvents();
  });
  let release = () => {};
  const operation = new Promise<void>((resolve) => {
    release = resolve;
  });
  __requestLoggerTestHooks.trackLogOperation(operation);
  try {
    await flushRequestLogs(10);
  } catch {
    /* expected deadline */
  }
  assertEqual(
    __requestLoggerTestHooks.pendingOperationCount(),
    1,
    "request flush forgot an unsettled operation",
  );
  release();
  await flushRequestLogs();
});

await test("queue pressure is counted without replaying or interleaving metadata", async () => {
  const dir = await mkdtemp(join(tmpdir(), "telemetry-pressure-"));
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  initRequestLogger(true, dir);
  const before = getRequestLoggerSnapshot().requests;
  __requestLoggerTestHooks.setAppendFileForTests(async (...args) => {
    calls += 1;
    await gate;
    if (calls === 1) {
      throw Object.assign(new Error("recorded write fault"), { code: "EIO" });
    }
    return writeFile(...args);
  });
  try {
    const writes = Array.from({ length: 4_100 }, (_, index) =>
      logRequest({
        timestamp: new Date().toISOString(),
        requestId: `pressure-${index}`,
        method: "POST",
        path: "/v1/messages",
        model: "fixture",
        stream: false,
        toolCount: 0,
        account: "fixture",
        accountType: "oauth",
        responseStatus: 200,
        responseTimeMs: 1,
      }),
    );
    await pause(10);
    const pending = getRequestLoggerSnapshot().requests;
    assertEqual(calls, 1, "concurrent metadata writes were not serialized");
    assertEqual(pending.inFlight, 1, "active write count was wrong");
    assertEqual(pending.pending, 4_095, "queued records were not visible");
    assertEqual(
      pending.dropped - before.dropped,
      4,
      "queue overflow was hidden",
    );
    release();
    await Promise.all(writes);
    await flushRequestLogs();
    const after = getRequestLoggerSnapshot().requests;
    assertEqual(
      after.written - before.written,
      4_095,
      "confirmed records were miscounted",
    );
    assertEqual(
      after.unconfirmedWrites - before.unconfirmedWrites,
      1,
      "failed append uncertainty was hidden",
    );
    assertEqual(
      after.inFlight + after.pending,
      0,
      "settled writes remained pending",
    );
    const records = await lines(dir, "proxy");
    assertEqual(
      new Set(records.map((r) => r.requestId)).size,
      4_095,
      "metadata records were duplicated or corrupted",
    );
  } finally {
    release();
    await flushRequestLogs();
    __requestLoggerTestHooks.restoreAppendFileForTests();
    initRequestLogger(false);
    await rm(dir, { recursive: true, force: true });
  }
});

await test("lifecycle queue overflow preserves its accounting identity", async () => {
  await withWriter(async (dir) => {
    configureProxyLifecycleLogger({
      enabled: true,
      logDir: dir,
      queueCapacity: 2,
      flushIntervalMs: 10_000,
    });
    enqueue("a");
    enqueue("b");
    enqueue("c");
    const snapshot = getProxyLifecycleLoggerSnapshot();
    assertEqual(snapshot.attempted, 3, "admission counter lost events");
    assertEqual(snapshot.queueDrops, 1, "queue loss was hidden");
    await flushProxyLifecycleEvents();
    assertEqual(
      (await lines(dir, "proxy-lifecycle")).length,
      2,
      "admitted records were not retained",
    );
  });
});

async function withHttpFixture(
  provider: "anthropic" | "codex" | "fallback",
  upstream: () => Response,
  run: (response: Response, dir: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "telemetry-http-"));
  const key = `${provider === "fallback" ? "codex" : provider}:telemetry@example.test`;
  const oldFetch = globalThis.fetch;
  initRequestLogger(true, dir);
  await tokenStore.saveTokens(key, {
    accessToken: "isolated-fixture",
    tokenType: "Bearer",
    expiresAt: Date.now() + 3_600_000,
  });
  globalThis.fetch = async (input) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    if (
      (url.hostname === "api.anthropic.com" &&
        url.pathname.endsWith("/messages")) ||
      (url.hostname === "chatgpt.com" && url.pathname.endsWith("/responses"))
    ) {
      return upstream();
    }
    return new Response("{}", {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const configPath = join(dir, "fixture-config.json");
    if (provider === "fallback") {
      await writeFile(
        configPath,
        JSON.stringify({
          routing: {
            fallbackChain: [
              {
                provider: "codex",
                model: "gpt-6-astra",
                reasoningEffort: "xhigh",
              },
            ],
          },
        }),
      );
    }
    const runtimeConfigStore =
      provider === "fallback"
        ? await ProxyRuntimeConfigStore.create({
            configPath,
            configRequired: true,
            baseEnv: {},
            passthrough: false,
          })
        : undefined;
    const { app } = await createProxyStartApp({
      runtimeConfigStore,
      neurolink: { getToolRegistry: () => ({}) } as Parameters<
        typeof createProxyStartApp
      >[0]["neurolink"],
      modelRouter: undefined,
      strategy: "fill-first",
      passthrough: false,
      port: 0,
      host: "127.0.0.1",
      proxyConfig:
        provider === "fallback"
          ? {
              routing: {
                fallbackChain: [
                  {
                    provider: "codex",
                    model: "gpt-6-astra",
                    reasoningEffort: "xhigh",
                  },
                ],
              },
            }
          : null,
      primaryAccountKey: undefined,
      accountAllowlist: new Set([key]),
    });
    const path =
      provider !== "codex" ? "/v1/messages" : "/backend-api/codex/responses";
    const body =
      provider !== "codex"
        ? {
            model: "claude-sonnet-5",
            stream: true,
            max_tokens: 128,
            messages: [{ role: "user", content: "fixture" }],
          }
        : {
            model: "gpt-6-astra",
            stream: true,
            reasoning: { effort: "xhigh" },
            input: [],
          };
    const response = await app.request(`http://localhost${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    await run(response, dir);
  } finally {
    globalThis.fetch = oldFetch;
    await eventually(() => getProxyActivitySnapshot().activeRequests === 0);
    await flushRequestLogs();
    await flushProxyLifecycleEvents();
    initRequestLogger(false);
    await tokenStore.clearTokens(key);
    await rm(dir, { recursive: true, force: true });
  }
}
async function recordsAfterBody(dir: string) {
  await eventually(() => getProxyActivitySnapshot().activeRequests === 0);
  await flushRequestLogs();
  await flushProxyLifecycleEvents();
  return {
    finals: await lines(dir, "proxy"),
    terminals: (await lines(dir, "proxy-lifecycle")).filter(
      (r) => r.event === "request_terminal",
    ),
  };
}
const sse = (type: string, data: Record<string, unknown> = {}) =>
  `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
const encoder = new TextEncoder();

await test("HTTP Anthropic mid-stream read failure has one matching semantic outcome", async () => {
  await withHttpFixture(
    "anthropic",
    () => {
      let read = 0;
      return new Response(
        new ReadableStream<Uint8Array>({
          pull(controller) {
            if (read++ === 0) {
              controller.enqueue(
                encoder.encode(
                  sse("message_start", {
                    message: {
                      id: "fixture",
                      model: "claude-sonnet-5",
                      usage: { input_tokens: 3 },
                    },
                  }),
                ),
              );
            } else {
              controller.error(
                Object.assign(new Error("recorded stream read fault"), {
                  code: "ETIMEDOUT",
                }),
              );
            }
          },
        }),
        { headers: { "content-type": "text/event-stream" } },
      );
    },
    async (response, dir) => {
      assertEqual(
        response.status,
        200,
        "fixture did not commit response headers",
      );
      await response.text();
      const { finals, terminals } = await recordsAfterBody(dir);
      assertEqual(finals.length, 1, "final accounting was not unique");
      assertEqual(terminals.length, 1, "lifecycle accounting was not unique");
      assertEqual(
        finals[0].responseStatus,
        502,
        "final accounting lost the stream failure",
      );
      assertEqual(
        terminals[0].terminalOutcome,
        "stream_error",
        "lifecycle claimed successful completion",
      );
      assertEqual(terminals[0].finalStatus, 502, "semantic status was lost");
      assertEqual(
        terminals[0].responseStatus,
        200,
        "committed wire status was rewritten",
      );
    },
  );
});

for (const [name, body] of [
  [
    "in-band failure",
    sse("response.failed", {
      response: { error: { code: "fixture", message: "recorded refusal" } },
    }),
  ],
  [
    "truncated response",
    sse("response.output_text.delta", { delta: "partial" }),
  ],
] as const) {
  await test(`HTTP Codex ${name} is not counted as successful transport EOF`, async () => {
    await withHttpFixture(
      "codex",
      () =>
        new Response(body, {
          headers: { "content-type": "text/event-stream" },
        }),
      async (response, dir) => {
        await response.text();
        const { finals, terminals } = await recordsAfterBody(dir);
        assertEqual(
          finals[0].responseStatus,
          502,
          "protocol failure was counted as success",
        );
        assertEqual(
          terminals[0].terminalOutcome,
          "stream_error",
          "lifecycle lost the protocol failure",
        );
      },
    );
  });
}

await test("HTTP Codex empty body and an unterminated completion frame remain failures", async () => {
  for (const body of [null, 'data: {"type":"response.completed"}\n']) {
    await withHttpFixture(
      "codex",
      () => new Response(body),
      async (response, dir) => {
        await response.text();
        const { finals, terminals } = await recordsAfterBody(dir);
        assertEqual(
          finals[0].responseStatus,
          502,
          "missing protocol completion became success",
        );
        assertEqual(
          terminals[0].terminalOutcome,
          "stream_error",
          "missing completion evidence was lost",
        );
      },
    );
  }
});

await test("HTTP Codex split multiline CRLF frames retain usage and precise provider cause", async () => {
  const body =
    'event:response.failed\r\ndata: {"type":"response.failed",\r\ndata: "response":{"error":{"code":"fixture_cause","message":"recorded refusal"},"usage":{"input_tokens":3,"output_tokens":1}}}\r\n\r\n';
  await withHttpFixture(
    "codex",
    () => {
      let offset = 0;
      return new Response(
        new ReadableStream<Uint8Array>({
          pull(controller) {
            if (offset >= body.length) {
              controller.close();
              return;
            }
            controller.enqueue(encoder.encode(body.slice(offset, offset + 7)));
            offset += 7;
          },
        }),
      );
    },
    async (response, dir) => {
      assertEqual(await response.text(), body, "relay changed recorded bytes");
      const { finals } = await recordsAfterBody(dir);
      assertEqual(
        finals[0].errorCode,
        "fixture_cause",
        "provider cause was replaced by a generic category",
      );
      assertEqual(finals[0].inputTokens, 3, "multiline usage was lost");
      const attempts = await lines(dir, "proxy-attempts");
      assertEqual(
        attempts.length,
        2,
        "attempt completion evidence was missing",
      );
      assertEqual(
        attempts[1].errorCode,
        "fixture_cause",
        "attempt cause was missing",
      );
    },
  );
});

for (const provider of ["codex", "anthropic"] as const) {
  await test(`HTTP ${provider} cancellation before completion stays a cancellation`, async () => {
    await withHttpFixture(
      provider,
      () =>
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  provider === "codex"
                    ? sse("response.output_text.delta", { delta: "partial" })
                    : sse("message_start", {
                        message: {
                          id: "fixture",
                          model: "claude-sonnet-5",
                          usage: { input_tokens: 3 },
                        },
                      }),
                ),
              );
            },
          }),
        ),
      async (response, dir) => {
        const reader = response.body!.getReader();
        const first = await reader.read();
        assert(!first.done, "fixture did not deliver any response bytes");
        await reader.cancel();
        const { finals, terminals } = await recordsAfterBody(dir);
        assertEqual(
          finals.length,
          1,
          "cancellation had no unique final record",
        );
        assertEqual(
          finals[0].responseStatus,
          499,
          "early close became successful completion",
        );
        assertEqual(
          terminals[0].terminalOutcome,
          "client_cancelled",
          "lifecycle lost cancellation",
        );
      },
    );
  });
}

await test("HTTP Codex upstream read errors retain their transport code", async () => {
  await withHttpFixture(
    "codex",
    () => {
      let reads = 0;
      return new Response(
        new ReadableStream<Uint8Array>({
          pull(controller) {
            if (reads++ === 0) {
              controller.enqueue(
                encoder.encode(
                  sse("response.output_text.delta", { delta: "partial" }),
                ),
              );
            } else {
              controller.error(
                Object.assign(new Error("recorded read fault"), {
                  code: "ECONNRESET",
                }),
              );
            }
          },
        }),
      );
    },
    async (response, dir) => {
      let rejected = false;
      try {
        await response.text();
      } catch {
        rejected = true;
      }
      assert(rejected, "fixture failed to exercise a read fault");
      const { finals, terminals } = await recordsAfterBody(dir);
      assertEqual(
        finals[0].errorCode,
        "ECONNRESET",
        "transport code was discarded",
      );
      assertEqual(
        terminals[0].errorCode,
        "ECONNRESET",
        "lifecycle discarded transport code",
      );
    },
  );
});

await test("HTTP Codex close after its completion frame records success exactly once", async () => {
  const body =
    sse("response.output_text.delta", { delta: "done" }) +
    sse("response.completed", {
      response: { usage: { input_tokens: 3, output_tokens: 1 } },
    });
  await withHttpFixture(
    "codex",
    () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(encoder.encode(body));
          },
        }),
        { headers: { "content-type": "text/event-stream" } },
      ),
    async (response, dir) => {
      const reader = response.body!.getReader();
      await reader.read();
      await reader.cancel();
      const { finals, terminals } = await recordsAfterBody(dir);
      assertEqual(finals.length, 1, "final accounting was duplicated");
      assertEqual(
        finals[0].responseStatus,
        200,
        "terminal frame close was counted as cancellation",
      );
      assertEqual(
        terminals[0].terminalOutcome,
        "completed",
        "lifecycle disagreed with terminal frame delivery",
      );
      assert(
        typeof finals[0].firstUsefulOutputMs === "number",
        "useful output timing was not retained",
      );
      const attempts = await lines(dir, "proxy-attempts");
      assertEqual(
        attempts[0].reasoningEffort,
        "xhigh",
        "effort required a retained body to reconstruct",
      );
    },
  );
});

await test("HTTP Claude fallback retains Astra effort, parent identity, and child stream failure", async () => {
  const body =
    sse("response.output_text.delta", { delta: "partial" }) +
    sse("response.failed", {
      response: {
        error: { code: "fixture_cause", message: "recorded refusal" },
      },
    });
  await withHttpFixture(
    "fallback",
    () =>
      new Response(body, { headers: { "content-type": "text/event-stream" } }),
    async (response, dir) => {
      await response.text();
      const { finals, terminals } = await recordsAfterBody(dir);
      assertEqual(
        finals.length,
        1,
        "fallback created more than one client final",
      );
      assertEqual(
        finals[0].responseStatus,
        502,
        "fallback stream failure became success",
      );
      assertEqual(
        terminals[0].terminalOutcome,
        "stream_error",
        "fallback lifecycle lost the stream failure",
      );
      const attempts = await lines(dir, "proxy-attempts");
      const child = attempts.find(
        (record) => record.errorCode === "fixture_cause",
      );
      assert(child !== undefined, "child attempt terminal evidence was lost");
      assertEqual(
        child?.parentRequestId,
        finals[0].requestId,
        "child attempt was orphaned",
      );
      assertEqual(
        child?.model,
        "gpt-6-astra",
        "attempt lost the selected model",
      );
      assertEqual(
        child?.reasoningEffort,
        "xhigh",
        "attempt lost the selected effort",
      );
      const plan = finals[0].fallbackPlan as Array<Record<string, unknown>>;
      assert(
        plan.some(
          (entry) =>
            entry.model === "gpt-6-astra" && entry.reasoningEffort === "xhigh",
        ),
        "fallback plan required a retained body",
      );
    },
  );
});

await test("slow final metadata I/O cannot inflate relay latency or change model success", async () => {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  __requestLoggerTestHooks.setAppendFileForTests(async (...args) => {
    await gate;
    return writeFile(...args);
  });
  try {
    await withHttpFixture(
      "codex",
      () => new Response(sse("response.completed")),
      async (response, dir) => {
        const start = performance.now();
        await response.text();
        assert(
          performance.now() - start < 1_000,
          "metadata delayed response EOF",
        );
        await eventually(() => getProxyActivitySnapshot().activeRequests === 0);
        release();
        const { finals, terminals } = await recordsAfterBody(dir);
        assertEqual(
          finals[0].responseStatus,
          200,
          "slow logging changed model success",
        );
        assertEqual(
          terminals[0].telemetryStatus,
          "timeout",
          "bookkeeping delay was hidden",
        );
        assertEqual(
          terminals[0].errorType,
          undefined,
          "logging delay became a provider error",
        );
        assert(
          Number(terminals[0].elapsedMs) < 1_000,
          "relay latency included log I/O",
        );
      },
    );
  } finally {
    release();
    __requestLoggerTestHooks.restoreAppendFileForTests();
  }
});

await test("built analyze reconciles failures, deduplicates timings, and joins fallback attempts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "telemetry-analysis-"));
  const timestamp = "2026-01-01T00:00:05.000Z";
  const common = {
    schemaVersion: 1,
    timestamp,
    processInstanceId: "fixture",
    method: "POST",
    path: "/v1/messages",
  };
  const terminal = {
    ...common,
    requestId: "failed",
    sequence: 2,
    event: "request_terminal",
    terminalOutcome: "completed",
    responseStatus: 200,
    elapsedMs: 20,
  };
  const lifecycle = [
    { ...common, requestId: "failed", sequence: 1, event: "request_accepted" },
    terminal,
    terminal,
    { ...terminal, elapsedMs: 999 },
    { ...common, requestId: "missing", sequence: 3, event: "request_accepted" },
    {
      ...common,
      requestId: "missing",
      sequence: 4,
      event: "request_terminal",
      terminalOutcome: "completed",
      elapsedMs: 30,
    },
    {
      ...common,
      requestId: "recovered",
      sequence: 5,
      event: "request_accepted",
    },
    {
      ...common,
      requestId: "recovered",
      timestamp: "2026-01-02T00:00:05.000Z",
      sequence: 6,
      event: "request_terminal",
      terminalOutcome: "completed",
      elapsedMs: 40,
    },
  ];
  const finals = [
    {
      ...common,
      requestId: "failed",
      responseStatus: 502,
      errorType: "stream_error",
      responseTimeMs: 20,
    },
    {
      ...common,
      requestId: "recovered",
      timestamp: "2026-01-02T00:00:05.000Z",
      responseStatus: 200,
      responseTimeMs: 40,
      firstUsefulOutputMs: 25,
    },
  ];
  const child = {
    timestamp: "2026-01-02T00:00:05.000Z",
    requestId: "recovered:codex-fallback",
    parentRequestId: "recovered",
    attempt: 1,
    responseStatus: 200,
    attemptDurationMs: 8,
  };
  try {
    await writeFile(
      join(dir, "proxy-lifecycle-2026-01-01.jsonl"),
      lifecycle.map((r) => JSON.stringify(r)).join("\n") + "\n",
    );
    await writeFile(
      join(dir, "proxy-2026-01-01.jsonl"),
      finals.map((r) => JSON.stringify(r)).join("\n") + "\n",
    );
    await writeFile(
      join(dir, "proxy-attempts-2026-01-01.jsonl"),
      [
        {
          timestamp,
          requestId: "recovered",
          attempt: 1,
          responseStatus: 502,
          errorType: "network_error",
        },
        child,
        child,
      ]
        .map((r) => JSON.stringify(r))
        .join("\n") + "\n",
    );
    const result = await runCLI([
      "proxy",
      "analyze",
      "--logs-dir",
      dir,
      "--since",
      "2026-01-01T00:00:00Z",
      "--until",
      "2026-01-01T00:01:00Z",
      "--format",
      "json",
    ]);
    assertEqual(result.exitCode, 0, "analysis command failed");
    const report = JSON.parse(result.stdout.slice(result.stdout.indexOf("{")));
    assertEqual(
      report.lifecycle.terminalOutcomes.stream_error,
      1,
      "semantic failure was hidden",
    );
    assertEqual(
      report.lifecycle.terminalOutcomes.unknown,
      1,
      "missing final evidence became success",
    );
    assertEqual(
      report.latencyMs.terminal.count,
      2,
      "duplicate events biased latency",
    );
    assertEqual(
      report.requests.recoveredAfterRetry,
      1,
      "fallback recovery was not joined to its parent",
    );
    assertEqual(report.attempts.total, 2, "repeated attempt was counted twice");
    assertEqual(
      report.dataQuality.conflictingLifecycleDuplicates,
      1,
      "conflicting duplicate payloads were hidden",
    );
    assertEqual(
      report.dataQuality.finalOutcomeConflicts,
      1,
      "conflicting sources were hidden",
    );
    assertEqual(
      report.latencyMs.firstUsefulOutput.p50,
      25,
      "useful output timing was lost",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

await runSuite();
