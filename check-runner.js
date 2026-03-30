import http from "node:http";
import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import crypto from "node:crypto";
import { promisify } from "node:util";
import path from "node:path";
import { pullSnapshot } from "./pullSnapshot.js";
import { resolveDiffId, pullDiff } from "./snapshotStorage.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.CHECK_RUNNER_JWT_SECRET || "";
const JOB_TTL_MS = Number(process.env.CHECK_RUNNER_JOB_TTL_MS || 3_600_000);
const CLEANUP_INTERVAL_MS = Number(process.env.CHECK_RUNNER_JOB_CLEANUP_INTERVAL_MS || 60_000);
const MAX_JOBS = Number(process.env.CHECK_RUNNER_MAX_JOBS || 500);
const DEFAULT_TIMEOUT_MS = Number(process.env.CHECK_RUNNER_COMMAND_TIMEOUT_MS || 600_000);
const MAX_BODY_BYTES = 1 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 100 * 1024;

// Env vars that commands are allowed to see.
// JWT secret and cloud credentials never reach subprocesses.
// NODE_OPTIONS is forced to cap memory — lighthouse scripts request 8GB but the pod only has 4GB.
const COMMAND_ENV = {
  ...Object.fromEntries(
    [
      "PATH", "HOME", "USER", "SHELL", "LANG", "TERM", "TMPDIR",
      "NODE_VERSION", "HOSTNAME", "npm_config_cache", "PNPM_HOME", "COREPACK_HOME",
      "PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH", "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD",
    ]
      .filter((k) => process.env[k] !== undefined)
      .map((k) => [k, process.env[k]]),
  ),
  NODE_OPTIONS: `--max-old-space-size=${process.env.CHECK_RUNNER_NODE_MAX_MEM_MB || "2048"}`,
};

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------
const E = {
  UNAUTHORIZED:    "UNAUTHORIZED",
  BAD_REQUEST:     "BAD_REQUEST",
  BAD_JSON:        "BAD_JSON",
  PULL_FAILED:     "PULL_FAILED",
  OVERLAY_FAILED:  "OVERLAY_FAILED",
  INSTALL_FAILED:  "INSTALL_FAILED",
  COMMAND_FAILED:  "COMMAND_FAILED",
  COMMAND_TIMEOUT: "COMMAND_TIMEOUT",
  INTERNAL:        "INTERNAL",
};

// ---------------------------------------------------------------------------
// Job store
// ---------------------------------------------------------------------------
/** @type {Map<string, Record<string, unknown>>} */
const jobs = new Map();
/** @type {string[]} */
const queue = [];
let workerBusy = false;

// ---------------------------------------------------------------------------
// JWT Auth (HS256 — uses Node built-in crypto, no external deps)
// ---------------------------------------------------------------------------

function base64UrlDecode(str) {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/**
 * Verify a HS256 JWT. Returns the payload on success, null on any failure.
 * @param {string} token
 * @returns {{ sub?: string; iat?: number; exp?: number } | null}
 */
function verifyJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;

  try {
    const header = JSON.parse(base64UrlDecode(headerB64).toString());
    if (header.alg !== "HS256") return null;
  } catch { return null; }

  const expected = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const actual = base64UrlDecode(sigB64);
  if (expected.length !== actual.length) return null;
  if (!crypto.timingSafeEqual(expected, actual)) return null;

  let payload;
  try { payload = JSON.parse(base64UrlDecode(payloadB64).toString()); } catch { return null; }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && now > payload.exp) return null;

  return payload;
}

/** @param {http.IncomingMessage} req */
function isAuthorized(req) {
  if (!JWT_SECRET) return true;
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return false;
  return verifyJwt(token) !== null;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) { req.destroy(); reject(new Error("Request body too large")); return; }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function parseJson(raw) {
  if (!raw || raw.trim() === "") return {};
  const obj = JSON.parse(raw);
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new Error("Body must be a JSON object");
  return obj;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   repoName: string;
 *   branchRef: string;
 *   commands: string[];
 *   commandTimeoutMs: number;
 * }} JobInput
 */

/** @returns {{ ok: true; input: JobInput } | { ok: false; reason: string }} */
function validateAndNormalize(raw) {
  if ("commands" in raw && !Array.isArray(raw.commands)) {
    return { ok: false, reason: "commands must be an array" };
  }
  if (
    "commandTimeoutMs" in raw &&
    (typeof raw.commandTimeoutMs !== "number" || !Number.isFinite(raw.commandTimeoutMs) || raw.commandTimeoutMs <= 0)
  ) {
    return { ok: false, reason: "commandTimeoutMs must be a positive number" };
  }

  const str = (v) => typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;

  const repoName = str(raw.repoName);
  const branchRef = str(raw.branchRef);

  const commands = Array.isArray(raw.commands)
    ? raw.commands.filter((c) => typeof c === "string" && c.trim()).map((c) => c.trim())
    : [];

  const commandTimeoutMs =
    typeof raw.commandTimeoutMs === "number" && Number.isFinite(raw.commandTimeoutMs) && raw.commandTimeoutMs > 0
      ? Math.floor(raw.commandTimeoutMs)
      : DEFAULT_TIMEOUT_MS;

  if (!repoName) return { ok: false, reason: "repoName is required" };
  if (!branchRef) return { ok: false, reason: "branchRef is required" };
  if (commands.length === 0) return { ok: false, reason: "commands must be a non-empty array" };

  return { ok: true, input: { repoName, branchRef, commands, commandTimeoutMs } };
}

// ---------------------------------------------------------------------------
// Diff overlay — extract diff tarball over beta snapshot
// ---------------------------------------------------------------------------

/**
 * Apply a diff overlay onto the beta snapshot working directory.
 * The diff tarball contains changed/added files and optionally a
 * `.neurolink-deleted` manifest listing files removed in the branch.
 *
 * @param {string} workDir  - extracted beta snapshot path
 * @param {string} diffPath - path to the extracted diff tarball directory
 * @returns {Promise<{ lockfileChanged: boolean }>}
 */
async function applyDiffOverlay(workDir, diffPath) {
  const deletedManifest = path.join(diffPath, ".neurolink-deleted");
  let lockfileChanged = false;

  // Delete files listed in the manifest (if present).
  try {
    const content = await fs.readFile(deletedManifest, "utf8");
    const deleted = content.split("\n").map((f) => f.trim()).filter(Boolean);
    for (const f of deleted) {
      await fs.rm(path.join(workDir, f), { force: true });
    }
    // Remove the manifest so it doesn't end up in the working tree.
    await fs.rm(deletedManifest, { force: true });
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
    // No manifest — no deletions.
  }

  // Copy all diff files over the snapshot.
  await copyDir(diffPath, workDir);

  // Check if lockfile was part of the diff.
  try {
    await fs.access(path.join(diffPath, "pnpm-lock.yaml"));
    lockfileChanged = true;
  } catch { /* not in diff */ }

  return { lockfileChanged };
}

/**
 * Recursively copy src directory contents into dest, overwriting existing files.
 * Unlinks destination before copying to break hardlinks (protects cache base).
 */
async function copyDir(src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyDir(srcPath, destPath);
    } else {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      try { await fs.unlink(destPath); } catch { /* may not exist */ }
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// ---------------------------------------------------------------------------
// pnpm install (only when lockfile changed)
// ---------------------------------------------------------------------------

async function runPnpmInstall(workDir, timeoutMs) {
  return new Promise((resolve, reject) => {
    exec(
      "pnpm install --frozen-lockfile",
      {
        cwd: workDir,
        timeout: timeoutMs,
        killSignal: "SIGKILL",
        maxBuffer: 10 * 1024 * 1024,
        env: { ...COMMAND_ENV, NODE_ENV: "test", CI: "true" },
      },
      (error, stdout, stderr) => {
        if (error) reject(Object.assign(error, { stdout, stderr }));
        else resolve({ stdout, stderr });
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Command execution
// ---------------------------------------------------------------------------

function truncate(str, limit = MAX_OUTPUT_BYTES) {
  if (typeof str !== "string") return "";
  if (Buffer.byteLength(str) <= limit) return str;
  return Buffer.from(str).subarray(0, limit).toString("utf8") + "\n…[truncated]";
}

/** Run commands sequentially. Stops on first failure. */
async function runCommands(workDir, commands, timeoutMs) {
  const results = [];
  for (const command of commands) {
    const start = Date.now();
    const result = await new Promise((resolve) => {
      exec(
        command,
        {
          cwd: workDir,
          timeout: timeoutMs,
          killSignal: "SIGKILL",
          maxBuffer: 10 * 1024 * 1024,
          env: { ...COMMAND_ENV, NODE_ENV: "test", CI: "true" },
        },
        (error, stdout, stderr) => {
          const durationMs = Date.now() - start;
          const timedOut = !!(error && error.killed);
          resolve({
            command,
            success: !error,
            exitCode: error && typeof error.code === "number" ? error.code : 0,
            durationMs,
            stdout: truncate(stdout),
            stderr: truncate(stderr),
            timedOut,
          });
        },
      );
    });
    results.push(result);
    if (!result.success) break;
  }
  return results;
}

// ---------------------------------------------------------------------------
// Job lifecycle
// ---------------------------------------------------------------------------

function stamp(job, patch) {
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
}

function toResponse(job) {
  return {
    jobId:          job.jobId,
    status:         job.status,
    stage:          job.stage,
    createdAt:      job.createdAt,
    updatedAt:      job.updatedAt,
    snapshotId:     job.snapshotId ?? null,
    commandResults: job.commandResults ?? [],
    error:          job.error ?? null,
  };
}

async function executeJob(job) {
  const { repoName, branchRef, commands, commandTimeoutMs } = /** @type {JobInput} */ (job.input);
  let workDir = "";
  let diffDir = "";
  let snapshotId = undefined;

  try {
    // --- 1. Pull beta snapshot from GCS ---
    stamp(job, { status: "running", stage: "pull" });
    console.log(`[JOB ${job.jobId}] starting | repo: ${repoName} | branch: ${branchRef} | commands: ${commands.length}`);

    try {
      ({ workDir, snapshotId } = await pullSnapshot(repoName));
      console.log(`[JOB ${job.jobId}] pull complete: ${snapshotId} -> ${workDir}`);
    } catch (err) {
      stamp(job, { status: "failed", stage: "pull", error: { code: E.PULL_FAILED, message: errMsg(err) } });
      return;
    }
    stamp(job, { snapshotId: snapshotId ?? null });

    // --- 2. Pull diff overlay from GCS and apply ---
    stamp(job, { stage: "overlay" });
    console.log(`[JOB ${job.jobId}] pulling diff overlay for branch: ${branchRef}`);

    try {
      const diffId = await resolveDiffId({ repoName, branchRef });
      console.log(`[JOB ${job.jobId}] resolved diff: ${diffId}. pulling...`);
      diffDir = await pullDiff(diffId);
      await applyDiffOverlay(workDir, diffDir);
      console.log(`[JOB ${job.jobId}] overlay applied`);
    } catch (err) {
      stamp(job, { status: "failed", stage: "overlay", error: { code: E.OVERLAY_FAILED, message: errMsg(err) } });
      return;
    }

    // --- 3. Install dependencies ---
    stamp(job, { stage: "install" });
    console.log(`[JOB ${job.jobId}] running pnpm install`);
    try {
      await runPnpmInstall(workDir, commandTimeoutMs);
      console.log(`[JOB ${job.jobId}] install complete`);
    } catch (err) {
      stamp(job, { status: "failed", stage: "install", error: { code: E.INSTALL_FAILED, message: errMsg(err) } });
      return;
    }

    // --- 4. Run commands ---
    stamp(job, { stage: "command" });
    console.log(`[JOB ${job.jobId}] running ${commands.length} command(s)`);
    const results = await runCommands(workDir, commands, commandTimeoutMs);
    stamp(job, { commandResults: results });

    const failed = results.find((r) => !r.success);
    if (failed) {
      const code = failed.timedOut ? E.COMMAND_TIMEOUT : E.COMMAND_FAILED;
      const message = failed.timedOut
        ? `Timed out after ${commandTimeoutMs}ms: ${failed.command}`
        : `Command failed: ${failed.command}`;
      stamp(job, { status: "failed", stage: "command", error: { code, message } });
      return;
    }

    console.log(`[JOB ${job.jobId}] completed`);
    stamp(job, { status: "completed", stage: "done" });

  } catch (err) {
    stamp(job, { status: "failed", stage: "internal", error: { code: E.INTERNAL, message: errMsg(err) } });
  } finally {
    if (workDir) {
      try { await fs.rm(workDir, { recursive: true, force: true }); } catch { /* best effort */ }
    }
    if (diffDir) {
      try { await fs.rm(diffDir, { recursive: true, force: true }); } catch { /* best effort */ }
    }
  }
}

function errMsg(err) {
  return err instanceof Error ? err.message : "Unknown error";
}

// ---------------------------------------------------------------------------
// Queue worker
// ---------------------------------------------------------------------------

async function drainQueue() {
  if (workerBusy) return;
  workerBusy = true;
  while (queue.length > 0) {
    const id = queue.shift();
    const job = id && jobs.get(id);
    if (job) await executeJob(job);
  }
  workerBusy = false;
}

// ---------------------------------------------------------------------------
// Job cleanup
// ---------------------------------------------------------------------------

function cleanup() {
  const now = Date.now();
  const stale = [];

  for (const [id, job] of jobs) {
    if (job.status !== "completed" && job.status !== "failed") continue;
    const t = Date.parse(String(job.updatedAt || job.createdAt));
    if (!Number.isNaN(t) && now - t > JOB_TTL_MS) {
      jobs.delete(id);
    } else {
      stale.push([id, t]);
    }
  }

  if (jobs.size > MAX_JOBS) {
    stale.sort((a, b) => a[1] - b[1]);
    while (jobs.size > MAX_JOBS && stale.length > 0) jobs.delete(stale.shift()[0]);
  }
}

const cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const JOB_ID_RE = /^\/run-checks\/([^/]+)$/;

const server = http.createServer(async (req, res) => {
  if (!isAuthorized(req)) {
    return json(res, 401, { code: E.UNAUTHORIZED, error: "Invalid or missing credentials" });
  }

  // --- poll job ---
  if (req.method === "GET") {
    const m = req.url && JOB_ID_RE.exec(req.url);
    if (!m) { res.writeHead(404); return res.end("Not found"); }
    const jobId = decodeURIComponent(m[1]);
    const job = jobs.get(jobId);
    if (!job) {
      console.log(`[GET] 404 — job not found: ${jobId}`);
      return json(res, 404, { error: "Job not found" });
    }
    console.log(`[GET] 200 — job: ${jobId} | status: ${job.status} | stage: ${job.stage}`);
    return json(res, 200, toResponse(job));
  }

  // --- submit job ---
  if (req.method !== "POST" || req.url !== "/run-checks") {
    res.writeHead(404); return res.end("Not found");
  }

  let body;
  try { body = await readBody(req); } catch {
    return json(res, 400, { error: "Invalid or oversized body" });
  }

  let parsed;
  try { parsed = parseJson(body); } catch (err) {
    return json(res, 400, { code: E.BAD_JSON, error: errMsg(err) });
  }

  const v = validateAndNormalize(parsed);
  if (!v.ok) return json(res, 400, { code: E.BAD_REQUEST, error: v.reason });

  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();
  const job = { jobId, status: "queued", stage: "queued", createdAt: now, updatedAt: now, input: v.input, commandResults: [] };

  jobs.set(jobId, job);
  queue.push(jobId);
  console.log(`[POST] 202 -> queued job: ${jobId} | branch: ${v.input.branchRef} | repo: ${v.input.repoName}`);
  void drainQueue();

  return json(res, 202, { jobId, status: "queued" });
});

server.listen(PORT, () => {
  console.log(`check-runner listening on :${PORT}`);
});
