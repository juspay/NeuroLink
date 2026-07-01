#!/usr/bin/env tsx
/**
 * Gemini-3 native Vertex loop: abortSignal wiring + graceful step-cap message.
 *
 * Covers the SPEC "UNIT TESTS" list for
 * `fix(vertex): honor abortSignal + graceful step-cap message in native
 *  Gemini-3 loop`:
 *   - pure exported helpers (buildToolLoopCapMessage / isAbortError /
 *     handleMaxStepsTermination)
 *   - the generate loop (executeNativeGemini3Generate) driven through a
 *     mock-injected `client.models.generateContentStream` (the private
 *     `createVertexGenAIClient` is overridden with a cast, matching the
 *     precedent in continuous-test-suite-bugfixes.ts)
 *   - the stream twin (executeNativeGemini3Stream)
 *   - synthesizeFinalAnswerWithoutTools abort-awareness
 *   - a source-level regression grep for the removed placeholder
 *
 * Runner: `npx tsx test/continuous-test-suite-gemini-abort.ts`
 * (package.json: `pnpm run test:gemini-abort`).
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  defineSuite,
  assert,
  assertEqual,
  assertIncludes,
} from "./helpers/harness.js";
import {
  buildToolLoopCapMessage,
  isAbortError,
  handleMaxStepsTermination,
} from "../src/lib/providers/googleNativeGemini3.js";
import { GoogleVertexProvider } from "../src/lib/providers/googleVertex.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Env: satisfy the GoogleVertexProvider constructor without live network.
// The provider only reads project/location + validates creds at construct
// time; the mock-injected createVertexGenAIClient means no client is ever
// really built. (Mirrors continuous-test-suite-bugfixes.ts withTemporaryEnv.)
// ---------------------------------------------------------------------------
/** Run `fn` with `updates` applied to `process.env`, restoring prior values after. */
async function withTemporaryEnv<T>(
  updates: Record<string, string | undefined>,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const key of Object.keys(updates)) {
    previous.set(key, process.env[key]);
    const next = updates[key];
    if (next === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = next;
    }
  }
  try {
    return await fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

const VERTEX_ENV = {
  GOOGLE_APPLICATION_CREDENTIALS: "/tmp/neurolink-gemini-abort-creds.json",
  GOOGLE_CLOUD_PROJECT_ID: "test-project",
  GOOGLE_CLOUD_PROJECT: "test-project",
  GOOGLE_CLOUD_LOCATION: "global",
};

const MODEL = "gemini-3-pro-preview";

// ---------------------------------------------------------------------------
// Mock @google/genai client
// ---------------------------------------------------------------------------

type GenParams = {
  model: string;
  contents: unknown;
  config: Record<string, unknown>;
};

type Chunk = Record<string, unknown>;

/** Async iterable over a static list of chunks. */
function chunks(list: Chunk[]): AsyncIterable<Chunk> {
  return (async function* () {
    for (const c of list) {
      yield c;
    }
  })();
}

/** A chunk that only requests a tool call (no text) — the "runaway" step. */
function functionCallChunk(name: string, args: Record<string, unknown>): Chunk {
  return {
    functionCalls: [{ name, args }],
    candidates: [
      {
        content: { parts: [{ functionCall: { name, args } }] },
        // no finishReason on a mid-turn tool-call chunk
      },
    ],
    usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3 },
  };
}

/** A plain-text terminal chunk (model stopped on its own). */
function textChunk(text: string, finishReason = "STOP"): Chunk {
  return {
    candidates: [
      {
        finishReason,
        content: { parts: [{ text }] },
      },
    ],
    usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 7 },
  };
}

type MockClient = {
  models: {
    generateContentStream: (p: GenParams) => Promise<AsyncIterable<Chunk>>;
  };
};

type Recorder = {
  calls: GenParams[];
  client: MockClient;
};

/**
 * Build a recording mock whose generateContentStream returns chunks decided
 * by `plan(callIndex, params)`. Returning `null` from `plan` means "throw an
 * AbortError" (used to simulate a mid-drain cancel).
 */
function makeMock(
  plan: (callIndex: number, params: GenParams) => Chunk[] | null,
): Recorder {
  const calls: GenParams[] = [];
  const client: MockClient = {
    models: {
      generateContentStream: async (p: GenParams) => {
        const index = calls.length;
        calls.push(p);
        const result = plan(index, p);
        if (result === null) {
          const e = new Error("The operation was aborted");
          e.name = "AbortError";
          throw e;
        }
        return chunks(result);
      },
    },
  };
  return { calls, client };
}

/** Construct a provider with the mock client injected. */
async function makeProvider(client: MockClient): Promise<GoogleVertexProvider> {
  const provider = new GoogleVertexProvider(
    MODEL,
    undefined,
    undefined,
    "global",
  );
  (
    provider as unknown as {
      createVertexGenAIClient: () => Promise<MockClient>;
    }
  ).createVertexGenAIClient = async () => client;
  return provider;
}

type GenResult = {
  content: string;
  finishReason: string;
  usage: { input: number; output: number; total: number };
  structuredOutput?: unknown;
  toolExecutions?: unknown[];
};

/** Invoke the private native-Gemini generate loop against the injected mock client. */
async function runGenerate(
  provider: GoogleVertexProvider,
  options: Record<string, unknown>,
): Promise<GenResult> {
  return (
    provider as unknown as {
      executeNativeGemini3Generate(o: unknown): Promise<GenResult>;
    }
  ).executeNativeGemini3Generate(options);
}

type StreamResultShape = {
  finishReason: string;
  usage: { input: number; output: number; total: number };
  structuredOutput?: unknown;
  stream: AsyncIterable<{ content: string }>;
};

/** Invoke the private native-Gemini stream loop and drain its chunks plus result. */
async function runStream(
  provider: GoogleVertexProvider,
  options: Record<string, unknown>,
): Promise<{ chunks: string[]; result: StreamResultShape }> {
  const result = (await (
    provider as unknown as {
      executeNativeGemini3Stream(o: unknown): Promise<StreamResultShape>;
    }
  ).executeNativeGemini3Stream(options)) as StreamResultShape;
  const collected: string[] = [];
  for await (const c of result.stream) {
    collected.push(c.content);
  }
  return { chunks: collected, result };
}

/** A simple echo tool the loop can execute. Records the options it received. */
function makeTool(
  onExecute?: (args: unknown, opts: { abortSignal?: AbortSignal }) => void,
) {
  return {
    myTool: {
      description: "A test tool",
      parameters: {
        type: "object",
        properties: { q: { type: "string" } },
      },
      execute: async (
        args: unknown,
        opts: { abortSignal?: AbortSignal },
      ): Promise<{ ok: true }> => {
        onExecute?.(args, opts);
        return { ok: true };
      },
    },
  };
}

// ===========================================================================
// Suite
// ===========================================================================

const { test, runSuite } = defineSuite("Gemini-3 Abort + Step-Cap");

/** Registers and runs every case in the Gemini-3 abort + step-cap suite. */
async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  // 1. Pure helper: buildToolLoopCapMessage
  // -------------------------------------------------------------------------
  await test("buildToolLoopCapMessage: contains maxSteps + exact count, plural", () => {
    const msg = buildToolLoopCapMessage(200, 3);
    assertIncludes(msg, "200-step limit");
    assertIncludes(msg, "across 3 tool calls");
    assert(
      !msg.includes("Tool execution limit reached"),
      "no legacy placeholder",
    );
  });

  await test("buildToolLoopCapMessage: singular 'tool call' for count 1", () => {
    const msg = buildToolLoopCapMessage(50, 1);
    assertIncludes(msg, "across 1 tool call ");
    assert(!msg.includes("1 tool calls"), "must be singular for count 1");
    assertIncludes(msg, "50-step limit");
  });

  await test("buildToolLoopCapMessage: count 0 uses the 'I reached...' variant", () => {
    const msg = buildToolLoopCapMessage(100, 0);
    assertIncludes(msg, "I reached the 100-step limit");
    assert(!msg.includes("tool call"), "no tool-call clause when count is 0");
    assert(
      !msg.includes("Tool execution limit reached"),
      "no legacy placeholder",
    );
  });

  // -------------------------------------------------------------------------
  // 2. Pure helper: isAbortError
  // -------------------------------------------------------------------------
  await test("isAbortError: true for { name: 'AbortError' }", () => {
    assertEqual(isAbortError({ name: "AbortError" }), true);
  });

  await test("isAbortError: true for Error message matching /abort/i", () => {
    assertEqual(isAbortError(new Error("The operation was ABORTED")), true);
    assertEqual(isAbortError(new Error("request aborted by caller")), true);
  });

  await test("isAbortError: true for DOMException code 20", () => {
    // Node exposes DOMException globally; AbortError has code 20.
    const e = new DOMException("aborted", "AbortError");
    assertEqual(e.code, 20);
    assertEqual(isAbortError(e), true);
  });

  await test("isAbortError: false for generic error / null / undefined", () => {
    assertEqual(isAbortError(new Error("boom")), false);
    assertEqual(isAbortError({ name: "TypeError" }), false);
    assertEqual(isAbortError(null), false);
    assertEqual(isAbortError(undefined), false);
  });

  // -------------------------------------------------------------------------
  // 3. Pure helper: handleMaxStepsTermination
  // -------------------------------------------------------------------------
  await test("handleMaxStepsTermination: both empty -> buildToolLoopCapMessage(maxSteps,0)", () => {
    const out = handleMaxStepsTermination("[X]", 5, 5, "", "");
    assertEqual(out, buildToolLoopCapMessage(5, 0));
  });

  await test("handleMaxStepsTermination: lastStepText present -> returns it", () => {
    const out = handleMaxStepsTermination("[X]", 5, 5, "", "gathered text");
    assertEqual(out, "gathered text");
  });

  await test("handleMaxStepsTermination: finalText non-empty -> returns finalText (below cap)", () => {
    const out = handleMaxStepsTermination("[X]", 2, 5, "answer", "ignored");
    assertEqual(out, "answer");
  });

  await test("handleMaxStepsTermination: finalText non-empty at cap -> returns finalText", () => {
    const out = handleMaxStepsTermination("[X]", 5, 5, "answer", "ignored");
    assertEqual(out, "answer");
  });

  // -------------------------------------------------------------------------
  // 4. Generate: pure functionCall runaway, synth returns "" -> cap message
  // -------------------------------------------------------------------------
  await test("generate: pure-runaway, synth empty -> buildToolLoopCapMessage + finishReason 'tool-calls'", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      const maxSteps = 3;
      // Every loop step (indices 0..maxSteps-1) returns a tool-call-only chunk.
      // The trailing synth call (index maxSteps) returns NO text -> empty synth.
      const mock = makeMock((i) =>
        i < maxSteps
          ? [functionCallChunk("myTool", { q: "x" })]
          : [textChunk("", "STOP")],
      );
      const provider = await makeProvider(mock.client);
      const result = await runGenerate(provider, {
        input: { text: "run tools" },
        tools: makeTool(),
        maxSteps,
      });
      assertEqual(
        result.content,
        buildToolLoopCapMessage(maxSteps, maxSteps),
        "content must be the graceful cap message",
      );
      assertEqual(result.finishReason, "tool-calls");
      assert(
        !result.content.includes("Tool execution limit reached"),
        "must not be the bracketed placeholder",
      );
    });
  });

  // -------------------------------------------------------------------------
  // 5. Generate: synth returns text -> content===synth, finishReason maps
  // -------------------------------------------------------------------------
  await test("generate: synth returns text -> content is synth text, finishReason maps (not 'tool-calls'), tokens added", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      const maxSteps = 2;
      const mock = makeMock((i) =>
        i < maxSteps
          ? [functionCallChunk("myTool", { q: "x" })]
          : [textChunk("SYNTHESIZED ANSWER", "STOP")],
      );
      const provider = await makeProvider(mock.client);
      const result = await runGenerate(provider, {
        input: { text: "run tools" },
        tools: makeTool(),
        maxSteps,
      });
      assertEqual(result.content, "SYNTHESIZED ANSWER");
      // synthesizedFinalAnswer true -> maps STOP -> "stop", NOT "tool-calls".
      assertEqual(result.finishReason, "stop");
      assert(result.usage.output > 0, "synth output tokens should be added");
    });
  });

  // -------------------------------------------------------------------------
  // 6. Generate: accumulatedText non-empty at cap -> synth NOT called
  // -------------------------------------------------------------------------
  await test("generate: accumulatedText at cap -> content is accumulated prose, synth NOT called", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      const maxSteps = 2;
      // Each step emits BOTH text and a functionCall so accumulatedText grows
      // while the loop keeps going to the cap.
      const mock = makeMock((i) => {
        if (i < maxSteps) {
          return [
            {
              functionCalls: [{ name: "myTool", args: { q: "x" } }],
              candidates: [
                {
                  content: {
                    parts: [
                      { text: `step${i} prose` },
                      { functionCall: { name: "myTool", args: { q: "x" } } },
                    ],
                  },
                },
              ],
              usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3 },
            },
          ];
        }
        // If reached, this would be the synth call — it must NOT happen.
        return [textChunk("SHOULD NOT BE CALLED", "STOP")];
      });
      const provider = await makeProvider(mock.client);
      const result = await runGenerate(provider, {
        input: { text: "run tools" },
        tools: makeTool(),
        maxSteps,
      });
      // Exactly maxSteps calls — no trailing synth call.
      assertEqual(mock.calls.length, maxSteps, "synth must NOT be called");
      assertIncludes(result.content, "step0 prose");
      assertIncludes(result.content, "step1 prose");
      assert(
        !result.content.includes("SHOULD NOT BE CALLED"),
        "synth text must not appear",
      );
    });
  });

  // -------------------------------------------------------------------------
  // 7. Generate: abort mid-drain -> BREAK, synth skipped, cap message
  // -------------------------------------------------------------------------
  await test("generate: abort mid-drain -> loop breaks (no throw), synth skipped, cap message, call count < maxSteps", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      const maxSteps = 10;
      const controller = new AbortController();
      // Step 0: normal runaway chunk. Step 1: the mock aborts the caller signal
      // then throws AbortError (simulating a cancelled drain). No synth call
      // should follow.
      const mock = makeMock((i) => {
        if (i === 0) {
          return [functionCallChunk("myTool", { q: "x" })];
        }
        // Simulate the caller aborting right as the 2nd request starts to drain.
        controller.abort();
        return null; // -> throw AbortError from the mock iterable
      });
      const provider = await makeProvider(mock.client);
      const result = await runGenerate(provider, {
        input: { text: "run tools" },
        tools: makeTool(),
        maxSteps,
        abortSignal: controller.signal,
      });
      // No throw escaped (we got a result). Cap message delivered, synth skipped.
      assert(
        result.content.includes("step limit for a single turn"),
        `expected graceful cap message, got: ${result.content}`,
      );
      assert(
        mock.calls.length < maxSteps,
        `expected < ${maxSteps} generateContentStream calls, got ${mock.calls.length}`,
      );
      assertEqual(mock.calls.length, 2, "only 2 requests before abort break");
    });
  });

  // -------------------------------------------------------------------------
  // 8. Generate: abort BETWEEN steps (loop-entry guard)
  // -------------------------------------------------------------------------
  await test("generate: abort BETWEEN steps (loop-entry guard) -> graceful cap message", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      const maxSteps = 10;
      const controller = new AbortController();
      // Genuinely exercise the loop-entry guard (NOT the mid-drain / tool-exec
      // abort paths): step 0's stream drains fully & the tool executes
      // normally, then the signal aborts. On the next while-iteration the
      // loop-entry guard (`if (effectiveSignal.aborted) break`) trips before a
      // second generateContentStream is issued. The custom iterable aborts in
      // its finally (after the last yield is consumed) so the abort lands
      // strictly between steps.
      const calls: GenParams[] = [];
      const client: MockClient = {
        models: {
          generateContentStream: async (p: GenParams) => {
            const index = calls.length;
            calls.push(p);
            if (index > 0) {
              throw new Error(
                "should not reach a second request after between-step abort",
              );
            }
            return (async function* () {
              try {
                yield functionCallChunk("myTool", { q: "x" });
              } finally {
                // Drain of step 0 is complete — abort now so the tool runs
                // normally and the NEXT loop-entry guard breaks the turn.
                controller.abort();
              }
            })();
          },
        },
      };
      const provider = await makeProvider(client);
      const result = await runGenerate(provider, {
        input: { text: "run tools" },
        // The tool runs normally (returns without throwing). The abort fires in
        // the iterable's finally, AFTER step 0's drain, so the break comes from
        // the next iteration's loop-entry guard — not the tool-exec inner catch.
        tools: {
          myTool: {
            description: "A test tool",
            parameters: { type: "object", properties: {} },
            execute: async (): Promise<{ ok: true }> => {
              return { ok: true };
            },
          },
        },
        maxSteps,
        abortSignal: controller.signal,
      });
      assert(
        result.content.includes("step limit for a single turn"),
        `expected graceful cap message, got: ${result.content}`,
      );
      assertEqual(
        calls.length,
        1,
        "no second model request after between-step abort",
      );
    });
  });

  // -------------------------------------------------------------------------
  // 9. Generate: config.abortSignal wiring + original config not mutated
  // -------------------------------------------------------------------------
  await test("generate: every request config.abortSignal === effectiveSignal; original config not mutated", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      const maxSteps = 3;
      const mock = makeMock((i) =>
        i < maxSteps
          ? [functionCallChunk("myTool", { q: "x" })]
          : [textChunk("", "STOP")],
      );
      const provider = await makeProvider(mock.client);
      await runGenerate(provider, {
        input: { text: "run tools" },
        tools: makeTool(),
        maxSteps,
      });
      assert(mock.calls.length >= 2, "need multiple requests");
      const signals = mock.calls.map((c) => c.config.abortSignal);
      // All requests carry an AbortSignal, and it is the SAME reference (the
      // internal effectiveSignal) across every step.
      for (const s of signals) {
        assert(
          typeof AbortSignal !== "undefined" && s instanceof AbortSignal,
          "config.abortSignal must be an AbortSignal",
        );
      }
      const first = signals[0];
      assert(
        signals.every((s) => s === first),
        "config.abortSignal must be the same reference across all requests",
      );
      // The shallow-clone contract: each per-request config is a DISTINCT
      // object (so the shared config is never mutated with abortSignal).
      const configs = mock.calls.map((c) => c.config);
      assert(
        new Set(configs).size === configs.length,
        "each request must receive its own shallow-cloned config object",
      );
    });
  });

  // -------------------------------------------------------------------------
  // 10. Generate: tool-exec abort propagation
  // -------------------------------------------------------------------------
  await test("generate: tool execute receives the same abortSignal as the request; aborted tool call does not count as failure", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      const maxSteps = 4;
      let toolSignal: AbortSignal | undefined;
      const mock = makeMock((i) =>
        i < maxSteps
          ? [functionCallChunk("myTool", { q: "x" })]
          : [textChunk("", "STOP")],
      );
      const provider = await makeProvider(mock.client);
      await runGenerate(provider, {
        input: { text: "run tools" },
        tools: makeTool((_args, opts) => {
          toolSignal = opts.abortSignal;
        }),
        maxSteps,
      });
      assert(
        typeof AbortSignal !== "undefined" && toolSignal instanceof AbortSignal,
        "tool execute must receive an AbortSignal",
      );
      // Same reference as the one wired into the request config.
      assertEqual(
        toolSignal,
        mock.calls[0].config.abortSignal as AbortSignal,
        "toolOptions.abortSignal === request config.abortSignal",
      );
    });
  });

  await test("generate: an aborted tool call does NOT increment failedTools (no spurious failure)", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      // maxSteps is generous so that IF the abort were mis-handled (recorded
      // as an ordinary tool failure instead of breaking the turn) the loop
      // would keep issuing model requests — which the call-count assertion
      // below catches. Crucially we do NOT abort a caller signal here: the
      // tool throws an AbortError-named error, so `isAbortError(error)` is the
      // SOLE discriminator that must break the turn. (A prior version
      // pre-aborted a controller, which let the next-iteration loop-entry
      // guard mask a broken inner-catch guard and made this test vacuous.)
      const maxSteps = 6;
      let executeCount = 0;
      const mock = makeMock(() => [functionCallChunk("myTool", { q: "x" })]);
      const provider = await makeProvider(mock.client);
      const result = await runGenerate(provider, {
        input: { text: "run tools" },
        tools: {
          myTool: {
            description: "throws an AbortError",
            parameters: { type: "object", properties: {} },
            execute: async (
              _args: unknown,
              _opts: { abortSignal?: AbortSignal },
            ) => {
              executeCount++;
              const e = new Error("aborted mid-tool");
              e.name = "AbortError";
              throw e;
            },
          },
        },
        maxSteps,
      });
      // Correct handling breaks the turn on the FIRST aborted tool call:
      //   - the tool runs exactly once (no retry from a recorded failure)
      //   - no further model request is issued (loop broke, not continued)
      //   - the aborted call is NOT surfaced as a failed tool execution
      assertEqual(executeCount, 1, "aborted tool must not be retried");
      assertEqual(
        mock.calls.length,
        1,
        "aborted tool must break the turn — no further model request",
      );
      assert(
        !JSON.stringify(result.toolExecutions ?? []).includes(
          "TOOL_EXECUTION_ERROR",
        ),
        "aborted tool must not be recorded as a failed execution",
      );
      assert(
        result.content.includes("step limit for a single turn"),
        "graceful cap message after tool-exec abort",
      );
      // toolCallCount in the message reflects the single call.
      assertIncludes(result.content, "across 1 tool call ");
    });
  });

  // -------------------------------------------------------------------------
  // 11. Generate: final_result before cap -> structured output preserved
  // -------------------------------------------------------------------------
  await test("generate: final_result before cap -> structuredOutput preserved, finishReason not 'tool-calls'", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      // Step 0: model calls final_result with the structured payload.
      const payload = { answer: 42 };
      const mock = makeMock(() => [
        {
          functionCalls: [{ name: "final_result", args: payload }],
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  { functionCall: { name: "final_result", args: payload } },
                ],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3 },
        },
      ]);
      const provider = await makeProvider(mock.client);
      // Provide a schema so useFinalResultTool becomes true.
      const { z } = await import("zod");
      const result = await runGenerate(provider, {
        input: { text: "give me the answer" },
        tools: makeTool(),
        schema: z.object({ answer: z.number() }),
        maxSteps: 5,
      });
      assertEqual(
        mock.calls.length,
        1,
        "should break at final_result, not loop",
      );
      assertEqual(result.content, JSON.stringify(payload));
      assertEqual(
        JSON.stringify(result.structuredOutput),
        JSON.stringify(payload),
      );
      assert(
        result.finishReason !== "tool-calls",
        "final_result path must not force 'tool-calls'",
      );
    });
  });

  // -------------------------------------------------------------------------
  // 12. Stream twin: normal multi-part completion -> >1 chunk
  // -------------------------------------------------------------------------
  await test("stream: normal multi-part completion yields >1 chunk", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      // Single request, no function calls, multiple text parts across chunks.
      const mock = makeMock(() => [
        {
          candidates: [{ content: { parts: [{ text: "Hello " }] } }],
          usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 2 },
        },
        {
          candidates: [
            {
              finishReason: "STOP",
              content: { parts: [{ text: "world" }] },
            },
          ],
          usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 4 },
        },
      ]);
      const provider = await makeProvider(mock.client);
      const { chunks: out } = await runStream(provider, {
        input: { text: "hi" },
        maxSteps: 3,
      });
      assert(
        out.length > 1,
        `expected >1 chunk, got ${out.length}: ${JSON.stringify(out)}`,
      );
      assertEqual(out.join(""), "Hello world");
    });
  });

  // -------------------------------------------------------------------------
  // 13. Stream twin: pure-runaway synth-empty -> EXACTLY ONE graceful chunk
  // -------------------------------------------------------------------------
  await test("stream: pure-runaway, synth empty -> exactly ONE non-empty graceful chunk", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      const maxSteps = 3;
      const mock = makeMock((i) =>
        i < maxSteps
          ? [functionCallChunk("myTool", { q: "x" })]
          : [textChunk("", "STOP")],
      );
      const provider = await makeProvider(mock.client);
      const { chunks: out, result } = await runStream(provider, {
        input: { text: "run tools" },
        tools: makeTool(),
        maxSteps,
      });
      assertEqual(out.length, 1, "exactly one graceful chunk");
      assertEqual(out[0], buildToolLoopCapMessage(maxSteps, maxSteps));
      assert(out[0].length > 0, "graceful chunk must be non-empty");
      assert(
        !out[0].includes("Tool execution limit reached"),
        "no legacy placeholder",
      );
      // The step-cap-without-synth path must map finishReason to 'tool-calls'
      // (parity with the generate twin); a regression to 'stop'/'length' here
      // would otherwise go unnoticed by the stream suite.
      assertEqual(
        result.finishReason,
        "tool-calls",
        "stream step-cap without synth -> finishReason 'tool-calls'",
      );
    });
  });

  // -------------------------------------------------------------------------
  // 14. Stream twin: abort mid-drain -> exactly ONE graceful chunk, synth skipped
  // -------------------------------------------------------------------------
  await test("stream: abort mid-drain -> one graceful chunk, no throw, call count < maxSteps", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      const maxSteps = 10;
      const controller = new AbortController();
      const mock = makeMock((i) => {
        if (i === 0) {
          return [functionCallChunk("myTool", { q: "x" })];
        }
        controller.abort();
        return null;
      });
      const provider = await makeProvider(mock.client);
      const { chunks: out } = await runStream(provider, {
        input: { text: "run tools" },
        tools: makeTool(),
        maxSteps,
        abortSignal: controller.signal,
      });
      assertEqual(out.length, 1, "exactly one graceful chunk on abort");
      assert(
        out[0].includes("step limit for a single turn"),
        `expected cap message, got: ${out[0]}`,
      );
      assert(mock.calls.length < maxSteps, "call count < maxSteps");
      assertEqual(mock.calls.length, 2, "aborted on 2nd request");
    });
  });

  // -------------------------------------------------------------------------
  // 15. Stream twin: config.abortSignal wiring
  // -------------------------------------------------------------------------
  await test("stream: every request config.abortSignal is same AbortSignal; original config not mutated", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      const maxSteps = 3;
      const mock = makeMock((i) =>
        i < maxSteps
          ? [functionCallChunk("myTool", { q: "x" })]
          : [textChunk("", "STOP")],
      );
      const provider = await makeProvider(mock.client);
      await runStream(provider, {
        input: { text: "run tools" },
        tools: makeTool(),
        maxSteps,
      });
      const signals = mock.calls.map((c) => c.config.abortSignal);
      for (const s of signals) {
        assert(
          typeof AbortSignal !== "undefined" && s instanceof AbortSignal,
          "config.abortSignal must be an AbortSignal",
        );
      }
      const first = signals[0];
      assert(
        signals.every((s) => s === first),
        "same abortSignal reference across all stream requests",
      );
      const configs = mock.calls.map((c) => c.config);
      assert(
        new Set(configs).size === configs.length,
        "each stream request receives its own shallow-cloned config",
      );
    });
  });

  // -------------------------------------------------------------------------
  // 16. synthesizeFinalAnswerWithoutTools: already-aborted -> no request
  // -------------------------------------------------------------------------
  await test("synth: already-aborted signal -> returns {text:''} WITHOUT calling generateContentStream", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      const mock = makeMock(() => {
        throw new Error(
          "generateContentStream must NOT be called when pre-aborted",
        );
      });
      const provider = await makeProvider(mock.client);
      const controller = new AbortController();
      controller.abort();
      const synth = await (
        provider as unknown as {
          synthesizeFinalAnswerWithoutTools(
            client: MockClient,
            model: string,
            config: Record<string, unknown>,
            contents: unknown,
            useFinalResultTool: boolean,
            timeoutMs: number,
            abortSignal?: AbortSignal,
          ): Promise<{
            text: string;
            inputTokens: number;
            outputTokens: number;
          }>;
        }
      ).synthesizeFinalAnswerWithoutTools(
        mock.client,
        MODEL,
        { temperature: 1, tools: [{ functionDeclarations: [] }] },
        [{ role: "user", parts: [{ text: "hi" }] }],
        false,
        300_000,
        controller.signal,
      );
      assertEqual(synth.text, "");
      assertEqual(mock.calls.length, 0, "no request when already aborted");
    });
  });

  // -------------------------------------------------------------------------
  // 17. synthesizeFinalAnswerWithoutTools: live signal -> config carries
  //     abortSignal AND tools deleted
  // -------------------------------------------------------------------------
  await test("synth: live signal -> request config carries abortSignal and tools deleted; source config untouched", async () => {
    await withTemporaryEnv(VERTEX_ENV, async () => {
      const mock = makeMock(() => [textChunk("synth answer", "STOP")]);
      const provider = await makeProvider(mock.client);
      const controller = new AbortController();
      const sourceConfig = {
        temperature: 1,
        tools: [{ functionDeclarations: [{ name: "myTool" }] }],
      };
      const synth = await (
        provider as unknown as {
          synthesizeFinalAnswerWithoutTools(
            client: MockClient,
            model: string,
            config: Record<string, unknown>,
            contents: unknown,
            useFinalResultTool: boolean,
            timeoutMs: number,
            abortSignal?: AbortSignal,
          ): Promise<{
            text: string;
            inputTokens: number;
            outputTokens: number;
          }>;
        }
      ).synthesizeFinalAnswerWithoutTools(
        mock.client,
        MODEL,
        sourceConfig,
        [{ role: "user", parts: [{ text: "hi" }] }],
        false,
        300_000,
        controller.signal,
      );
      assertEqual(synth.text, "synth answer");
      assertEqual(mock.calls.length, 1, "exactly one synth request");
      const reqConfig = mock.calls[0].config;
      assertEqual(
        reqConfig.abortSignal,
        controller.signal,
        "synth request config carries the abortSignal",
      );
      assert(
        reqConfig.tools === undefined,
        "tools must be deleted on synth config",
      );
      // The shared source config must be untouched (still has tools, no signal).
      assert(
        (sourceConfig as Record<string, unknown>).tools !== undefined,
        "source config.tools must NOT be deleted",
      );
      assert(
        (sourceConfig as Record<string, unknown>).abortSignal === undefined,
        "source config must not gain an abortSignal",
      );
    });
  });

  // -------------------------------------------------------------------------
  // 18. Regression grep: placeholder gone from both source files
  // -------------------------------------------------------------------------
  await test("regression: 'Tool execution limit reached after' absent from googleVertex.ts and googleNativeGemini3.ts", () => {
    const vertexSrc = readFileSync(
      resolve(REPO_ROOT, "src/lib/providers/googleVertex.ts"),
      "utf8",
    );
    const nativeSrc = readFileSync(
      resolve(REPO_ROOT, "src/lib/providers/googleNativeGemini3.ts"),
      "utf8",
    );
    // NOTE: keep these messages free of words the harness treats as an
    // "expected provider error" (e.g. "gone" → HTTP 410), otherwise a real
    // regression would be swallowed as a SKIP instead of failing the suite.
    assert(
      !vertexSrc.includes("Tool execution limit reached after"),
      "legacy step-cap placeholder text still present in googleVertex.ts",
    );
    assert(
      !nativeSrc.includes("Tool execution limit reached after"),
      "legacy step-cap placeholder text still present in googleNativeGemini3.ts",
    );
  });
}

await runSuite(main);
