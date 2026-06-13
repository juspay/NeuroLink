#!/usr/bin/env tsx
/**
 * Continuous Test Suite: robust structured-output coercion (pure, no API).
 *
 * coerceJsonToSchema() is the fallback that recovers a schema-valid object from
 * imperfect model text when AI-SDK experimental_output didn't yield one. Two
 * robustness properties added here (previously hand-rolled in consumers):
 *   1. Among MULTIPLE schema-valid candidates, prefer the most COMPLETE one —
 *      with nullable fields a lean preamble `{summary, attachment:null}`
 *      validates alongside the real `{summary, attachment:{...}}`, and breaking
 *      on the first match dropped the payload.
 *   2. Unwrap a JSON-string-literal wrapper (providers that double-encode).
 *
 * Run: npx tsx test/continuous-test-suite-structured-coerce.ts
 */
import { defineSuite, assertEqual } from "./helpers/harness.js";
import { coerceJsonToSchema } from "../src/lib/utils/json/coerce.js";

const { test, runSuite } = defineSuite("Structured-output coercion recovery");

// Minimal schema: any object with a string `summary` is valid (so BOTH the lean
// preamble and the full payload validate — exactly the ambiguous case).
const schema = {
  safeParse: (v: unknown) => ({
    success:
      !!v &&
      typeof v === "object" &&
      typeof (v as { summary?: unknown }).summary === "string",
  }),
} as unknown as Parameters<typeof coerceJsonToSchema>[1];

const summaryOf = (r: ReturnType<typeof coerceJsonToSchema>): string =>
  (r?.structuredData as { summary?: string } | undefined)?.summary ?? "";
const hasAttachment = (r: ReturnType<typeof coerceJsonToSchema>): boolean =>
  !!(r?.structuredData as { attachment?: unknown } | undefined)?.attachment;

await test("prefers the most COMPLETE candidate over a lean preamble (preamble first)", () => {
  const text =
    '{"summary":"working on it","attachment":null}\n' +
    '{"summary":"done","attachment":{"content":"a much larger real payload body"}}';
  const r = coerceJsonToSchema(text, schema);
  assertEqual(summaryOf(r), "done", "should pick the richer object");
  assertEqual(hasAttachment(r), true, "richer object keeps its attachment");
});

await test("prefers the most COMPLETE candidate regardless of order (payload first)", () => {
  const text =
    '{"summary":"done","attachment":{"content":"a much larger real payload body"}}\n' +
    '{"summary":"working on it","attachment":null}';
  const r = coerceJsonToSchema(text, schema);
  assertEqual(summaryOf(r), "done", "order-independent selection");
});

await test("extracts a fenced ```json object embedded in prose", () => {
  const text =
    'Sure, here you go:\n```json\n{"summary":"fenced","attachment":null}\n```\nLet me know!';
  const r = coerceJsonToSchema(text, schema);
  assertEqual(summaryOf(r), "fenced", "object recovered from fence");
});

await test("unwraps a JSON-string-literal wrapper (double-encoded output)", () => {
  const text = JSON.stringify('{"summary":"wrapped","attachment":null}');
  const r = coerceJsonToSchema(text, schema);
  assertEqual(summaryOf(r), "wrapped", "object recovered from string literal");
});

await test("returns a clean object unchanged", () => {
  const r = coerceJsonToSchema('{"summary":"clean","attachment":null}', schema);
  assertEqual(summaryOf(r), "clean", "clean object passes through");
});

await test("no schema → first parseable object wins (unchanged behavior)", () => {
  const r = coerceJsonToSchema('{"a":1}\n{"b":2}');
  assertEqual(
    JSON.stringify(r?.structuredData),
    JSON.stringify({ a: 1 }),
    "first object with no schema",
  );
});

await test("returns null when no JSON object is present", () => {
  assertEqual(
    coerceJsonToSchema("just prose, no json here", schema),
    null,
    "no object",
  );
});

await runSuite();
