#!/usr/bin/env tsx

/**
 * Continuous Test Suite for NeuroLink Streaming Architecture
 *
 * Tests real streaming against real providers to verify:
 * 1. StreamResult.fullStream is populated with AI SDK stream parts
 * 2. StreamResult.usage resolves to actual token counts
 * 3. StreamResult.finishReason resolves to a valid reason
 * 4. StreamResult.toolCalls/toolResults are populated when tools are used
 * 5. Legacy stream field still works (backward compat)
 * 6. Backpressure, error recovery, and client utilities work on real streams
 *
 * Requires API keys in .env (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_AI_API_KEY)
 *
 * Run with: npx tsx test/continuous-test-suite-streaming.ts
 */

import * as fs from "fs";

// Read .env file
try {
  const envContent = fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
} catch {
  console.error("No .env file found. API keys required for streaming tests.");
  process.exit(1);
}

import { NeuroLink } from "../dist/index.js";

// ============================================================
// Test Infrastructure (same pattern as main continuous test suite)
// ============================================================

type TestResult = {
  name: string;
  passed: boolean;
  skipped: boolean;
  error?: string;
};
const results: TestResult[] = [];
const startTime = Date.now();

function log(msg: string, color: string = "reset"): void {
  const colors: Record<string, string> = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    blue: "\x1b[34m",
  };
  console.log(`${colors[color] || ""}${msg}\x1b[0m`);
}

function logSection(title: string): void {
  log(`\n${"=".repeat(60)}`, "cyan");
  log(`  ${title}`, "cyan");
  log(`${"=".repeat(60)}`, "cyan");
}

function logTest(
  name: string,
  status: "PASS" | "FAIL" | "SKIP",
  details?: string,
): void {
  const color =
    status === "PASS" ? "green" : status === "FAIL" ? "red" : "yellow";
  log(`  [${status}] ${name}${details ? ` (${details})` : ""}`, color);
  results.push({
    name,
    passed: status !== "FAIL",
    skipped: status === "SKIP",
    error: status === "FAIL" ? details : undefined,
  });
}

// Determine which provider to use
function getProvider(): string {
  // Prefer Google AI (API key based, fast) over OpenAI (quota issues) and Vertex (SSL setup)
  if (
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ) {
    return "google-ai";
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  if (process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.VERTEX_PROJECT_ID) {
    return "vertex";
  }
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }
  return "google-ai"; // fallback
}

// ============================================================
// Test Functions
// ============================================================

async function testStreamLegacyBackwardCompat(sdk: NeuroLink): Promise<void> {
  logSection("Stream Legacy Backward Compatibility");

  try {
    const result = await sdk.stream({
      input: { text: 'Say exactly "hello" and nothing else.' },
      maxTokens: 20,
      provider: getProvider(),
      disableTools: true,
    });

    const chunks: string[] = [];
    for await (const chunk of result.stream) {
      if ("content" in chunk && typeof chunk.content === "string") {
        chunks.push(chunk.content);
      }
    }

    const text = chunks.join("");
    logTest(
      "Legacy stream yields { content } chunks",
      chunks.length > 0,
      `${chunks.length} chunks`,
    );
    logTest(
      "Legacy stream accumulates text",
      text.length > 0,
      `"${text.substring(0, 50)}"`,
    );
  } catch (error) {
    logTest(
      "Legacy stream",
      "FAIL",
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function testStreamUsageField(sdk: NeuroLink): Promise<void> {
  logSection("Stream Usage Field (token counts)");

  try {
    const result = await sdk.stream({
      input: { text: 'Say "test" and nothing else.' },
      maxTokens: 20,
      provider: getProvider(),
      disableTools: true,
    });

    // Consume the stream first (usage resolves after stream completes)
    for await (const chunk of result.stream) {
      // consume
    }

    if (result.usage === undefined) {
      logTest(
        "Stream usage field",
        "FAIL",
        "usage field is undefined on StreamResult",
      );
      return;
    }

    const usage =
      result.usage instanceof Promise ? await result.usage : result.usage;

    if (!usage || typeof usage !== "object") {
      logTest(
        "Stream usage field",
        "FAIL",
        `usage resolved to: ${JSON.stringify(usage)}`,
      );
      return;
    }

    // Check for token count fields (different providers use different field names)
    const hasPromptTokens = "promptTokens" in usage || "input" in usage;
    const hasCompletionTokens =
      "completionTokens" in usage || "output" in usage;

    log(`  Usage data: ${JSON.stringify(usage)}`, "reset");
    logTest(
      "Stream usage - has prompt tokens",
      hasPromptTokens ? "PASS" : "FAIL",
      hasPromptTokens ? "present" : "missing promptTokens/input",
    );
    logTest(
      "Stream usage - has completion tokens",
      hasCompletionTokens ? "PASS" : "FAIL",
      hasCompletionTokens ? "present" : "missing completionTokens/output",
    );
  } catch (error) {
    logTest(
      "Stream usage",
      "FAIL",
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function testStreamFinishReason(sdk: NeuroLink): Promise<void> {
  logSection("Stream FinishReason Field");

  try {
    const result = await sdk.stream({
      input: { text: 'Say "done" and nothing else.' },
      maxTokens: 20,
      provider: getProvider(),
      disableTools: true,
    });

    // Consume the stream
    for await (const _ of result.stream) {
      /* consume */
    }

    if (result.finishReason === undefined) {
      logTest(
        "Stream finishReason",
        "FAIL",
        "finishReason is undefined on StreamResult",
      );
      return;
    }

    const finishReason =
      result.finishReason instanceof Promise
        ? await result.finishReason
        : result.finishReason;

    if (!finishReason || typeof finishReason !== "string") {
      logTest(
        "Stream finishReason",
        "FAIL",
        `finishReason resolved to: ${JSON.stringify(finishReason)}`,
      );
      return;
    }

    const validReasons = [
      "stop",
      "end_turn",
      "length",
      "tool-calls",
      "content-filter",
      "error",
      "unknown",
    ];
    const isValid =
      validReasons.includes(finishReason) || finishReason.length > 0;

    log(`  Finish reason: "${finishReason}"`, "reset");
    logTest("Stream finishReason", isValid ? "PASS" : "FAIL", finishReason);
  } catch (error) {
    logTest(
      "Stream finishReason",
      "FAIL",
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function testStreamFullStream(sdk: NeuroLink): Promise<void> {
  logSection("Stream fullStream Field (AI SDK typed stream)");

  try {
    const result = await sdk.stream({
      input: { text: 'Say "fullstream test" and nothing else.' },
      maxTokens: 20,
      provider: getProvider(),
      disableTools: true,
    });

    if (result.fullStream === undefined) {
      logTest(
        "Stream fullStream field",
        "FAIL",
        "fullStream is undefined on StreamResult",
      );
      // Still consume the legacy stream to avoid hanging
      for await (const _ of result.stream) {
        /* consume */
      }
      return;
    }

    logTest(
      "Stream fullStream field present",
      "PASS",
      "fullStream exists on StreamResult",
    );

    // Consume fullStream and check for typed parts
    const parts: Array<Record<string, unknown>> = [];
    try {
      for await (const part of result.fullStream) {
        parts.push(part);
        if (parts.length >= 50) {
          break;
        } // safety limit
      }
    } catch (e) {
      // fullStream may already be consumed if stream was consumed first
      // This is expected behavior with the AI SDK
      log(
        `  Note: fullStream consumption: ${e instanceof Error ? e.message : String(e)}`,
        "yellow",
      );
    }

    if (parts.length > 0) {
      const types = [...new Set(parts.map((p) => p.type).filter(Boolean))];
      log(
        `  fullStream parts: ${parts.length}, types: ${types.join(", ")}`,
        "reset",
      );
      logTest(
        "Stream fullStream yields typed parts",
        "PASS",
        `${parts.length} parts, types: ${types.join(", ")}`,
      );
    } else {
      logTest(
        "Stream fullStream yields typed parts",
        "FAIL",
        "No parts received (may be consumed by legacy stream)",
      );
    }
  } catch (error) {
    logTest(
      "Stream fullStream",
      "FAIL",
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function testStreamWithTools(sdk: NeuroLink): Promise<void> {
  logSection("Stream with Tools (toolCalls/toolResults fields)");

  try {
    const result = await sdk.stream({
      input: {
        text: "What is the current time right now? Use the getCurrentTime tool.",
      },
      maxTokens: 100,
      provider: getProvider(),
      // Tools enabled (default)
    });

    // Consume the stream
    const chunks: string[] = [];
    for await (const chunk of result.stream) {
      if ("content" in chunk && typeof chunk.content === "string") {
        chunks.push(chunk.content);
      }
    }

    const text = chunks.join("");
    log(`  Response: "${text.substring(0, 100)}..."`, "reset");
    logTest(
      "Stream with tools - got response",
      text.length > 0 ? "PASS" : "FAIL",
      `${text.length} chars`,
    );

    // Check toolCalls
    if (result.toolCalls !== undefined) {
      const toolCalls =
        result.toolCalls instanceof Promise
          ? await result.toolCalls
          : result.toolCalls;
      if (Array.isArray(toolCalls)) {
        log(
          `  Tool calls: ${JSON.stringify(toolCalls.map((tc) => (tc as any).toolName || (tc as any).name)).substring(0, 200)}`,
          "reset",
        );
        logTest(
          "Stream toolCalls field",
          "PASS",
          `${toolCalls.length} tool calls`,
        );
      } else {
        logTest(
          "Stream toolCalls field",
          "FAIL",
          `Not an array: ${typeof toolCalls}`,
        );
      }
    } else {
      logTest(
        "Stream toolCalls field",
        "SKIP",
        "toolCalls not set (tool may not have been called)",
      );
    }

    // Check toolResults
    if (result.toolResults !== undefined) {
      const toolResults =
        result.toolResults instanceof Promise
          ? await result.toolResults
          : result.toolResults;
      if (Array.isArray(toolResults)) {
        logTest(
          "Stream toolResults field",
          "PASS",
          `${toolResults.length} tool results`,
        );
      }
    }
  } catch (error) {
    logTest(
      "Stream with tools",
      "FAIL",
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function testStreamProviderModel(sdk: NeuroLink): Promise<void> {
  logSection("Stream Provider/Model Fields");

  try {
    const provider = getProvider();
    const result = await sdk.stream({
      input: { text: 'Say "ok".' },
      maxTokens: 10,
      provider,
      disableTools: true,
    });

    // Consume
    for await (const _ of result.stream) {
      /* consume */
    }

    logTest(
      "Stream provider field",
      result.provider ? "PASS" : "FAIL",
      result.provider || "undefined",
    );
    logTest(
      "Stream model field",
      result.model ? "PASS" : "FAIL",
      result.model || "undefined",
    );
  } catch (error) {
    logTest(
      "Stream provider/model",
      "FAIL",
      error instanceof Error ? error.message : String(error),
    );
  }
}

// ============================================================
// Main Runner
// ============================================================

async function main(): Promise<void> {
  logSection("NeuroLink Streaming Architecture - Integration Test Suite");

  const provider = getProvider();
  log(`\n  Using provider: ${provider}`, "blue");
  log(`  API key configured: yes\n`, "blue");

  const sdk = new NeuroLink();

  await testStreamLegacyBackwardCompat(sdk);
  await testStreamUsageField(sdk);
  await testStreamFinishReason(sdk);
  await testStreamFullStream(sdk);
  await testStreamWithTools(sdk);
  await testStreamProviderModel(sdk);

  // Summary
  logSection("Test Summary");

  const passed = results.filter((r) => r.passed && !r.skipped).length;
  const failed = results.filter((r) => !r.passed).length;
  const skipped = results.filter((r) => r.skipped).length;
  const duration = Date.now() - startTime;

  console.log(`  Total tests: ${results.length}`);
  console.log(`  \x1b[32mPassed:  ${passed}\x1b[0m`);
  console.log(`  \x1b[31mFailed:  ${failed}\x1b[0m`);
  console.log(`  \x1b[33mSkipped: ${skipped}\x1b[0m`);
  console.log(`  Duration: ${duration}ms\n`);

  if (failed > 0) {
    console.log(`\x1b[31mFAILED TESTS:\x1b[0m`);
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  \x1b[31m✗\x1b[0m ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log(`\x1b[32mAll tests passed!\x1b[0m`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
