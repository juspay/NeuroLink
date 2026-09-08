#!/usr/bin/env tsx
import "dotenv/config";

/**
 * Continuous Test Suite — native-loop vendor recovery
 *
 * Two vendor misbehaviours are recovered inside the native generate loop, and
 * both are invisible to the live provider matrix because no reachable endpoint
 * reproduces them on demand:
 *
 *   1. io.net's Llama endpoint ends a tool loop on `finish_reason: "tool_calls"`
 *      carrying `content: null` and no `tool_calls` array. There is nothing to
 *      execute, so the loop stops and the caller gets an empty turn even though
 *      the tool ran. The recovery re-asks once with `tool_choice: "none"`.
 *   2. GMI Cloud's MiniMax endpoint does not honour a strict `json_schema`
 *      request. The recovery drops `response_format` and spells the schema
 *      into the system prompt. It has TWO triggers, and they are separate
 *      cases below because conflating them is exactly how this went wrong:
 *      the vendor can REJECT the request outright (a 400 the loop catches),
 *      or accept it and silently answer in prose (nothing throws at all).
 *      The original port handled only the first. This header used to describe
 *      the second while the suite exercised the first, so a green run
 *      certified a recovery that did not exist — three cases in
 *      `test:error-classification-e2e` failed on release for that reason.
 *
 * Both recoveries used to live in `GenerationHandler`, on the ai-package path.
 * Every provider they were written for is a Tier-2 catalog provider on the
 * OpenAI-compatible base, which now has a native `generate()` and never reaches
 * that handler — so they were ported into the native loop, and this suite is
 * what proves the ports behave. A local scripted stand-in serves the exact wire
 * shapes; no credentials, no network, deterministic.
 *
 * Run: pnpm run build && npx tsx test/continuous-test-suite-native-vendor-recovery.ts
 */

import { createServer } from "node:http";
import { once } from "node:events";
import { z } from "zod";
import { defineSuite } from "./helpers/harness.js";
import { assertDistFresh } from "./helpers/distFreshness.js";
import {
  chatCompletion,
  startScriptedChatServer,
} from "./helpers/mockChatServer.js";
import { NeuroLink, tool } from "../dist/index.js";

assertDistFresh();

const { test, runSuite } = defineSuite("Native vendor recovery", {
  offline: true,
});

const credentialsFor = (baseURL: string) => ({
  openai: { apiKey: "sk-mock-local-server", baseURL },
});

await test("an empty tool-calls finish is recovered with a toolChoice:none re-ask", async () => {
  // Reply 1 asks for the tool. Reply 2 is io.net's broken shape: a
  // tool_calls finish with no call and no content. Reply 3 is the answer the
  // re-ask gets.
  const server = await startScriptedChatServer([
    chatCompletion({
      finishReason: "tool_calls",
      toolCalls: [
        {
          id: "call_1",
          type: "function",
          function: { name: "get_code", arguments: "{}" },
        },
      ],
    }),
    chatCompletion({ content: null, finishReason: "tool_calls" }),
    chatCompletion({ content: "the answer is 42", finishReason: "stop" }),
  ]);
  try {
    const nl = new NeuroLink();
    const result = await nl.generate({
      input: { text: "call the tool then answer" },
      provider: "openai",
      model: "scripted-model",
      credentials: credentialsFor(server.baseURL),
      maxTokens: 64,
      tools: {
        get_code: tool({
          description: "Returns a code",
          inputSchema: z.object({}),
          execute: async () => ({ code: 42 }),
        }),
      },
    });

    // PRECONDITION: the stand-in must have been driven through all three
    // replies, or this asserts nothing about the recovery.
    const requests = server.requestCount();
    if (requests < 3) {
      throw new Error(
        `precondition failed: recovery re-ask never issued, saw ${requests} requests`,
      );
    }

    const bodies = server.getAllRequestBodies();
    const reask = JSON.parse(bodies[2]) as { tool_choice?: unknown };
    if (reask.tool_choice !== "none") {
      throw new Error("re-ask did not carry tool_choice none");
    }
    if (!(result.content ?? "").includes("42")) {
      throw new Error("recovered answer did not reach the caller");
    }
  } finally {
    await server.close();
  }
});

await test("a rejected response_format falls back to the schema in the system prompt", async () => {
  // Reply 1 is the vendor refusing constrained decoding; reply 2 answers the
  // re-ask, which must carry the schema in a system message and no
  // response_format.
  const server = await startScriptedChatServer([
    {
      status: 400,
      body: {
        error: { message: "json mode cannot be combined with tool calling" },
      },
    },
    chatCompletion({
      content: '{"city":"Tokyo","temp":22}',
      finishReason: "stop",
    }),
  ]);
  try {
    const nl = new NeuroLink();
    const result = await nl.generate({
      input: { text: "weather in Tokyo" },
      provider: "openai",
      model: "scripted-model",
      credentials: credentialsFor(server.baseURL),
      maxTokens: 64,
      schema: z.object({ city: z.string(), temp: z.number() }),
    });

    const requests = server.requestCount();
    if (requests < 2) {
      throw new Error(
        `precondition failed: fallback never issued, saw ${requests} requests`,
      );
    }

    const bodies = server.getAllRequestBodies();
    const first = JSON.parse(bodies[0]) as { response_format?: unknown };
    const second = JSON.parse(bodies[1]) as {
      response_format?: unknown;
      messages?: Array<{ role: string; content?: unknown }>;
    };
    if (first.response_format === undefined) {
      throw new Error("first attempt did not request constrained decoding");
    }
    if (second.response_format !== undefined) {
      throw new Error("fallback still sent response_format");
    }
    const systemText = (second.messages ?? [])
      .filter((m) => m.role === "system")
      .map((m) => (typeof m.content === "string" ? m.content : ""))
      .join("\n");
    if (!systemText.includes("JSON Schema")) {
      throw new Error("fallback did not spell the schema into the prompt");
    }
    const data = result.structuredData as { city?: string } | undefined;
    if (data?.city !== "Tokyo") {
      throw new Error("recovered object did not reach the caller");
    }
  } finally {
    await server.close();
  }
});

await test("a silently ignored response_format falls back to the schema in the system prompt", async () => {
  // The other half of recovery 2, and the one the original port missed. The
  // vendor accepts `response_format` with a 200 and answers in prose anyway,
  // so nothing throws and the error-triggered fallback never fires. Reply 2
  // answers the re-ask.
  const server = await startScriptedChatServer([
    chatCompletion({
      content: "Sure! Tokyo is currently about 22 degrees.",
      finishReason: "stop",
    }),
    chatCompletion({
      content: '{"city":"Tokyo","temp":22}',
      finishReason: "stop",
    }),
  ]);
  try {
    const nl = new NeuroLink();
    const result = await nl.generate({
      input: { text: "weather in Tokyo" },
      provider: "openai",
      model: "scripted-model",
      credentials: credentialsFor(server.baseURL),
      maxTokens: 64,
      schema: z.object({ city: z.string(), temp: z.number() }),
    });

    const requests = server.requestCount();
    if (requests < 2) {
      throw new Error(
        `precondition failed: no fallback for the silent case, saw ${requests} requests`,
      );
    }

    const bodies = server.getAllRequestBodies();
    const first = JSON.parse(bodies[0]) as { response_format?: unknown };
    const second = JSON.parse(bodies[1]) as {
      response_format?: unknown;
      messages?: Array<{ role: string; content?: unknown }>;
    };
    if (first.response_format === undefined) {
      throw new Error("first attempt did not request constrained decoding");
    }
    if (second.response_format !== undefined) {
      throw new Error("fallback still sent response_format");
    }
    const systemText = (second.messages ?? [])
      .filter((m) => m.role === "system")
      .map((m) => (typeof m.content === "string" ? m.content : ""))
      .join("\n");
    if (!systemText.includes("JSON Schema")) {
      throw new Error("fallback did not spell the schema into the prompt");
    }
    const data = result.structuredData as { city?: string } | undefined;
    if (data?.city !== "Tokyo") {
      throw new Error("recovered object did not reach the caller");
    }
  } finally {
    await server.close();
  }
});

await test("a native tool round trip populates result.toolCalls", async () => {
  let executions = 0;
  // `EnhancedGenerateResult.toolCalls` is a public field. The native loop
  // recorded the execution (toolExecutions, toolsUsed) but never mapped it
  // back onto toolCalls, so a caller reading the field the type promises saw
  // nothing after a tool ran. Pre-dates the SDK removal for this family.
  const server = await startScriptedChatServer([
    chatCompletion({
      finishReason: "tool_calls",
      toolCalls: [
        {
          id: "call_7",
          type: "function",
          function: { name: "lookup", arguments: '{"value":7}' },
        },
      ],
    }),
    chatCompletion({ content: "answer 42", finishReason: "stop" }),
  ]);
  try {
    const nl = new NeuroLink();
    const result = await nl.generate({
      input: { text: "call lookup" },
      provider: "openai",
      model: "scripted-model",
      credentials: credentialsFor(server.baseURL),
      maxSteps: 3,
      tools: {
        lookup: tool({
          description: "Looks a value up",
          inputSchema: z.object({ value: z.number() }),
          execute: async () => {
            executions += 1;
            return { answer: 42 };
          },
        }),
      },
    });
    // A request count alone proves nothing: the server answers a second time
    // for any second request, whether or not the tool ran or its result was
    // submitted. Assert the execution itself and the tool result on the wire.
    if (executions !== 1) {
      throw new Error(
        `precondition failed: the tool executed ${executions} times, expected 1`,
      );
    }
    if (server.requestCount() < 2) {
      throw new Error(
        "precondition failed: the tool round trip never happened",
      );
    }
    const followUp = JSON.parse(server.getAllRequestBodies()[1] ?? "{}") as {
      messages?: Array<{ role?: string; tool_call_id?: string }>;
    };
    const toolResult = (followUp.messages ?? []).find(
      (m) => m.role === "tool" && m.tool_call_id === "call_7",
    );
    if (!toolResult) {
      throw new Error("the follow-up request carried no result for call_7");
    }
    const calls = result.toolCalls ?? [];
    if (calls.length !== 1) {
      throw new Error("result.toolCalls does not carry the executed call");
    }
    if (calls[0].toolName !== "lookup" || calls[0].toolCallId !== "call_7") {
      throw new Error("result.toolCalls carries the wrong identity");
    }
    if ((calls[0].args as { value?: number }).value !== 7) {
      throw new Error("result.toolCalls carries the wrong arguments");
    }
  } finally {
    await server.close();
  }
});

// ---------------------------------------------------------------------------
// Native-loop result contracts.
//
// These are not vendor recoveries: they are fields the loop is supposed to
// carry that it silently drops. Both were found when the ai-sdk removal's
// leftover comments were audited — each comment credited `GenerationHandler`
// with work that nothing does now.
// ---------------------------------------------------------------------------

await test("a vendor reasoning part reaches result.reasoning", async () => {
  const REASONING = "step one, then step two";
  const server = await startScriptedChatServer([
    {
      id: "reasoner",
      object: "chat.completion",
      created: 1,
      model: "scripted-reasoner",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "42",
            reasoning_content: REASONING,
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    },
  ]);
  const sdk = new NeuroLink();
  try {
    const result = await sdk.generate({
      input: { text: "what is the answer?" },
      provider: "openai",
      model: "scripted-reasoner",
      disableTools: true,
      disableInternalFallback: true,
      credentials: credentialsFor(server.baseURL),
    });
    // Precondition: a pass must not come from the call never happening.
    if (server.requestCount() !== 1) {
      throw new Error(
        "precondition: the scripted endpoint was not called once",
      );
    }
    if (result.content !== "42") {
      throw new Error(
        "precondition: the scripted answer did not reach content",
      );
    }
    if (result.reasoning !== REASONING) {
      throw new Error(
        "the vendor reasoning part did not reach result.reasoning",
      );
    }
  } finally {
    await sdk.shutdown();
    await server.close();
  }
});

type AnthropicToolProbe = {
  baseURL: string;
  requests(): number;
  lastTools(): Array<Record<string, unknown>>;
};

/** Minimal Messages endpoint that records the tool block it was sent. */
const startAnthropicToolProbe = async (): Promise<AnthropicToolProbe> => {
  let requests = 0;
  let tools: Array<Record<string, unknown>> = [];
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const part of req) {
      chunks.push(part as Buffer);
    }
    requests += 1;
    try {
      const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
        tools?: Array<Record<string, unknown>>;
      };
      tools = parsed.tools ?? [];
    } catch {
      tools = [];
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        id: "msg_probe",
        type: "message",
        role: "assistant",
        model: "claude-sonnet-4-20250514",
        content: [{ type: "text", text: "done" }],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address !== "object") {
    throw new Error("probe server did not bind");
  }
  return {
    baseURL: `http://127.0.0.1:${address.port}`,
    requests: () => requests,
    lastTools: () => tools,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  } as AnthropicToolProbe & { close: () => Promise<void> };
};

await test("the Anthropic tools block carries one cache breakpoint", async () => {
  const probe = (await startAnthropicToolProbe()) as AnthropicToolProbe & {
    close: () => Promise<void>;
  };
  const saved = {
    url: process.env.ANTHROPIC_BASE_URL,
    key: process.env.ANTHROPIC_API_KEY,
  };
  process.env.ANTHROPIC_BASE_URL = probe.baseURL;
  process.env.ANTHROPIC_API_KEY = "sk-ant-mock-local-server";
  const sdk = new NeuroLink();
  try {
    await sdk.generate({
      input: { text: "hello" },
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      disableInternalFallback: true,
      tools: {
        first_tool: tool({
          description: "first",
          inputSchema: z.object({ a: z.string() }),
          execute: async () => "a",
        }),
        second_tool: tool({
          description: "second",
          inputSchema: z.object({ b: z.string() }),
          execute: async () => "b",
        }),
      },
    });
    // Preconditions: the request must actually have carried both tools,
    // otherwise "no marker" would prove nothing.
    if (probe.requests() < 1) {
      throw new Error("precondition: the probe endpoint was never called");
    }
    // The SDK merges built-in/MCP tools with the caller's, so assert a floor
    // rather than an exact count: what matters is that a tools block was sent.
    const tools = probe.lastTools();
    if (tools.length < 2) {
      throw new Error("precondition: the request carried no tools block");
    }
    const marked = tools.filter(
      (t) =>
        (t as { cache_control?: { type?: string } }).cache_control?.type ===
        "ephemeral",
    );
    if (marked.length !== 1) {
      throw new Error(
        "the tools block does not carry exactly one cache breakpoint",
      );
    }
    const last = tools[tools.length - 1] as {
      cache_control?: { type?: string };
    };
    if (last.cache_control?.type !== "ephemeral") {
      throw new Error("the cache breakpoint is not on the last tool");
    }
  } finally {
    await sdk.shutdown();
    await probe.close();
    if (saved.url === undefined) {
      delete process.env.ANTHROPIC_BASE_URL;
    } else {
      process.env.ANTHROPIC_BASE_URL = saved.url;
    }
    if (saved.key === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = saved.key;
    }
  }
});

await runSuite();
