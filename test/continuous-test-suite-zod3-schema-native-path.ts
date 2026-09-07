#!/usr/bin/env tsx
import "dotenv/config";

/**
 * Continuous Test Suite — the Zod 4 native path must key off the SCHEMA,
 * not off `z.toJSONSchema` merely being importable.
 *
 * `convertZodToJsonSchema` preferred Zod 4's native `z.toJSONSchema` whenever
 * that function existed:
 *
 *     if (zodToJsonSchemaV4) { ... }
 *
 * The two Zod majors coexist in real installs. A host application on Zod 3
 * (very common — `@anthropic-ai/claude-agent-sdk` pins Zod 3) still resolves
 * NeuroLink's own Zod 4, so `zodToJsonSchemaV4` is defined while every schema
 * handed in was built by the host's Zod 3. Zod 4's converter reads
 * `schema._zod.def`; a Zod 3 schema has only `_def`, so the call threw
 *
 *     TypeError: Cannot read properties of undefined (reading 'def')
 *
 * on EVERY tool-schema conversion, logged a warning, and fell through to the
 * Zod 3 path. Observed 240 times in a single Curator run — correct output,
 * but a thrown exception plus a warning per tool per request.
 *
 * The guard is now `zodToJsonSchemaV4 && isZod4Schema(zodSchema)`, so a Zod 3
 * schema goes straight to the `zod-to-json-schema` path with no throw.
 *
 * No API keys and no second Zod install: the branch is decided purely by the
 * schema's shape, so a Zod-3-shaped schema (`_def` + `parse`, no `_zod`)
 * exercises exactly the code path a real Zod 3 schema takes.
 *
 * Run: npx tsx test/continuous-test-suite-zod3-schema-native-path.ts
 */

import { z } from "zod";
import { defineSuite, assert, assertEqual } from "./helpers/harness.js";
import {
  convertZodToJsonSchema,
  isZod4Schema,
  isZodSchema,
} from "../src/lib/utils/schemaConversion.js";
import { logger } from "../src/lib/utils/logger.js";

/**
 * Run `fn` with `logger.warn` captured. The native attempt is only observable
 * through the warning it logs on failure, so a test that merely checks the
 * returned schema cannot tell the two branches apart — both produce one.
 */
function captureWarnings<T>(fn: () => T): { result: T; warnings: string[] } {
  const warnings: string[] = [];
  const original = logger.warn;
  (logger as { warn: (...args: unknown[]) => void }).warn = (
    ...args: unknown[]
  ) => {
    warnings.push(String(args[0]));
  };
  try {
    return { result: fn(), warnings };
  } finally {
    (logger as { warn: unknown }).warn = original;
  }
}

const NATIVE_FAILURE_WARNING = "Native z.toJSONSchema failed";

/**
 * A schema with Zod 3's shape: `_def` and `parse`, and crucially no `_zod`.
 * Zod 3's real objects are structurally this from the guard's point of view.
 */
function zod3ShapedSchema(): Record<string, unknown> {
  return {
    _def: {
      typeName: "ZodObject",
      shape: () => ({}),
    },
    parse: (v: unknown) => v,
  };
}

const { test, runSuite } = defineSuite("zod3 schema native path", {
  offline: true,
});

void runSuite(async () => {
  await test("isZod4Schema separates a real Zod 4 schema from a Zod 3 shaped one", () => {
    const v4 = z.object({ a: z.string() });
    assertEqual(isZod4Schema(v4), true, "a real Zod 4 schema carries _zod");
    assertEqual(
      isZod4Schema(zod3ShapedSchema()),
      false,
      "a Zod 3 schema has _def but no _zod",
    );
    assertEqual(
      isZodSchema(zod3ShapedSchema()),
      true,
      "the Zod 3 shape is still recognised as a Zod schema at all",
    );
    assertEqual(isZod4Schema(null), false, "null is not a Zod 4 schema");
    assertEqual(isZod4Schema("nope"), false, "a string is not a Zod 4 schema");
  });

  await test("a Zod 3 schema never attempts the Zod 4 native path", () => {
    // Before the fix this threw inside z.toJSONSchema, was caught, logged
    // "Native z.toJSONSchema failed", and only then produced a result. Both
    // branches return a valid schema, so the WARNING is the only thing that
    // distinguishes them — assert on that, or this test cannot fail.
    const { result, warnings } = captureWarnings(() =>
      convertZodToJsonSchema(zod3ShapedSchema()),
    );
    const out = result as Record<string, unknown>;
    assert(!!out && typeof out === "object", "conversion returns an object");
    assertEqual(out.type, "object", "a Zod 3 object schema stays an object");
    assertEqual(
      warnings.filter((w) => w.includes(NATIVE_FAILURE_WARNING)).length,
      0,
      `the Zod 4 native path must not be attempted for a Zod 3 schema — got: ${warnings.join(" | ")}`,
    );
  });

  await test("real Zod 4 schemas still take the native path and keep their fields", () => {
    const schema = z.object({
      name: z.string().describe("the caller's name"),
      count: z.number(),
    });
    const { result, warnings } = captureWarnings(() =>
      convertZodToJsonSchema(schema),
    );
    assertEqual(
      warnings.filter((w) => w.includes(NATIVE_FAILURE_WARNING)).length,
      0,
      "a genuine Zod 4 schema must convert natively without falling back",
    );
    const out = result as Record<string, unknown>;
    assertEqual(
      out.type,
      "object",
      "Zod 4 object converts to an object schema",
    );
    const props = out.properties as Record<string, { type?: string }>;
    assert(!!props, "converted schema exposes properties");
    assertEqual(props.name?.type, "string", "string field survives conversion");
    assertEqual(
      props.count?.type,
      "number",
      "number field survives conversion",
    );
    assert(
      !("$schema" in out),
      "$schema metadata is stripped for Vertex/Gemini",
    );
  });

  await test("the openApi3 target still resolves for Zod 4 schemas", () => {
    const out = convertZodToJsonSchema(
      z.object({ id: z.string() }),
      "openApi3",
    ) as Record<string, unknown>;
    assertEqual(out.type, "object", "openApi3 target yields an object schema");
    const props = out.properties as Record<string, { type?: string }>;
    assertEqual(props.id?.type, "string", "openApi3 keeps the field type");
  });
});
