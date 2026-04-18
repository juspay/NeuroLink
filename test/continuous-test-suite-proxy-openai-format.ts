#!/usr/bin/env tsx

/**
 * Continuous Test Suite — OpenAI-Compatible Proxy (format level)
 *
 * Pure unit-level tests of the format converters that power the
 * `/v1/chat/completions` endpoint. These tests do NOT spin up a real
 * proxy or hit any upstream — they exercise the conversion helpers in
 * `src/lib/proxy/openaiFormat.ts` directly, which is where the SSE
 * framing, tool-call translation, and error envelope live.
 *
 * Why these tests exist:
 * - The `/v1/chat/completions` endpoint had zero regression coverage.
 * - Reviewers (CodeRabbit + Copilot) flagged the lack of automated
 *   tests for the new surface, the streaming flush behaviour, and the
 *   error-envelope shape.
 *
 * Run:
 *   npx tsx test/continuous-test-suite-proxy-openai-format.ts
 *
 * No environment variables, no network, no credentials required.
 */

import {
  buildOpenAIError,
  convertClaudeToOpenAIResponse,
  convertOpenAIToClaudeRequest,
  createClaudeToOpenAIStreamTransform,
  generateChatCompletionId,
  generateOpenAIToolCallId,
  parseOpenAIRequest,
} from "../src/lib/proxy/openaiFormat.js";
import { defineSuite, log, logSection } from "./helpers/harness.js";
import type {
  ClaudeResponse,
  OpenAICompletionRequest,
  OpenAIErrorResponse,
} from "../src/lib/types/index.js";

const { recordTest, runSuite } = defineSuite("Proxy OpenAI Format");

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function assertEqual<T>(name: string, actual: T, expected: T): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${name}: expected ${e}, got ${a}`);
  }
}

function assert(name: string, condition: boolean, detail = ""): void {
  if (!condition) {
    throw new Error(`${name}${detail ? `: ${detail}` : ""}`);
  }
}

// ============================================================================
// Helpers for streaming the SSE transform end-to-end
// ============================================================================

/**
 * Drive a `TransformStream<Uint8Array, Uint8Array>` with a sequence of
 * UTF-8 chunks and return the concatenated decoded output.
 */
async function runTransform(
  transform: TransformStream<Uint8Array, Uint8Array>,
  chunks: string[],
): Promise<string> {
  const writer = transform.writable.getWriter();
  const reader = transform.readable.getReader();
  const decoder = new TextDecoder();
  let collected = "";

  const readerPromise = (async () => {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      collected += decoder.decode(value, { stream: true });
    }
    collected += decoder.decode();
  })();

  const encoder = new TextEncoder();
  for (const chunk of chunks) {
    await writer.write(encoder.encode(chunk));
  }
  await writer.close();
  await readerPromise;

  return collected;
}

/**
 * Parse OpenAI-style SSE output (`data: <json>\n\n` frames) into an array
 * of parsed events. Skips `[DONE]`.
 */
function parseOpenAISseFrames(text: string): unknown[] {
  const frames: unknown[] = [];
  for (const block of text.split("\n\n")) {
    const line = block.trim();
    if (!line || !line.startsWith("data:")) {
      continue;
    }
    const payload = line.slice(5).trim();
    if (payload === "[DONE]") {
      continue;
    }
    try {
      frames.push(JSON.parse(payload));
    } catch {
      // Ignore non-JSON frames; the transform should not emit any.
    }
  }
  return frames;
}

// ============================================================================
// Test cases
// ============================================================================

const tests = [
  // ──────────────────────────────────────────────────────────────────────
  // ID generators
  // ──────────────────────────────────────────────────────────────────────
  {
    name: "generateChatCompletionId returns chatcmpl- prefix with random suffix",
    fn: () => {
      const id = generateChatCompletionId();
      assert("prefix", id.startsWith("chatcmpl-"));
      assert(
        "non-empty random suffix",
        id.length > "chatcmpl-".length,
        `id=${id}`,
      );
      // Verify uniqueness — two calls should differ.
      const id2 = generateChatCompletionId();
      assert("ids differ between calls", id !== id2, `id=${id} id2=${id2}`);
      return true;
    },
  },
  {
    name: "generateOpenAIToolCallId returns call_ prefix",
    fn: () => {
      const id = generateOpenAIToolCallId();
      assert("prefix", id.startsWith("call_"));
      return true;
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // buildOpenAIError envelope (regression test for Copilot C1)
  // ──────────────────────────────────────────────────────────────────────
  {
    name: "buildOpenAIError emits OpenAI-shaped error envelope with mapped type",
    fn: () => {
      const e400 = buildOpenAIError(400, "bad input") as OpenAIErrorResponse;
      assert("400 has .error", typeof e400.error === "object");
      assertEqual("400 message", e400.error.message, "bad input");
      assert(
        "400 type is invalid_request_error",
        e400.error.type === "invalid_request_error",
        `got ${e400.error.type}`,
      );

      const e500 = buildOpenAIError(500, "boom") as OpenAIErrorResponse;
      assert(
        "500 maps to server-class error",
        e500.error.type === "server_error" ||
          e500.error.type === "api_error" ||
          e500.error.type === "internal_error",
        `got ${e500.error.type}`,
      );

      const e429 = buildOpenAIError(429, "slow down") as OpenAIErrorResponse;
      assert(
        "429 type is rate_limit_exceeded",
        e429.error.type === "rate_limit_exceeded" ||
          e429.error.type === "rate_limit_error",
        `got ${e429.error.type}`,
      );
      return true;
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // parseOpenAIRequest
  // ──────────────────────────────────────────────────────────────────────
  {
    name: "parseOpenAIRequest extracts system + last user prompt",
    fn: () => {
      const req: OpenAICompletionRequest = {
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are helpful." },
          { role: "user", content: "First turn" },
          { role: "assistant", content: "Hi" },
          { role: "user", content: "Second turn — what's 2+2?" },
        ],
        max_tokens: 256,
        temperature: 0.5,
      };
      const parsed = parseOpenAIRequest(req);
      assertEqual("systemPrompt", parsed.systemPrompt, "You are helpful.");
      assert(
        "prompt is last user message",
        parsed.prompt.includes("Second turn"),
        `got "${parsed.prompt}"`,
      );
      assertEqual("maxTokens", parsed.maxTokens, 256);
      assertEqual("temperature", parsed.temperature, 0.5);
      assertEqual("model", parsed.model, "gpt-4o");
      return true;
    },
  },
  {
    name: "parseOpenAIRequest converts OpenAI tools to internal tool registry",
    fn: () => {
      const req: OpenAICompletionRequest = {
        model: "gpt-4o",
        messages: [{ role: "user", content: "ping" }],
        tools: [
          {
            type: "function",
            function: {
              name: "echo",
              description: "Echo back a string",
              parameters: {
                type: "object",
                properties: { msg: { type: "string" } },
                required: ["msg"],
              },
            },
          },
        ],
        tool_choice: "auto",
      };
      const parsed = parseOpenAIRequest(req);
      assert("echo tool registered", "echo" in parsed.tools);
      assertEqual("tool count", Object.keys(parsed.tools).length, 1);
      assertEqual("toolChoice", parsed.toolChoice, "auto");
      return true;
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // convertOpenAIToClaudeRequest
  // ──────────────────────────────────────────────────────────────────────
  {
    name: "convertOpenAIToClaudeRequest preserves model + max_tokens + messages",
    fn: () => {
      const req: OpenAICompletionRequest = {
        model: "gpt-4o",
        messages: [
          { role: "system", content: "S" },
          { role: "user", content: "U" },
        ],
        max_tokens: 128,
      };
      const claude = convertOpenAIToClaudeRequest(req);
      assertEqual("claude.model", claude.model, "gpt-4o");
      assertEqual("claude.max_tokens", claude.max_tokens, 128);
      assert(
        "claude.system carries S",
        typeof claude.system === "string"
          ? claude.system.includes("S")
          : Array.isArray(claude.system) &&
              claude.system.some((b) =>
                (b as { text?: string }).text?.includes("S"),
              ),
        `got ${JSON.stringify(claude.system)}`,
      );
      assert(
        "claude.messages has a user turn",
        claude.messages.some((m) => m.role === "user"),
      );
      return true;
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // convertClaudeToOpenAIResponse
  // ──────────────────────────────────────────────────────────────────────
  {
    name: "convertClaudeToOpenAIResponse maps content + usage",
    fn: () => {
      const claude: ClaudeResponse = {
        id: "msg_test",
        type: "message",
        role: "assistant",
        model: "claude-haiku-4-5",
        content: [{ type: "text", text: "Hello world" }],
        stop_reason: "end_turn",
        usage: { input_tokens: 12, output_tokens: 3 },
      };
      const openai = convertClaudeToOpenAIResponse(claude, "gpt-4o");
      assert(
        "openai object",
        (openai as { object?: string }).object === "chat.completion",
      );
      assertEqual(
        "openai model echoes request alias",
        (openai as { model: string }).model,
        "claude-haiku-4-5",
      );
      const choice = (
        openai as {
          choices: Array<{
            index: number;
            message: { role: string; content: string };
            finish_reason: string;
          }>;
        }
      ).choices[0];
      assertEqual("choice.0.role", choice.message.role, "assistant");
      assertEqual("choice.0.content", choice.message.content, "Hello world");
      assertEqual("choice.0.finish_reason", choice.finish_reason, "stop");

      const usage = (
        openai as {
          usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
          };
        }
      ).usage;
      assertEqual("usage.prompt_tokens", usage.prompt_tokens, 12);
      assertEqual("usage.completion_tokens", usage.completion_tokens, 3);
      assertEqual("usage.total_tokens", usage.total_tokens, 15);
      return true;
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // SSE transform — happy path (text deltas)
  // ──────────────────────────────────────────────────────────────────────
  {
    name: "createClaudeToOpenAIStreamTransform emits chatcmpl chunks for text deltas",
    fn: async () => {
      const transform = createClaudeToOpenAIStreamTransform("gpt-4o");
      const chunks = [
        `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { id: "m1", model: "claude-haiku-4-5", usage: { input_tokens: 5 } } })}\n\n`,
        `event: content_block_start\ndata: ${JSON.stringify({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } })}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Hel" } })}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "lo" } })}\n\n`,
        `event: content_block_stop\ndata: ${JSON.stringify({ type: "content_block_stop", index: 0 })}\n\n`,
        `event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 2 } })}\n\n`,
        `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`,
      ];
      const out = await runTransform(transform, chunks);

      assert("ends with [DONE] sentinel", out.includes("data: [DONE]"));
      const frames = parseOpenAISseFrames(out);
      assert("emitted at least 2 frames", frames.length >= 2);

      const textDeltas = frames
        .map(
          (f) =>
            (f as { choices?: Array<{ delta?: { content?: string } }> })
              .choices?.[0]?.delta?.content ?? "",
        )
        .join("");
      assert(
        "concatenated text deltas == 'Hello'",
        textDeltas === "Hello",
        `got "${textDeltas}"`,
      );

      const finishFrame = frames.find(
        (f) =>
          (f as { choices?: Array<{ finish_reason?: string | null }> })
            .choices?.[0]?.finish_reason !== null &&
          (f as { choices?: Array<{ finish_reason?: string | null }> })
            .choices?.[0]?.finish_reason !== undefined,
      );
      assert(
        "has a finish_reason frame mapped to 'stop'",
        (finishFrame as { choices: Array<{ finish_reason: string }> })
          .choices[0].finish_reason === "stop",
      );
      return true;
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // SSE transform — chunk boundary that splits an event mid-frame
  // (regression guard for CR-D — flush() must drain any held bytes)
  // ──────────────────────────────────────────────────────────────────────
  {
    name: "createClaudeToOpenAIStreamTransform handles event split across chunks (decoder flush)",
    fn: async () => {
      const transform = createClaudeToOpenAIStreamTransform("gpt-4o");

      const start = `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { id: "m1", model: "claude-haiku-4-5", usage: { input_tokens: 1 } } })}\n\n`;
      const block = `event: content_block_start\ndata: ${JSON.stringify({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } })}\n\n`;
      const delta = `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "World" } })}\n\n`;
      const stop = `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`;

      // Slice the delta event in half so the second half arrives only after
      // the buffer is empty — verifying the parser correctly drains across
      // chunk boundaries.
      const half = Math.floor(delta.length / 2);
      const part1 = delta.slice(0, half);
      const part2 = delta.slice(half);

      const out = await runTransform(transform, [
        start,
        block,
        part1,
        part2,
        stop,
      ]);
      const frames = parseOpenAISseFrames(out);
      const textDeltas = frames
        .map(
          (f) =>
            (f as { choices?: Array<{ delta?: { content?: string } }> })
              .choices?.[0]?.delta?.content ?? "",
        )
        .join("");
      assert(
        "delta survives split chunk boundary",
        textDeltas === "World",
        `got "${textDeltas}"`,
      );
      return true;
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // SSE transform — tool_use translation
  // ──────────────────────────────────────────────────────────────────────
  {
    name: "createClaudeToOpenAIStreamTransform emits tool_calls for tool_use blocks",
    fn: async () => {
      const transform = createClaudeToOpenAIStreamTransform("gpt-4o");
      const chunks = [
        `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { id: "m2", model: "claude-haiku-4-5", usage: { input_tokens: 2 } } })}\n\n`,
        `event: content_block_start\ndata: ${JSON.stringify({ type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "tu_1", name: "echo" } })}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: '{"msg":"hi"}' } })}\n\n`,
        `event: content_block_stop\ndata: ${JSON.stringify({ type: "content_block_stop", index: 0 })}\n\n`,
        `event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: "tool_use" }, usage: { output_tokens: 4 } })}\n\n`,
        `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`,
      ];
      const out = await runTransform(transform, chunks);
      const frames = parseOpenAISseFrames(out);

      const toolNameFrame = frames.find(
        (f) =>
          ((
            f as {
              choices?: Array<{
                delta?: {
                  tool_calls?: Array<{ function?: { name?: string } }>;
                };
              }>;
            }
          ).choices?.[0]?.delta?.tool_calls?.[0]?.function?.name ?? "") ===
          "echo",
      );
      assert("found tool_use frame naming 'echo'", toolNameFrame !== undefined);

      const finishFrame = frames.find(
        (f) =>
          (f as { choices?: Array<{ finish_reason?: string | null }> })
            .choices?.[0]?.finish_reason === "tool_calls",
      );
      assert(
        "stop_reason 'tool_use' maps to OpenAI finish_reason 'tool_calls'",
        finishFrame !== undefined,
      );
      return true;
    },
  },
];

// ============================================================================
// Runner
// ============================================================================

async function runAll(): Promise<void> {
  logSection("Proxy OpenAI Format Tests");
  for (const test of tests) {
    try {
      const ok = await test.fn();
      recordTest(
        test.name,
        ok === true,
        false,
        ok === true ? undefined : "assertion returned false",
      );
      log(
        `  ${ok === true ? "PASS" : "FAIL"} — ${test.name}`,
        ok === true ? "green" : "red",
      );
    } catch (e) {
      recordTest(test.name, false, false, getErrorMessage(e));
      log(`  FAIL — ${test.name}: ${getErrorMessage(e)}`, "red");
    }
  }
}

await runSuite(runAll);
