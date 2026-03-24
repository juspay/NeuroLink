/**
 * Proxy Request Logger
 * Logs proxy request/response metadata to a rotating log file.
 * Useful for debugging and auditing proxy traffic.
 */

import { join } from "path";
import { homedir } from "os";
import { logger } from "../utils/logger.js";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "fs";
import { appendFile } from "fs/promises";
import type { RequestLogEntry } from "../types/index.js";

let logDir: string | null = null;
let logEnabled = false;

/** Maximum body size to log (bytes). Larger bodies are truncated. */
const MAX_BODY_LOG_SIZE = 32_768; // 32 KB

/** Headers whose values must always be redacted. */
const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "proxy-authorization",
  "x-api-key",
  "cookie",
  "set-cookie",
]);

/** Pattern that matches header names likely to contain secrets. */
const SENSITIVE_HEADER_PATTERN = /token|secret|key|password|credential/i;

/** JSON keys whose values should be redacted in request/response bodies. */
const SENSITIVE_BODY_KEYS =
  /("(?:password|access_token|refresh_token|api_key|apiKey|secret|authorization|token|credential|x-api-key)"\s*:\s*)"(?:[^"\\]|\\.)*"/gi;

export function initRequestLogger(enabled: boolean = true): void {
  logEnabled = enabled;
  if (!enabled) {
    return;
  }

  try {
    logDir = join(homedir(), ".neurolink", "logs");
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true, mode: 0o700 });
    }
    chmodSync(logDir, 0o700);
  } catch (err) {
    logEnabled = false;
    logDir = null;
    logger.warn(
      `[proxy] Request logging disabled — failed to create log directory: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function logRequest(entry: RequestLogEntry): Promise<void> {
  if (!logEnabled || !logDir) {
    return;
  }

  const logFile = join(
    logDir,
    `proxy-${new Date().toISOString().split("T")[0]}.jsonl`,
  );
  const line = JSON.stringify(entry) + "\n";

  try {
    await appendFile(logFile, line, { mode: 0o600 });
  } catch {
    // Non-fatal — don't crash proxy for logging failures
  }
}

export function getLogDir(): string | null {
  return logDir;
}

/**
 * Redact sensitive header values in-place.
 */
function redactHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!headers) {
    return headers;
  }
  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (
      SENSITIVE_HEADER_NAMES.has(lower) ||
      SENSITIVE_HEADER_PATTERN.test(lower)
    ) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Redact sensitive keys from a JSON body string and truncate if too large.
 */
function redactBody(body: unknown): unknown {
  if (body === undefined || body === null) {
    return body;
  }
  let str = typeof body === "string" ? body : JSON.stringify(body);
  // Redact known sensitive JSON keys BEFORE truncating so that a mid-string
  // slice cannot leave a partially exposed secret (the regex needs closing
  // quotes to match).
  str = str.replace(SENSITIVE_BODY_KEYS, '$1"[REDACTED]"');
  if (str.length > MAX_BODY_LOG_SIZE) {
    str =
      str.slice(0, MAX_BODY_LOG_SIZE) +
      `... [TRUNCATED from ${str.length} bytes]`;
  }
  return str;
}

/**
 * Log the FULL raw request and response for debugging.
 * Writes to a separate file: proxy-debug-YYYY-MM-DD.jsonl
 * Each entry has the complete request body and response body.
 *
 * Sensitive headers and body fields are redacted before writing.
 */
export async function logFullRequestResponse(entry: {
  timestamp: string;
  requestId: string;
  account: string;
  model: string;
  stream: boolean;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  requestBodySize: number;
  responseStatus: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  responseBodySize?: number;
  durationMs: number;
}): Promise<void> {
  if (!logEnabled || !logDir) {
    return;
  }

  const sanitizedEntry = {
    ...entry,
    requestHeaders: redactHeaders(entry.requestHeaders)!,
    requestBody: redactBody(entry.requestBody),
    responseHeaders: redactHeaders(entry.responseHeaders),
    responseBody: redactBody(entry.responseBody),
  };

  const logFile = join(
    logDir,
    `proxy-debug-${new Date().toISOString().split("T")[0]}.jsonl`,
  );
  const line = JSON.stringify(sanitizedEntry) + "\n";

  try {
    await appendFile(logFile, line, { mode: 0o600 });
  } catch {
    // Non-fatal
  }
}

/**
 * Log a mid-stream error that occurs after the initial 200 was sent.
 * These are invisible in normal request logs since the 200 was already recorded.
 */
export async function logStreamError(entry: {
  timestamp: string;
  requestId: string;
  account: string;
  model: string;
  errorMessage: string;
  durationMs: number;
}): Promise<void> {
  if (!logEnabled || !logDir) {
    return;
  }

  const logFile = join(
    logDir,
    `proxy-${new Date().toISOString().split("T")[0]}.jsonl`,
  );
  const logEntry = {
    ...entry,
    responseStatus: 200,
    errorType: "stream_error",
    note: "mid-stream failure after initial 200",
  };

  try {
    await appendFile(logFile, JSON.stringify(logEntry) + "\n", {
      mode: 0o600,
    });
  } catch {
    // Non-fatal — don't crash proxy for logging failures
  }
}

/**
 * Clean up old log files by age and total size.
 * - Deletes files older than maxAgeDays
 * - If remaining files exceed maxSizeMb, deletes oldest until under limit
 * Non-fatal — proxy keeps working even if cleanup fails.
 */
export function cleanupLogs(
  maxAgeDays: number = 7,
  maxSizeMb: number = 500,
): void {
  if (!logDir || !existsSync(logDir)) {
    return;
  }

  try {
    const files = readdirSync(logDir)
      .filter((f) => f.startsWith("proxy-") && f.endsWith(".jsonl"))
      .map((f) => {
        const filePath = join(logDir!, f);
        const stat = statSync(filePath);
        return {
          name: f,
          path: filePath,
          mtime: stat.mtimeMs,
          size: stat.size,
        };
      })
      .sort((a, b) => a.mtime - b.mtime); // oldest first

    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    let freedBytes = 0;

    // Pass 1: delete files older than maxAgeDays
    const remaining = [];
    for (const file of files) {
      if (file.mtime < cutoff) {
        unlinkSync(file.path);
        deletedCount++;
        freedBytes += file.size;
      } else {
        remaining.push(file);
      }
    }

    // Pass 2: if total size exceeds maxSizeMb, delete oldest until under limit
    const maxBytes = maxSizeMb * 1024 * 1024;
    let totalSize = remaining.reduce((sum, f) => sum + f.size, 0);

    while (totalSize > maxBytes && remaining.length > 0) {
      const oldest = remaining.shift()!;
      unlinkSync(oldest.path);
      totalSize -= oldest.size;
      deletedCount++;
      freedBytes += oldest.size;
    }

    if (deletedCount > 0) {
      logger.info(
        `[proxy] log cleanup: deleted ${deletedCount} file(s), freed ${(freedBytes / 1024 / 1024).toFixed(1)} MB`,
      );
    }
  } catch {
    // Non-fatal
  }
}
