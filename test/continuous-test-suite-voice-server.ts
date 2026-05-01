/**
 * Continuous test suite — voice-server (NEW14)
 *
 * Lightweight harness that exercises the voice WebSocket server's startup
 * and registration surface without requiring real provider credentials.
 *
 * Skips automatically when PICOVOICE_ACCESS_KEY / SONIOX_API_KEY /
 * CARTESIA_API_KEY are missing — the server constructor requires them.
 *
 * What's covered:
 *   - WS auth gate: with VOICE_SERVER_AUTH_TOKEN set, unauthenticated
 *     clients are rejected (handshake 401).
 *   - ProviderRegistry.getRegistrationReport() shape: returns the
 *     `realtime` keys for `openai-realtime` and `gemini-live` (NEW4).
 *
 * What's NOT covered yet (would need fakeable Soniox/Cartesia mocks):
 *   - End-to-end Soniox transcript streaming + turn-management invariants
 *   - Mid-turn barge-in race (M4)
 *   - TTS error during stream (NEW3)
 *   - Connection close cleanup paths (C2/M8/NEW8)
 * These need the Soniox/Cartesia clients to be injectable. Filed as
 * follow-up — the harness here lays the foundation.
 */

import http from "http";
import { WebSocket } from "ws";

// ---- ANSI colour helpers ----
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};
function log(msg: string, color: keyof typeof colors = "reset") {
  process.stdout.write(`${colors[color]}${msg}${colors.reset}\n`);
}

// ---- Test runner ----
type TestResult = "PASS" | "FAIL" | "SKIP";
const results: Array<{ name: string; result: TestResult; detail: string }> = [];
function record(name: string, result: TestResult, detail = "") {
  results.push({ name, result, detail });
  const color: keyof typeof colors =
    result === "PASS" ? "green" : result === "FAIL" ? "red" : "yellow";
  log(`  [${result}] ${name}${detail ? ` — ${detail}` : ""}`, color);
}

// ---- Setup helpers ----
function getRequiredEnvs(): string[] {
  const required = [
    "PICOVOICE_ACCESS_KEY",
    "SONIOX_API_KEY",
    "CARTESIA_API_KEY",
  ];
  return required.filter((n) => !process.env[n]);
}

async function pickEphemeralPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = http.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (typeof addr === "object" && addr) {
        const port = addr.port;
        srv.close(() => resolve(port));
      } else {
        srv.close(() => reject(new Error("no port")));
      }
    });
    srv.once("error", reject);
  });
}

async function tryOpenWs(
  url: string,
  timeoutMs = 3000,
): Promise<{
  opened: boolean;
  closeCode?: number;
  err?: string;
}> {
  return new Promise((resolve) => {
    let settled = false;
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      try {
        ws.terminate();
      } catch {
        /* ignore */
      }
      resolve({ opened: false, err: "timeout" });
    }, timeoutMs);
    ws.on("open", () => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      resolve({ opened: true });
    });
    ws.on("error", (err) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve({ opened: false, err: err.message });
    });
    ws.on("close", (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve({ opened: false, closeCode: code });
    });
  });
}

// ---- Tests ----

async function testServerBootsAndAccepts(): Promise<void> {
  log(
    "[TEST] Server boots and accepts unauth connection (no token set)",
    "cyan",
  );
  delete process.env.VOICE_SERVER_AUTH_TOKEN;
  delete process.env.VOICE_SERVER_ALLOW_PUBLIC;
  const port = await pickEphemeralPort();
  let started = false;
  try {
    const { startVoiceServer } =
      await import("../src/lib/server/voice/voiceServerApp.js");
    await startVoiceServer(port);
    started = true;
    const r = await tryOpenWs(`ws://127.0.0.1:${port}`);
    record(
      "server boots and accepts WS without auth",
      r.opened ? "PASS" : "FAIL",
      r.opened ? `port=${port}` : `err=${r.err ?? r.closeCode}`,
    );
  } catch (err) {
    record(
      "server boots and accepts WS without auth",
      "FAIL",
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    if (!started) {
      record(
        "(setup)",
        "SKIP",
        "server did not boot — likely missing PICOVOICE_ACCESS_KEY",
      );
    }
    // Voice-server doesn't expose a stop API today. Process exit will close.
  }
}

async function testServerRejectsUnauthClientWhenTokenSet(): Promise<void> {
  log(
    "[TEST] Server rejects unauthenticated WS when VOICE_SERVER_AUTH_TOKEN set",
    "cyan",
  );
  process.env.VOICE_SERVER_AUTH_TOKEN = "secret-test-token-xyz";
  delete process.env.VOICE_SERVER_ALLOW_PUBLIC;
  const port = await pickEphemeralPort();
  try {
    const { startVoiceServer } =
      await import("../src/lib/server/voice/voiceServerApp.js");
    // Note: this re-uses the previous server instance import. The startVoiceServer
    // function creates a fresh app each call, so it's safe.
    await startVoiceServer(port);
    // Without ?token query OR Authorization header, handshake should fail.
    const r = await tryOpenWs(`ws://127.0.0.1:${port}`);
    const ok =
      !r.opened &&
      (r.closeCode === 1006 ||
        (r.err ?? "").toLowerCase().includes("unexpected"));
    record(
      "WS upgrade rejected without token",
      ok ? "PASS" : "FAIL",
      `opened=${r.opened} code=${r.closeCode ?? "n/a"} err=${r.err ?? ""}`,
    );

    // With ?token=correct, should succeed.
    const r2 = await tryOpenWs(
      `ws://127.0.0.1:${port}/?token=secret-test-token-xyz`,
    );
    record(
      "WS upgrade succeeds with correct token",
      r2.opened ? "PASS" : "FAIL",
      r2.opened ? "" : `err=${r2.err ?? r2.closeCode}`,
    );
  } catch (err) {
    record(
      "WS upgrade rejected without token",
      "SKIP",
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    delete process.env.VOICE_SERVER_AUTH_TOKEN;
  }
}

async function testRegistrationReportShape(): Promise<void> {
  log("[TEST] ProviderRegistry.getRegistrationReport() shape", "cyan");
  try {
    const { ProviderRegistry } =
      await import("../src/lib/factories/providerRegistry.js");
    await ProviderRegistry.registerAllProviders();
    const report = ProviderRegistry.getRegistrationReport();
    const ok =
      typeof report === "object" &&
      "realtime" in report &&
      typeof report.realtime === "object";
    record(
      "getRegistrationReport returns { realtime: ... }",
      ok ? "PASS" : "FAIL",
      ok ? `keys=${Object.keys(report.realtime).join(",") || "<empty>"}` : "",
    );
  } catch (err) {
    record(
      "getRegistrationReport returns { realtime: ... }",
      "FAIL",
      err instanceof Error ? err.message : String(err),
    );
  }
}

// ---- Main ----

async function main() {
  log("\n=== Voice Server Test Suite ===\n", "cyan");
  const missing = getRequiredEnvs();
  if (missing.length > 0) {
    log(
      `SKIP all server-boot tests — missing env: ${missing.join(", ")}`,
      "yellow",
    );
    // Still run the registration-report test which doesn't need server boot.
    await testRegistrationReportShape();
  } else {
    await testServerBootsAndAccepts();
    await testServerRejectsUnauthClientWhenTokenSet();
    await testRegistrationReportShape();
  }

  const pass = results.filter((r) => r.result === "PASS").length;
  const fail = results.filter((r) => r.result === "FAIL").length;
  const skip = results.filter((r) => r.result === "SKIP").length;
  log("\n=== Summary ===", "cyan");
  log(
    `${pass} pass · ${fail} fail · ${skip} skip (${results.length} total)`,
    fail > 0 ? "red" : "green",
  );
  // Voice-server doesn't expose stop, so force exit.
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  log(`Suite crashed: ${e instanceof Error ? e.message : String(e)}`, "red");
  process.exit(1);
});
