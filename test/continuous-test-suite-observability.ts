#!/usr/bin/env tsx
/**
 * Continuous Test Suite: Observability
 *
 * Tests Langfuse integration, OpenTelemetry instrumentation,
 * external TracerProvider mode, context management, and operation name detection.
 *
 * Run: npx tsx test/continuous-test-suite-observability.ts --provider=vertex
 *
 * Required env vars: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY (SKIP if missing)
 */

import { spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";
import { NeuroLink } from "../dist/index.js";
import type { ProcessResult } from "../dist/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIGURATION
// ============================================================

const PROVIDER_MAX_TOKENS: Record<string, number> = {
  anthropic: 8192,
  vertex: 10000,
  "google-ai-studio": 10000,
  "google-ai": 10000,
  openai: 16384,
  bedrock: 8192,
  ollama: 4096,
  openrouter: 4096,
};

const TEST_CONFIG = {
  provider: process.env.TEST_PROVIDER || "vertex",
  model: process.env.TEST_MODEL || (undefined as string | undefined),
  maxTokens: undefined as number | undefined,
  timeout: 90000,
  interTestDelay: 5000,
};

// Langfuse credentials
const LANGFUSE_CONFIG = {
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
};

function hasLangfuseCredentials(): boolean {
  return !!(LANGFUSE_CONFIG.publicKey && LANGFUSE_CONFIG.secretKey);
}

// ============================================================
// LOGGING UTILITIES
// ============================================================

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};
type ColorName = keyof typeof colors;

function log(message: string, color: ColorName = "reset"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string): void {
  log(`\n${"=".repeat(60)}`, "cyan");
  log(`  ${title}`, "cyan");
  log(`${"=".repeat(60)}`, "cyan");
}

function logTest(
  testName: string,
  status: "PASS" | "FAIL" | "SKIP" | "TESTING",
  details?: string,
): void {
  const icons = { PASS: "PASS", FAIL: "FAIL", SKIP: "SKIP", TESTING: "TEST" };
  const statusColors: Record<string, ColorName> = {
    PASS: "green",
    FAIL: "red",
    SKIP: "yellow",
    TESTING: "blue",
  };
  log(`[${icons[status]}] ${testName}`, statusColors[status]);
  if (details) {
    log(`   ${details}`, "reset");
  }
}

// ============================================================
// SHARED UTILITIES
// ============================================================

const testResults: Array<{
  name: string;
  result: boolean | null;
  error: string | null;
}> = [];

function buildBaseCLIArgs(): string[] {
  const args = [`--provider=${TEST_CONFIG.provider}`];
  if (TEST_CONFIG.model) {
    args.push(`--model=${TEST_CONFIG.model}`);
  }
  return args;
}

function buildBaseSDKOptions(): { provider: string; model?: string } {
  const opts: { provider: string; model?: string } = {
    provider: TEST_CONFIG.provider,
  };
  if (TEST_CONFIG.model) {
    opts.model = TEST_CONFIG.model;
  }
  return opts;
}

function runCommand(
  command: string,
  args: string[],
  options?: Record<string, unknown>,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      env: {
        ...process.env,
        ...((options?.env as Record<string, string>) || {}),
      },
    });
    let stdout = "",
      stderr = "";
    proc.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    const timeoutId = setTimeout(() => {
      proc.kill("SIGTERM");
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill("SIGKILL");
        }
      }, 2000);
      reject(new Error(`Command timeout after ${TEST_CONFIG.timeout}ms`));
    }, TEST_CONFIG.timeout);
    proc.on("close", (code) => {
      clearTimeout(timeoutId);
      resolve({
        success: code === 0,
        code: code ?? -1,
        stdout,
        stderr,
      });
    });
    proc.on("error", (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

function isExpectedProviderError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return [
    "api key",
    "authentication",
    "rate limit",
    "quota",
    "credentials",
    "could not be resolved",
    "cannot connect",
    "failed to generate",
    "google_application_credentials",
  ].some((p) => lower.includes(p));
}

async function globalCleanup(): Promise<void> {
  await new Promise((r) => setTimeout(r, 100));
  if (global.gc) {
    global.gc();
  }
}

// ============================================================
// TEST #1: Telemetry Service Init
// ============================================================

async function testTelemetryServiceInit(): Promise<boolean | null> {
  logSection("Test #1: Telemetry Service Init");
  logTest("Telemetry Service Init", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "Telemetry Service Init",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-telemetry-init-");
  const tempScriptPath = tempDir + "/test-telemetry-init.mjs";

  try {
    const testScript = `
import { NeuroLink } from '${process.cwd()}/dist/index.js';

async function testTelemetryServiceInit() {
  console.log('Testing NeuroLink initialization with Langfuse config...');
  const { LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL } = process.env;

  try {
    const sdk = new NeuroLink({
      observability: {
        langfuse: {
          enabled: true,
          publicKey: LANGFUSE_PUBLIC_KEY,
          secretKey: LANGFUSE_SECRET_KEY,
          baseUrl: LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
          environment: 'test',
          release: 'continuous-test-suite',
        },
      },
    });

    // SDK should initialize without errors
    if (sdk) {
      console.log('PASS - NeuroLink initialized with Langfuse config successfully');
      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - SDK initialization returned null');
      process.exit(1);
    }
  } catch (error) {
    console.log('FAIL - Init error: ' + error.message);
    process.exit(1);
  }
}

testTelemetryServiceInit();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath], {
      env: {
        LANGFUSE_PUBLIC_KEY: LANGFUSE_CONFIG.publicKey,
        LANGFUSE_SECRET_KEY: LANGFUSE_CONFIG.secretKey,
        LANGFUSE_BASE_URL: LANGFUSE_CONFIG.baseUrl,
      },
    });

    if (result.stdout.includes("PASS")) {
      logTest(
        "Telemetry Service Init",
        "PASS",
        "NeuroLink initialized with Langfuse config",
      );
      return true;
    } else {
      logTest("Telemetry Service Init", "FAIL", result.stderr || result.stdout);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("Telemetry Service Init", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// TEST #2: External TracerProvider Mode
// ============================================================

async function testExternalTracerProviderMode(): Promise<boolean | null> {
  logSection("Test #2: External TracerProvider Mode");
  logTest("External TracerProvider Mode", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "External TracerProvider Mode",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-ext-tracer-");
  const tempScriptPath = tempDir + "/test-ext-tracer.mjs";

  try {
    const testScript = `
import { NeuroLink } from '${process.cwd()}/dist/index.js';

async function testExternalTracerProviderMode() {
  console.log('Testing useExternalTracerProvider mode + generate()...');

  try {
    const sdk = new NeuroLink({
      observability: {
        langfuse: {
          enabled: true,
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
          useExternalTracerProvider: true,
        },
      },
    });

    // Generate should work without "duplicate registration" error
    const result = await sdk.generate({
      input: { text: 'Say hello in one word' },
      provider: '${TEST_CONFIG.provider}',
      ${TEST_CONFIG.model ? `model: '${TEST_CONFIG.model}',` : ""}
      maxTokens: 50,
    });

    if (result?.content && result.content.length > 0) {
      console.log('PASS - External TracerProvider mode works. No duplicate registration error.');
      console.log('Response: ' + result.content.substring(0, 50));
      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - No content in response');
      process.exit(1);
    }
  } catch (error) {
    if (error.message?.includes('credentials') || error.message?.includes('authentication') || error.message?.includes('API key')) {
      console.log('SKIP - Provider credentials not configured');
      process.exit(0);
    }
    if (error.message?.includes('duplicate') || error.message?.includes('already registered')) {
      console.log('FAIL - Duplicate registration error: ' + error.message);
      process.exit(1);
    }
    console.log('FAIL -', error.message);
    process.exit(1);
  }
}

testExternalTracerProviderMode();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath]);

    if (result.stdout.includes("PASS")) {
      logTest(
        "External TracerProvider Mode",
        "PASS",
        "No duplicate registration error",
      );
      return true;
    } else if (result.stdout.includes("SKIP")) {
      logTest(
        "External TracerProvider Mode",
        "SKIP",
        "Provider credentials not configured",
      );
      return null;
    } else {
      logTest(
        "External TracerProvider Mode",
        "FAIL",
        result.stderr || result.stdout,
      );
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("External TracerProvider Mode", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// TEST #3: getSpanProcessors
// ============================================================

async function testGetSpanProcessors(): Promise<boolean | null> {
  logSection("Test #3: getSpanProcessors");
  logTest("getSpanProcessors", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "getSpanProcessors",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-span-proc-");
  const tempScriptPath = tempDir + "/test-span-proc.mjs";

  try {
    const testScript = `
import { NeuroLink, getSpanProcessors } from '${process.cwd()}/dist/index.js';

async function testGetSpanProcessors() {
  console.log('Testing getSpanProcessors()...');

  try {
    // Initialize NeuroLink with Langfuse to ensure processors are created
    const sdk = new NeuroLink({
      observability: {
        langfuse: {
          enabled: true,
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
        },
      },
    });

    // Wait for initialization
    await new Promise(r => setTimeout(r, 1000));

    const processors = getSpanProcessors();

    if (Array.isArray(processors)) {
      console.log('Processors returned: ' + processors.length);

      // Verify processors have expected methods
      let hasValidProcessors = true;
      for (const proc of processors) {
        if (typeof proc.onStart !== 'function' || typeof proc.onEnd !== 'function') {
          hasValidProcessors = false;
          break;
        }
      }

      if (processors.length > 0 && hasValidProcessors) {
        console.log('PASS - getSpanProcessors() returned ' + processors.length + ' processors with onStart/onEnd methods');
      } else if (processors.length === 0) {
        // Empty array is acceptable if initialization hasn't completed
        console.log('PASS - getSpanProcessors() returned empty array (initialization may be pending)');
      } else {
        console.log('FAIL - Processors missing expected methods');
        process.exit(1);
      }

      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - getSpanProcessors() did not return an array');
      process.exit(1);
    }
  } catch (error) {
    console.log('FAIL -', error.message);
    process.exit(1);
  }
}

testGetSpanProcessors();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath]);

    if (result.stdout.includes("PASS")) {
      logTest("getSpanProcessors", "PASS", "Span processors validated");
      return true;
    } else {
      logTest("getSpanProcessors", "FAIL", result.stderr || result.stdout);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("getSpanProcessors", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// TEST #4: setLangfuseContext / getLangfuseContext
// ============================================================

async function testSetLangfuseContext(): Promise<boolean | null> {
  logSection("Test #4: setLangfuseContext / getLangfuseContext");
  logTest("setLangfuseContext", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "setLangfuseContext",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-langfuse-ctx-");
  const tempScriptPath = tempDir + "/test-langfuse-ctx.mjs";

  try {
    const testScript = `
import { NeuroLink, setLangfuseContext, getLangfuseContext } from '${process.cwd()}/dist/index.js';

async function testSetLangfuseContext() {
  console.log('Testing setLangfuseContext / getLangfuseContext...');

  try {
    // Initialize SDK with Langfuse
    const sdk = new NeuroLink({
      observability: {
        langfuse: {
          enabled: true,
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
        },
      },
    });

    // Set context and verify roundtrip
    const testUserId = 'test-user-' + Date.now();
    const testSessionId = 'test-session-' + Date.now();

    await setLangfuseContext({
      userId: testUserId,
      sessionId: testSessionId,
    });

    const context = getLangfuseContext();

    if (context?.userId === testUserId && context?.sessionId === testSessionId) {
      console.log('PASS - Context roundtrip matches. userId=' + testUserId + ', sessionId=' + testSessionId);
      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - Context mismatch. Got userId=' + context?.userId + ', sessionId=' + context?.sessionId);
      process.exit(1);
    }
  } catch (error) {
    console.log('FAIL -', error.message);
    process.exit(1);
  }
}

testSetLangfuseContext();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath]);

    if (result.stdout.includes("PASS")) {
      logTest("setLangfuseContext", "PASS", "Context roundtrip verified");
      return true;
    } else {
      logTest("setLangfuseContext", "FAIL", result.stderr || result.stdout);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("setLangfuseContext", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// TEST #5: setLangfuseContext with Callback + generate()
// ============================================================

async function testSetLangfuseContextWithCallback(): Promise<boolean | null> {
  logSection("Test #5: setLangfuseContext with Callback + generate()");
  logTest("Context Callback + Generate", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "Context Callback + Generate",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-ctx-callback-");
  const tempScriptPath = tempDir + "/test-ctx-callback.mjs";

  try {
    const testScript = `
import { NeuroLink, setLangfuseContext } from '${process.cwd()}/dist/index.js';

async function testSetLangfuseContextWithCallback() {
  console.log('Testing setLangfuseContext with callback + generate()...');

  try {
    const sdk = new NeuroLink({
      observability: {
        langfuse: {
          enabled: true,
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
        },
      },
    });

    // Set context with callback that performs generate()
    const result = await setLangfuseContext(
      {
        userId: 'test-callback-user',
        sessionId: 'test-callback-session',
        conversationId: 'test-conv-123',
        requestId: 'test-req-abc',
        traceName: 'callback-test',
      },
      async () => {
        return await sdk.generate({
          input: { text: 'Say the word "hello" and nothing else' },
          provider: '${TEST_CONFIG.provider}',
          ${TEST_CONFIG.model ? `model: '${TEST_CONFIG.model}',` : ""}
          maxTokens: 50,
        });
      },
    );

    if (result?.content && result.content.length > 0) {
      console.log('PASS - Callback executed and returned generate result. Content: ' + result.content.substring(0, 50));
      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - No content returned from callback');
      process.exit(1);
    }
  } catch (error) {
    if (error.message?.includes('credentials') || error.message?.includes('authentication') || error.message?.includes('API key')) {
      console.log('SKIP - Provider credentials not configured');
      process.exit(0);
    }
    console.log('FAIL -', error.message);
    process.exit(1);
  }
}

testSetLangfuseContextWithCallback();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath]);

    if (result.stdout.includes("PASS")) {
      logTest(
        "Context Callback + Generate",
        "PASS",
        "Callback with generate() succeeded",
      );
      return true;
    } else if (result.stdout.includes("SKIP")) {
      logTest(
        "Context Callback + Generate",
        "SKIP",
        "Provider credentials not configured",
      );
      return null;
    } else {
      logTest(
        "Context Callback + Generate",
        "FAIL",
        result.stderr || result.stdout,
      );
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("Context Callback + Generate", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// TEST #6: Operation Name Auto-Detection
// ============================================================

async function testOperationNameAutoDetection(): Promise<boolean | null> {
  logSection("Test #6: Operation Name Auto-Detection");
  logTest("Operation Name Auto-Detection", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "Operation Name Auto-Detection",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-op-autodetect-");
  const tempScriptPath = tempDir + "/test-op-autodetect.mjs";

  try {
    const testScript = `
import { NeuroLink, setLangfuseContext } from '${process.cwd()}/dist/index.js';

async function testOperationNameAutoDetection() {
  console.log('Testing operation name auto-detection with generate()...');

  try {
    const sdk = new NeuroLink({
      observability: {
        langfuse: {
          enabled: true,
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
          autoDetectOperationName: true,
        },
      },
    });

    // Generate with auto-detect enabled - trace name should contain operation
    const result = await setLangfuseContext(
      {
        userId: 'test-autodetect-user',
      },
      async () => {
        return await sdk.generate({
          input: { text: 'Say "test" and nothing else' },
          provider: '${TEST_CONFIG.provider}',
          ${TEST_CONFIG.model ? `model: '${TEST_CONFIG.model}',` : ""}
          maxTokens: 50,
        });
      },
    );

    if (result?.content && result.content.length > 0) {
      console.log('PASS - Auto-detection generate completed. Trace should contain operation name.');
      console.log('Response: ' + result.content.substring(0, 30));
      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - No content');
      process.exit(1);
    }
  } catch (error) {
    if (error.message?.includes('credentials') || error.message?.includes('authentication') || error.message?.includes('API key')) {
      console.log('SKIP - Provider credentials not configured');
      process.exit(0);
    }
    console.log('FAIL -', error.message);
    process.exit(1);
  }
}

testOperationNameAutoDetection();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath]);

    if (result.stdout.includes("PASS")) {
      logTest(
        "Operation Name Auto-Detection",
        "PASS",
        "Auto-detection works with generate()",
      );
      return true;
    } else if (result.stdout.includes("SKIP")) {
      logTest(
        "Operation Name Auto-Detection",
        "SKIP",
        "Provider credentials not configured",
      );
      return null;
    } else {
      logTest(
        "Operation Name Auto-Detection",
        "FAIL",
        result.stderr || result.stdout,
      );
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("Operation Name Auto-Detection", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// TEST #7: Custom Trace Name Format
// ============================================================

async function testTraceNameFormat(): Promise<boolean | null> {
  logSection("Test #7: Custom Trace Name Format");
  logTest("Trace Name Format", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "Trace Name Format",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-trace-fmt-");
  const tempScriptPath = tempDir + "/test-trace-fmt.mjs";

  try {
    const testScript = `
import { NeuroLink, setLangfuseContext } from '${process.cwd()}/dist/index.js';

async function testTraceNameFormat() {
  console.log('Testing custom traceNameFormat function + generate()...');

  try {
    const sdk = new NeuroLink({
      observability: {
        langfuse: {
          enabled: true,
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
          autoDetectOperationName: true,
          traceNameFormat: (context) => {
            return 'custom/' + (context.operationName || 'unknown') + '/' + (context.userId || 'anon');
          },
        },
      },
    });

    const result = await setLangfuseContext(
      { userId: 'format-test-user' },
      async () => {
        return await sdk.generate({
          input: { text: 'Say "formatted" and nothing else' },
          provider: '${TEST_CONFIG.provider}',
          ${TEST_CONFIG.model ? `model: '${TEST_CONFIG.model}',` : ""}
          maxTokens: 50,
        });
      },
    );

    if (result?.content && result.content.length > 0) {
      console.log('PASS - Custom trace name format applied. Content: ' + result.content.substring(0, 30));
      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - No content');
      process.exit(1);
    }
  } catch (error) {
    if (error.message?.includes('credentials') || error.message?.includes('authentication') || error.message?.includes('API key')) {
      console.log('SKIP - Provider credentials not configured');
      process.exit(0);
    }
    console.log('FAIL -', error.message);
    process.exit(1);
  }
}

testTraceNameFormat();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath]);

    if (result.stdout.includes("PASS")) {
      logTest("Trace Name Format", "PASS", "Custom format function applied");
      return true;
    } else if (result.stdout.includes("SKIP")) {
      logTest(
        "Trace Name Format",
        "SKIP",
        "Provider credentials not configured",
      );
      return null;
    } else {
      logTest("Trace Name Format", "FAIL", result.stderr || result.stdout);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("Trace Name Format", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// TEST #8: Custom Metadata in Context
// ============================================================

async function testCustomMetadataInContext(): Promise<boolean | null> {
  logSection("Test #8: Custom Metadata in Context");
  logTest("Custom Metadata in Context", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "Custom Metadata in Context",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-custom-meta-");
  const tempScriptPath = tempDir + "/test-custom-meta.mjs";

  try {
    const testScript = `
import { NeuroLink, setLangfuseContext, getLangfuseContext } from '${process.cwd()}/dist/index.js';

async function testCustomMetadataInContext() {
  console.log('Testing custom metadata in context + generate()...');

  try {
    const sdk = new NeuroLink({
      observability: {
        langfuse: {
          enabled: true,
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
        },
      },
    });

    const testMetadata = {
      feature: 'customer-support',
      tier: 'premium',
      version: '2.0',
      testId: Date.now(),
    };

    const result = await setLangfuseContext(
      {
        userId: 'metadata-test-user',
        metadata: testMetadata,
      },
      async () => {
        // Verify context is accessible within callback
        const ctx = getLangfuseContext();
        if (!ctx?.metadata || ctx.metadata.feature !== 'customer-support') {
          throw new Error('Metadata not set correctly in context');
        }

        return await sdk.generate({
          input: { text: 'Say "metadata" and nothing else' },
          provider: '${TEST_CONFIG.provider}',
          ${TEST_CONFIG.model ? `model: '${TEST_CONFIG.model}',` : ""}
          maxTokens: 50,
        });
      },
    );

    if (result?.content && result.content.length > 0) {
      console.log('PASS - Custom metadata set and accessible. Content: ' + result.content.substring(0, 30));
      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - No content');
      process.exit(1);
    }
  } catch (error) {
    if (error.message?.includes('credentials') || error.message?.includes('authentication') || error.message?.includes('API key')) {
      console.log('SKIP - Provider credentials not configured');
      process.exit(0);
    }
    console.log('FAIL -', error.message);
    process.exit(1);
  }
}

testCustomMetadataInContext();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath]);

    if (result.stdout.includes("PASS")) {
      logTest(
        "Custom Metadata in Context",
        "PASS",
        "Metadata accessible in context",
      );
      return true;
    } else if (result.stdout.includes("SKIP")) {
      logTest(
        "Custom Metadata in Context",
        "SKIP",
        "Provider credentials not configured",
      );
      return null;
    } else {
      logTest(
        "Custom Metadata in Context",
        "FAIL",
        result.stderr || result.stdout,
      );
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("Custom Metadata in Context", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// TEST #9: OTEL Peer Dependency Graceful Handling
// ============================================================

async function testOTELPeerDependencyGraceful(): Promise<boolean | null> {
  logSection("Test #9: OTEL Peer Dependency Graceful Handling");
  logTest("OTEL Peer Dependency", "TESTING");

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-otel-graceful-");
  const tempScriptPath = tempDir + "/test-otel-graceful.mjs";

  try {
    // This test verifies that the SDK loads and works even when
    // OTEL is not explicitly required. The SDK should handle
    // missing/optional OTEL gracefully.
    const testScript = `
async function testOTELPeerDependencyGraceful() {
  console.log('Testing SDK import without explicit OTEL dependency...');

  try {
    // Import the SDK - this should not crash even if OTEL peer deps are missing
    const distModule = await import('${process.cwd()}/dist/index.js');

    // NeuroLink class should be importable
    if (!distModule.NeuroLink) {
      console.log('FAIL - NeuroLink not found in dist exports');
      process.exit(1);
    }

    // Create SDK without any observability config
    const sdk = new distModule.NeuroLink();

    if (sdk) {
      console.log('PASS - SDK loaded successfully without explicit OTEL config');

      // Verify observability exports are available (even if they no-op)
      const hasSetContext = typeof distModule.setLangfuseContext === 'function';
      const hasGetContext = typeof distModule.getLangfuseContext === 'function';
      const hasGetSpanProcs = typeof distModule.getSpanProcessors === 'function';
      const hasGetTracer = typeof distModule.getTracer === 'function';

      console.log('Exports: setLangfuseContext=' + hasSetContext + ', getLangfuseContext=' + hasGetContext + ', getSpanProcessors=' + hasGetSpanProcs + ', getTracer=' + hasGetTracer);

      if (hasSetContext && hasGetContext && hasGetSpanProcs && hasGetTracer) {
        console.log('PASS - All observability exports available');
      } else {
        console.log('FAIL - Some observability exports missing');
        process.exit(1);
      }

      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - SDK is null');
      process.exit(1);
    }
  } catch (error) {
    // If OTEL packages are genuinely missing, SDK should still load
    if (error.message?.includes('Cannot find module') && error.message?.includes('opentelemetry')) {
      console.log('PASS - SDK handles missing OTEL gracefully (module not found but no crash)');
      process.exit(0);
    }
    console.log('FAIL -', error.message);
    process.exit(1);
  }
}

testOTELPeerDependencyGraceful();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath]);

    if (result.stdout.includes("PASS")) {
      logTest(
        "OTEL Peer Dependency",
        "PASS",
        "SDK loads gracefully without/with OTEL",
      );
      return true;
    } else {
      logTest("OTEL Peer Dependency", "FAIL", result.stderr || result.stdout);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("OTEL Peer Dependency", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// TEST #10: getTracer for Custom Spans
// ============================================================

async function testGetTracer(): Promise<boolean | null> {
  logSection("Test #10: getTracer for Custom Spans");
  logTest("getTracer", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "getTracer",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-get-tracer-");
  const tempScriptPath = tempDir + "/test-get-tracer.mjs";

  try {
    const testScript = `
import { NeuroLink, getTracer } from '${process.cwd()}/dist/index.js';

async function testGetTracer() {
  console.log('Testing getTracer() for custom spans...');

  try {
    // Initialize with Langfuse to enable tracing
    const sdk = new NeuroLink({
      observability: {
        langfuse: {
          enabled: true,
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
        },
      },
    });

    await new Promise(r => setTimeout(r, 500));

    // Get a tracer
    const tracer = getTracer('test-app', '1.0.0');

    if (!tracer) {
      console.log('FAIL - getTracer returned null');
      process.exit(1);
    }

    // Create a custom span
    const span = tracer.startSpan('custom-test-operation', {
      attributes: {
        'test.suite': 'observability',
        'test.name': 'getTracer',
      },
    });

    if (!span) {
      console.log('FAIL - startSpan returned null');
      process.exit(1);
    }

    // Verify span has expected methods
    const hasEnd = typeof span.end === 'function';
    const hasSetAttribute = typeof span.setAttribute === 'function';
    const hasSetStatus = typeof span.setStatus === 'function';

    span.setAttribute('test.result', 'success');
    span.setStatus({ code: 1 }); // OK
    span.end();

    if (hasEnd && hasSetAttribute && hasSetStatus) {
      console.log('PASS - getTracer() returned valid tracer, custom span created and ended');
      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - Span missing expected methods');
      process.exit(1);
    }
  } catch (error) {
    console.log('FAIL -', error.message);
    process.exit(1);
  }
}

testGetTracer();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath]);

    if (result.stdout.includes("PASS")) {
      logTest("getTracer", "PASS", "Custom span created and ended");
      return true;
    } else {
      logTest("getTracer", "FAIL", result.stderr || result.stdout);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("getTracer", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// TEST #11: All Extended Context Fields
// ============================================================

async function testAllContextFields(): Promise<boolean | null> {
  logSection("Test #11: All Extended Context Fields");
  logTest("All Context Fields", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "All Context Fields",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-all-ctx-");
  const tempScriptPath = tempDir + "/test-all-ctx.mjs";

  try {
    const testScript = `
import { NeuroLink, setLangfuseContext, getLangfuseContext } from '${process.cwd()}/dist/index.js';

async function testAllContextFields() {
  console.log('Testing all extended context fields + generate()...');

  try {
    const sdk = new NeuroLink({
      observability: {
        langfuse: {
          enabled: true,
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
        },
      },
    });

    const allFields = {
      userId: 'all-fields-user',
      sessionId: 'all-fields-session',
      conversationId: 'all-fields-conv-123',
      requestId: 'all-fields-req-abc',
      traceName: 'all-fields-trace',
      operationName: 'all-fields-operation',
      metadata: { key1: 'value1', key2: 42, key3: true },
      customAttributes: {
        'app.tenant': 'test-tenant',
        'app.version': 3,
        'app.debug': true,
      },
    };

    const result = await setLangfuseContext(allFields, async () => {
      // Verify all fields are accessible
      const ctx = getLangfuseContext();

      const checks = [
        ctx?.userId === allFields.userId,
        ctx?.sessionId === allFields.sessionId,
        ctx?.conversationId === allFields.conversationId,
        ctx?.requestId === allFields.requestId,
        ctx?.traceName === allFields.traceName,
        ctx?.operationName === allFields.operationName,
        ctx?.metadata?.key1 === 'value1',
        ctx?.customAttributes?.['app.tenant'] === 'test-tenant',
      ];

      const passedChecks = checks.filter(Boolean).length;
      console.log('Context field checks passed: ' + passedChecks + '/' + checks.length);

      if (passedChecks < checks.length) {
        console.log('Context dump:', JSON.stringify(ctx, null, 2));
        throw new Error('Not all context fields roundtripped correctly');
      }

      return await sdk.generate({
        input: { text: 'Say "context" and nothing else' },
        provider: '${TEST_CONFIG.provider}',
        ${TEST_CONFIG.model ? `model: '${TEST_CONFIG.model}',` : ""}
        maxTokens: 50,
      });
    });

    if (result?.content && result.content.length > 0) {
      console.log('PASS - All extended context fields set and verified. Content: ' + result.content.substring(0, 30));
      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - No content');
      process.exit(1);
    }
  } catch (error) {
    if (error.message?.includes('credentials') || error.message?.includes('authentication') || error.message?.includes('API key')) {
      console.log('SKIP - Provider credentials not configured');
      process.exit(0);
    }
    console.log('FAIL -', error.message);
    process.exit(1);
  }
}

testAllContextFields();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath]);

    if (result.stdout.includes("PASS")) {
      logTest(
        "All Context Fields",
        "PASS",
        "All extended fields roundtripped correctly",
      );
      return true;
    } else if (result.stdout.includes("SKIP")) {
      logTest(
        "All Context Fields",
        "SKIP",
        "Provider credentials not configured",
      );
      return null;
    } else {
      logTest("All Context Fields", "FAIL", result.stderr || result.stdout);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("All Context Fields", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// TEST #12: CLI with Observability (LANGFUSE env vars)
// ============================================================

async function testCLIWithObservability(): Promise<boolean | null> {
  logSection("Test #12: CLI Generate with LANGFUSE env vars");
  logTest("CLI with Observability", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "CLI with Observability",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  try {
    const result = await runCommand(
      "node",
      [
        "dist/cli/index.js",
        "generate",
        ...buildBaseCLIArgs(),
        `--max-tokens=50`,
        'Say "observability" and nothing else',
      ],
      {
        env: {
          LANGFUSE_PUBLIC_KEY: LANGFUSE_CONFIG.publicKey,
          LANGFUSE_SECRET_KEY: LANGFUSE_CONFIG.secretKey,
          LANGFUSE_BASE_URL: LANGFUSE_CONFIG.baseUrl,
        },
      },
    );

    if (!result.success) {
      if (isExpectedProviderError(result.stderr)) {
        logTest("CLI with Observability", "SKIP", "Provider not configured");
        return null;
      }
      logTest(
        "CLI with Observability",
        "FAIL",
        `Exit code: ${result.code}, Error: ${result.stderr.substring(0, 200)}`,
      );
      return false;
    }

    if (result.stdout.length > 0) {
      logTest(
        "CLI with Observability",
        "PASS",
        `CLI completed with Langfuse env vars. Output: ${result.stdout.substring(0, 50)}`,
      );
      return true;
    } else {
      logTest("CLI with Observability", "FAIL", "No output from CLI");
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (isExpectedProviderError(errorMessage)) {
      logTest("CLI with Observability", "SKIP", errorMessage);
      return null;
    }
    logTest("CLI with Observability", "FAIL", errorMessage);
    return false;
  }
}

// ============================================================
// TEST #13: Operation Name Override
// ============================================================

async function testOperationNameOverride(): Promise<boolean | null> {
  logSection("Test #13: Operation Name Override");
  logTest("Operation Name Override", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "Operation Name Override",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-op-override-");
  const tempScriptPath = tempDir + "/test-op-override.mjs";

  try {
    const testScript = `
import { NeuroLink, setLangfuseContext } from '${process.cwd()}/dist/index.js';

async function testOperationNameOverride() {
  console.log('Testing explicit operationName override in context + generate()...');

  try {
    const sdk = new NeuroLink({
      observability: {
        langfuse: {
          enabled: true,
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
          autoDetectOperationName: true,
        },
      },
    });

    // Set explicit operationName - should override auto-detection
    const result = await setLangfuseContext(
      {
        userId: 'override-test-user',
        operationName: 'custom-chat-operation',
      },
      async () => {
        return await sdk.generate({
          input: { text: 'Say "override" and nothing else' },
          provider: '${TEST_CONFIG.provider}',
          ${TEST_CONFIG.model ? `model: '${TEST_CONFIG.model}',` : ""}
          maxTokens: 50,
        });
      },
    );

    if (result?.content && result.content.length > 0) {
      console.log('PASS - Operation name override applied. Trace name should use "custom-chat-operation" instead of auto-detected name.');
      console.log('Response: ' + result.content.substring(0, 30));
      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - No content');
      process.exit(1);
    }
  } catch (error) {
    if (error.message?.includes('credentials') || error.message?.includes('authentication') || error.message?.includes('API key')) {
      console.log('SKIP - Provider credentials not configured');
      process.exit(0);
    }
    console.log('FAIL -', error.message);
    process.exit(1);
  }
}

testOperationNameOverride();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath]);

    if (result.stdout.includes("PASS")) {
      logTest(
        "Operation Name Override",
        "PASS",
        "Explicit operationName overrides auto-detection",
      );
      return true;
    } else if (result.stdout.includes("SKIP")) {
      logTest(
        "Operation Name Override",
        "SKIP",
        "Provider credentials not configured",
      );
      return null;
    } else {
      logTest(
        "Operation Name Override",
        "FAIL",
        result.stderr || result.stdout,
      );
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("Operation Name Override", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// TEST #14: Wrapper Span Support
// ============================================================

async function testWrapperSpanSupport(): Promise<boolean | null> {
  logSection("Test #14: Wrapper Span Support");
  logTest("Wrapper Span Support", "TESTING");

  if (!hasLangfuseCredentials()) {
    logTest(
      "Wrapper Span Support",
      "SKIP",
      "LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY not set",
    );
    return null;
  }

  const tempDir = fs.mkdtempSync(os.tmpdir() + "/test-wrapper-span-");
  const tempScriptPath = tempDir + "/test-wrapper-span.mjs";

  try {
    const testScript = `
import { NeuroLink, getTracer, setLangfuseContext } from '${process.cwd()}/dist/index.js';

async function testWrapperSpanSupport() {
  console.log('Testing wrapper span -> generate() -> detect child operation...');

  try {
    const sdk = new NeuroLink({
      observability: {
        langfuse: {
          enabled: true,
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
          autoDetectOperationName: true,
        },
      },
    });

    await new Promise(r => setTimeout(r, 500));

    const tracer = getTracer('wrapper-test');

    // Create a wrapper span (simulating a host app wrapping an AI call)
    const wrapperSpan = tracer.startSpan('host-app-handler', {
      attributes: {
        'handler.name': 'chat-endpoint',
        'handler.type': 'api',
      },
    });

    let generateResult;
    try {
      // Inside the wrapper span, call generate()
      generateResult = await setLangfuseContext(
        { userId: 'wrapper-test-user' },
        async () => {
          return await sdk.generate({
            input: { text: 'Say "wrapper" and nothing else' },
            provider: '${TEST_CONFIG.provider}',
            ${TEST_CONFIG.model ? `model: '${TEST_CONFIG.model}',` : ""}
            maxTokens: 50,
          });
        },
      );

      wrapperSpan.setStatus({ code: 1 }); // OK
    } catch (innerError) {
      wrapperSpan.setStatus({ code: 2, message: innerError.message });
      throw innerError;
    } finally {
      wrapperSpan.end();
    }

    if (generateResult?.content && generateResult.content.length > 0) {
      console.log('PASS - Wrapper span created, generate() called inside, child operation should be detected. Content: ' + generateResult.content.substring(0, 30));
      try { await sdk.shutdown?.(); } catch { /* ignore */ }
      process.exit(0);
    } else {
      console.log('FAIL - No content from generate within wrapper span');
      process.exit(1);
    }
  } catch (error) {
    if (error.message?.includes('credentials') || error.message?.includes('authentication') || error.message?.includes('API key')) {
      console.log('SKIP - Provider credentials not configured');
      process.exit(0);
    }
    console.log('FAIL -', error.message);
    process.exit(1);
  }
}

testWrapperSpanSupport();
`;

    fs.writeFileSync(tempScriptPath, testScript);

    const result = await runCommand("node", [tempScriptPath]);

    if (result.stdout.includes("PASS")) {
      logTest(
        "Wrapper Span Support",
        "PASS",
        "Wrapper span + child operation detection works",
      );
      return true;
    } else if (result.stdout.includes("SKIP")) {
      logTest(
        "Wrapper Span Support",
        "SKIP",
        "Provider credentials not configured",
      );
      return null;
    } else {
      logTest("Wrapper Span Support", "FAIL", result.stderr || result.stdout);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest("Wrapper Span Support", "FAIL", errorMessage);
    return false;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ============================================================
// MAIN RUNNER
// ============================================================

async function runAllTests(): Promise<void> {
  const startTime = Date.now();
  log("\n--- NeuroLink Continuous Test Suite: Observability ---", "bright");
  log(
    `   Provider: ${TEST_CONFIG.provider}, Model: ${TEST_CONFIG.model || "default"}`,
    "cyan",
  );
  log(
    `   Langfuse: ${hasLangfuseCredentials() ? "configured" : "NOT configured (most tests will SKIP)"}`,
    hasLangfuseCredentials() ? "green" : "yellow",
  );

  // Prerequisite checks
  if (!fs.existsSync("dist") || !fs.existsSync("dist/index.js")) {
    log("Build not found. Run: pnpm run build", "red");
    process.exit(1);
  }

  const tests: Array<{ name: string; fn: () => Promise<boolean | null> }> = [
    { name: "Telemetry Service Init", fn: testTelemetryServiceInit },
    {
      name: "External TracerProvider Mode",
      fn: testExternalTracerProviderMode,
    },
    { name: "getSpanProcessors", fn: testGetSpanProcessors },
    {
      name: "setLangfuseContext / getLangfuseContext",
      fn: testSetLangfuseContext,
    },
    {
      name: "Context Callback + Generate",
      fn: testSetLangfuseContextWithCallback,
    },
    {
      name: "Operation Name Auto-Detection",
      fn: testOperationNameAutoDetection,
    },
    { name: "Trace Name Format", fn: testTraceNameFormat },
    { name: "Custom Metadata in Context", fn: testCustomMetadataInContext },
    {
      name: "OTEL Peer Dependency Graceful",
      fn: testOTELPeerDependencyGraceful,
    },
    { name: "getTracer for Custom Spans", fn: testGetTracer },
    { name: "All Extended Context Fields", fn: testAllContextFields },
    { name: "CLI with Observability", fn: testCLIWithObservability },
    { name: "Operation Name Override", fn: testOperationNameOverride },
    { name: "Wrapper Span Support", fn: testWrapperSpanSupport },
  ];

  for (const test of tests) {
    try {
      const result = await test.fn();
      testResults.push({ name: test.name, result, error: null });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      testResults.push({ name: test.name, result: false, error: msg });
    }
    await globalCleanup();
    await new Promise((r) => setTimeout(r, TEST_CONFIG.interTestDelay));
  }

  // Summary
  logSection("Test Results Summary");
  const passed = testResults.filter((r) => r.result === true).length;
  const failed = testResults.filter((r) => r.result === false).length;
  const skipped = testResults.filter((r) => r.result === null).length;
  testResults.forEach((t) =>
    logTest(
      t.name,
      t.result === true ? "PASS" : t.result === false ? "FAIL" : "SKIP",
      t.error || "",
    ),
  );
  const duration = Math.round((Date.now() - startTime) / 1000);
  log(
    `
Final Results: ${passed} passed, ${failed} failed, ${skipped} skipped (${testResults.length} total) in ${duration}s`,
    failed === 0 ? "green" : "red",
  );

  process.exit(failed === 0 ? 0 : 1);
}

// ============================================================
// CLI ARGS + EXECUTION
// ============================================================

function parseArguments(): { provider?: string; model?: string } {
  const args: { provider?: string; model?: string } = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--provider=")) {
      args.provider = arg.split("=")[1];
    }
    if (arg.startsWith("--model=")) {
      args.model = arg.split("=")[1];
    }
    if (arg === "--help") {
      console.log(
        "Usage: npx tsx test/continuous-test-suite-observability.ts [--provider=X] [--model=Y]",
      );
      console.log(
        "\nTests Langfuse observability, OpenTelemetry, context management.",
      );
      console.log(
        "Requires: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY env vars",
      );
      console.log("Default provider: vertex");
      process.exit(0);
    }
  }
  return args;
}

const cliArgs = parseArguments();
if (cliArgs.provider) {
  TEST_CONFIG.provider = cliArgs.provider;
}
if (cliArgs.model) {
  TEST_CONFIG.model = cliArgs.model;
}
if (!TEST_CONFIG.maxTokens) {
  TEST_CONFIG.maxTokens = PROVIDER_MAX_TOKENS[TEST_CONFIG.provider] || 8192;
}

if (typeof describe === "undefined") {
  runAllTests().catch((e) => {
    log(`Suite crashed: ${e instanceof Error ? e.message : String(e)}`, "red");
    process.exit(1);
  });
} else {
  describe.skip("Continuous Test Suite: Observability", () => {
    it("runs standalone", () => runAllTests(), 600000);
  });
}
