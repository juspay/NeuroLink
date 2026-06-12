#!/usr/bin/env tsx
import "dotenv/config";

/**
 * Vertex / Langfuse Span Telemetry Suite
 *
 * Locks in the pure-logic pieces of commit 5747c021
 * ("feat(observability): emit Langfuse spans for the native Vertex provider
 * path"). The span *wiring* is exercised against the live provider in the
 * observability suites; here we cover the deterministic, credential-free
 * helpers that the new span code leans on:
 *
 *   1. spanJsonAttribute()  — the serializer + hard length cap that stops a
 *      pathological prompt/tool result from putting megabytes on one span.
 *   2. LANGFUSE_ATTR / SPAN_ATTRIBUTE_MAX_CHARS — the attribute-name contract
 *      the LangfuseSpanProcessor maps to observations.
 *   3. sanitizeAnthropicMessagesForTrace() — strips base64 image/PDF payloads
 *      from messages before they land on a trace attribute.
 *   4. extractMcpToolErrorMessage() — surfaces MCP tools that signal failure by
 *      RETURNING { isError: true } (execute()'s try/catch never sees it).
 *
 * No network, no API keys — pure functions only.
 *
 * Run with: npx tsx test/continuous-test-suite-vertex-langfuse-spans.ts
 *       or: pnpm run test:vertex-langfuse-spans
 */

import {
  LANGFUSE_ATTR,
  SPAN_ATTRIBUTE_MAX_CHARS,
  spanJsonAttribute,
} from "../src/lib/telemetry/index.js";
import { extractMcpToolErrorMessage } from "../src/lib/utils/mcpErrorText.js";
import { sanitizeAnthropicMessagesForTrace } from "../src/lib/utils/anthropicTraceSanitizer.js";
import {
  setLangfuseContext,
  stampGuestRescueIdentity,
} from "../src/lib/services/server/ai/observability/instrumentation.js";
import type { VertexAnthropicMessage } from "../src/lib/types/index.js";
import {
  assert,
  assertEqual,
  assertIncludes,
  defineSuite,
} from "./helpers/harness.js";

/** Minimal Span stand-in that records the attributes set on it. */
function makeFakeSpan(): {
  attrs: Record<string, unknown>;
  span: Parameters<typeof stampGuestRescueIdentity>[0];
} {
  const attrs: Record<string, unknown> = {};
  const span = {
    setAttribute(key: string, value: unknown) {
      attrs[key] = value;
      return this;
    },
  } as unknown as Parameters<typeof stampGuestRescueIdentity>[0];
  return { attrs, span };
}

const { test, section, runSuite } = defineSuite(
  "Vertex / Langfuse Span Telemetry",
);

await runSuite(async () => {
  // ─────────────────────────────────────────────────────────────────────
  section("spanJsonAttribute — serialization");

  await test("string value passes through unserialized (no added quotes)", () => {
    assertEqual(spanJsonAttribute("hello world"), "hello world");
  });

  await test("object value is JSON-stringified", () => {
    assertEqual(spanJsonAttribute({ a: 1, b: "x" }), '{"a":1,"b":"x"}');
  });

  await test("number / boolean values stringify", () => {
    assertEqual(spanJsonAttribute(42), "42");
    assertEqual(spanJsonAttribute(true), "true");
  });

  await test("array value is JSON-stringified", () => {
    assertEqual(spanJsonAttribute([1, 2, 3]), "[1,2,3]");
  });

  await test("undefined falls back to String() (JSON.stringify→undefined)", () => {
    // JSON.stringify(undefined) === undefined, so the `?? String(value)` kicks in.
    assertEqual(spanJsonAttribute(undefined), "undefined");
  });

  await test("circular structure does not throw — String() fallback", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    let result: string | undefined;
    let threw = false;
    try {
      result = spanJsonAttribute(circular);
    } catch {
      threw = true;
    }
    assert(!threw, "spanJsonAttribute threw on a circular structure");
    assertEqual(result, "[object Object]");
  });

  // ─────────────────────────────────────────────────────────────────────
  section("spanJsonAttribute — length cap");

  await test("value at/under the cap is not truncated", () => {
    const exact = "x".repeat(100);
    assertEqual(spanJsonAttribute(exact, 100), exact);
  });

  await test("value one char over the cap is truncated with exact suffix", () => {
    const over = "y".repeat(101);
    const out = spanJsonAttribute(over, 100);
    assertEqual(out, `${"y".repeat(100)}...[truncated 1 chars]`);
  });

  await test("truncated output keeps the first maxChars chars intact", () => {
    const out = spanJsonAttribute("z".repeat(5000), 1000);
    assert(out.startsWith("z".repeat(1000)), "prefix was altered");
    assertIncludes(out, "...[truncated 4000 chars]");
  });

  await test("default cap is SPAN_ATTRIBUTE_MAX_CHARS (40_000)", () => {
    const out = spanJsonAttribute("a".repeat(SPAN_ATTRIBUTE_MAX_CHARS + 1));
    assertIncludes(out, "...[truncated 1 chars]");
    // Just under the default cap must NOT truncate.
    const under = spanJsonAttribute("b".repeat(SPAN_ATTRIBUTE_MAX_CHARS));
    assert(!under.includes("[truncated"), "value at default cap was truncated");
  });

  // ─────────────────────────────────────────────────────────────────────
  section("LANGFUSE_ATTR / SPAN_ATTRIBUTE_MAX_CHARS — attribute contract");

  await test("SPAN_ATTRIBUTE_MAX_CHARS is 40_000", () => {
    assertEqual(SPAN_ATTRIBUTE_MAX_CHARS, 40_000);
  });

  await test("known attribute names map to the langfuse.* keys Langfuse reads", () => {
    assertEqual(LANGFUSE_ATTR.TRACE_NAME, "langfuse.trace.name");
    assertEqual(LANGFUSE_ATTR.TRACE_INPUT, "langfuse.trace.input");
    assertEqual(LANGFUSE_ATTR.TRACE_OUTPUT, "langfuse.trace.output");
    assertEqual(LANGFUSE_ATTR.OBSERVATION_TYPE, "langfuse.observation.type");
    assertEqual(
      LANGFUSE_ATTR.OBSERVATION_USAGE_DETAILS,
      "langfuse.observation.usage_details",
    );
    assertEqual(
      LANGFUSE_ATTR.OBSERVATION_COMPLETION_START_TIME,
      "langfuse.observation.completion_start_time",
    );
  });

  await test("every LANGFUSE_ATTR value is a non-empty langfuse.* string", () => {
    const values = Object.values(LANGFUSE_ATTR);
    assert(values.length >= 13, `expected ≥13 attrs, got ${values.length}`);
    for (const v of values) {
      assert(
        typeof v === "string" && v.startsWith("langfuse."),
        `attribute "${v}" is not a langfuse.* key`,
      );
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  section("sanitizeAnthropicMessagesForTrace — base64 stripping");

  await test("string content passes through as { role, content }", () => {
    const msgs: VertexAnthropicMessage[] = [
      { role: "user", content: "just text" },
    ];
    const out = sanitizeAnthropicMessagesForTrace(msgs);
    assertEqual(out.length, 1);
    assertEqual(out[0].role, "user");
    assertEqual(out[0].content, "just text");
  });

  await test("image block: base64 data replaced by char count, payload dropped", () => {
    const data = "A".repeat(2048);
    const msgs: VertexAnthropicMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data },
          },
        ],
      },
    ];
    const out = sanitizeAnthropicMessagesForTrace(msgs);
    const block = (out[0].content as Array<Record<string, unknown>>)[0];
    assertEqual(block.type, "image");
    assertEqual(block.media_type, "image/png");
    assertEqual(block.base64_chars, 2048);
    // The actual payload must be gone — this is the whole point of the helper.
    assert(!("data" in block), "base64 data leaked onto the trace block");
    assert(
      !("source" in block),
      "raw source object leaked onto the trace block",
    );
    assert(
      !JSON.stringify(out).includes("AAAA"),
      "serialized trace still contains base64 payload",
    );
  });

  await test("document block is stripped the same way as image", () => {
    const msgs: VertexAnthropicMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: "PDFBYTES".repeat(10),
            },
          },
        ],
      },
    ];
    const out = sanitizeAnthropicMessagesForTrace(msgs);
    const block = (out[0].content as Array<Record<string, unknown>>)[0];
    assertEqual(block.type, "document");
    assertEqual(block.media_type, "application/pdf");
    assertEqual(block.base64_chars, 80);
    assert(!("data" in block), "pdf data leaked onto the trace block");
  });

  await test("text / tool_use blocks pass through untouched", () => {
    const msgs: VertexAnthropicMessage[] = [
      {
        role: "assistant",
        content: [
          { type: "text", text: "hello" },
          { type: "tool_use", id: "t1", name: "search", input: { q: "x" } },
        ],
      },
    ];
    const out = sanitizeAnthropicMessagesForTrace(msgs);
    const blocks = out[0].content as Array<Record<string, unknown>>;
    assertEqual(blocks[0].text, "hello");
    assertEqual(blocks[1].name, "search");
    assertEqual((blocks[1].input as { q: string }).q, "x");
  });

  await test("mixed multi-message conversation maps element-for-element", () => {
    const msgs: VertexAnthropicMessage[] = [
      { role: "user", content: "first" },
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: "Z".repeat(64),
            },
          },
          { type: "text", text: "describe this" },
        ],
      },
    ];
    const out = sanitizeAnthropicMessagesForTrace(msgs);
    assertEqual(out.length, 2);
    assertEqual(out[0].content, "first");
    const blocks = out[1].content as Array<Record<string, unknown>>;
    assertEqual(blocks.length, 2);
    assertEqual(blocks[0].base64_chars, 64);
    assertEqual(blocks[1].text, "describe this");
  });

  // ─────────────────────────────────────────────────────────────────────
  section("extractMcpToolErrorMessage — surface returned isError");

  await test("non-object / null / primitive inputs return undefined", () => {
    assertEqual(extractMcpToolErrorMessage(null), undefined);
    assertEqual(extractMcpToolErrorMessage(undefined), undefined);
    assertEqual(extractMcpToolErrorMessage("error"), undefined);
    assertEqual(extractMcpToolErrorMessage(123), undefined);
  });

  await test("object without is:Error (or isError !== true) returns undefined", () => {
    assertEqual(extractMcpToolErrorMessage({}), undefined);
    assertEqual(extractMcpToolErrorMessage({ isError: false }), undefined);
    // Truthy-but-not-boolean-true must not count as an error.
    assertEqual(extractMcpToolErrorMessage({ isError: "true" }), undefined);
    assertEqual(extractMcpToolErrorMessage({ isError: 1 }), undefined);
  });

  await test("isError:true with no usable content → generic message", () => {
    assertEqual(
      extractMcpToolErrorMessage({ isError: true }),
      "MCP tool returned isError: true",
    );
    assertEqual(
      extractMcpToolErrorMessage({ isError: true, content: "not-an-array" }),
      "MCP tool returned isError: true",
    );
    assertEqual(
      extractMcpToolErrorMessage({ isError: true, content: [{}, null] }),
      "MCP tool returned isError: true",
    );
  });

  await test("isError:true surfaces the first content block's text", () => {
    assertEqual(
      extractMcpToolErrorMessage({
        isError: true,
        content: [{ type: "text", text: "boom" }],
      }),
      "MCP tool returned isError: boom",
    );
  });

  await test("multiple text blocks are joined; non-text blocks ignored", () => {
    assertEqual(
      extractMcpToolErrorMessage({
        isError: true,
        content: [
          { type: "text", text: "first" },
          { type: "image" },
          { type: "text", text: "second" },
        ],
      }),
      "MCP tool returned isError: first second",
    );
  });

  await test("a block with text but no type:text is not surfaced", () => {
    // Shared extractMcpErrorText requires type === "text", so an untyped block
    // is ignored and the generic fallback is used.
    assertEqual(
      extractMcpToolErrorMessage({
        isError: true,
        content: [{ text: "untyped" }],
      }),
      "MCP tool returned isError: true",
    );
  });

  await test("long error text is capped at 500 chars", () => {
    const longText = "E".repeat(1000);
    const out = extractMcpToolErrorMessage({
      isError: true,
      content: [{ type: "text", text: longText }],
    });
    const prefix = "MCP tool returned isError: ";
    assertEqual(out, `${prefix}${"E".repeat(500)}`);
    assertEqual(out?.length, prefix.length + 500);
  });

  await test("stringified isError envelope is JSON-parsed and surfaced", () => {
    assertEqual(
      extractMcpToolErrorMessage(
        JSON.stringify({
          isError: true,
          content: [{ type: "text", text: "boom" }],
        }),
      ),
      "MCP tool returned isError: boom",
    );
  });

  await test("stringified success envelope returns undefined", () => {
    assertEqual(
      extractMcpToolErrorMessage(
        JSON.stringify({ content: [{ type: "text", text: "ok" }] }),
      ),
      undefined,
    );
  });

  await test("non-JSON string returns undefined (not an error envelope)", () => {
    assertEqual(extractMcpToolErrorMessage("just a plain string"), undefined);
  });

  // ─────────────────────────────────────────────────────────────────────
  section("stampGuestRescueIdentity — guest rescue is additive");

  await test("empty ambient + root span: stamps trace name, user, session", () => {
    const { attrs, span } = makeFakeSpan();
    stampGuestRescueIdentity(
      span,
      { userId: "u1", sessionId: "s1", traceName: "my-trace" },
      true,
    );
    assertEqual(attrs[LANGFUSE_ATTR.TRACE_NAME], "my-trace");
    assertEqual(attrs["trace.name"], "my-trace");
    assertEqual(attrs["user.id"], "u1");
    assertEqual(attrs["session.id"], "s1");
  });

  await test("empty ambient, no traceName: trace name falls back to userId", () => {
    const { attrs, span } = makeFakeSpan();
    stampGuestRescueIdentity(span, { userId: "u2" }, true);
    assertEqual(attrs[LANGFUSE_ATTR.TRACE_NAME], "u2");
    assertEqual(attrs["user.id"], "u2");
    assert(!("session.id" in attrs), "session.id set without a sessionId");
  });

  await test("non-root span: identity stamped but trace name is not", () => {
    const { attrs, span } = makeFakeSpan();
    stampGuestRescueIdentity(span, { userId: "u3", sessionId: "s3" }, false);
    assert(!(LANGFUSE_ATTR.TRACE_NAME in attrs), "trace name rescued off-root");
    assert(!("trace.name" in attrs), "trace.name rescued off-root");
    assertEqual(attrs["user.id"], "u3");
    assertEqual(attrs["session.id"], "s3");
  });

  await test("host ambient context is never overridden (additive only)", () => {
    const { attrs, span } = makeFakeSpan();
    // A host already established its own Langfuse context.
    setLangfuseContext({ userId: "host-user" }, () => {
      stampGuestRescueIdentity(
        span,
        { userId: "caller-user", sessionId: "caller-session" },
        true,
      );
    });
    // Host had userId → neither trace name nor user.id is touched…
    assert(!(LANGFUSE_ATTR.TRACE_NAME in attrs), "overrode host trace name");
    assert(!("user.id" in attrs), "overrode host user.id");
    // …but session.id, which the host lacked, is filled in additively.
    assertEqual(attrs["session.id"], "caller-session");
  });
});
