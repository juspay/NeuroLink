import { Worker } from "node:worker_threads";
import type {
  ProcessedProxyBodyCapture,
  ProxyBodyCaptureEntry,
  ProxyBodyCaptureWorkerSnapshot,
} from "../types/index.js";

const MAX_PENDING = 16;
const MAX_PENDING_BYTES = 32 * 1024 * 1024;
const MAX_ENTRY_BYTES = 8 * 1024 * 1024;
export const PROXY_BODY_CAPTURE_DEADLINE_MS = 20_000;
let worker: Worker | undefined;
let workerUrl: URL | undefined;
let retryAfter = 0;
let nextId = 0;
const snapshot: ProxyBodyCaptureWorkerSnapshot = {
  attempted: 0,
  completed: 0,
  rejected: 0,
  failed: 0,
  pending: 0,
  pendingBytes: 0,
  maxPending: MAX_PENDING,
  maxPendingBytes: MAX_PENDING_BYTES,
};
const pending = new Map<
  number,
  {
    resolve: (result: ProcessedProxyBodyCapture) => void;
    timer: NodeJS.Timeout;
  }
>();

// Bound traversal as well as the structured clone sent to the worker. Never
// invoke getters/toJSON or stringify a large body on the serving event loop.
/**
 * Conservatively bound clone size and traversal work without invoking
 * getters or serializers.
 */
function estimateCloneBytes(value: unknown): number {
  const stack = [value];
  const seen = new Set<object>();
  let bytes = 0,
    nodes = 0;
  while (stack.length) {
    if (++nodes > 100_000 || bytes > MAX_ENTRY_BYTES) {
      return Infinity;
    }
    const item = stack.pop();
    if (typeof item === "string") {
      bytes += item.length * 3;
      continue;
    }
    bytes += 16;
    if (!item || typeof item !== "object") {
      continue;
    }
    if (seen.has(item)) {
      return Infinity;
    }
    seen.add(item);
    if (
      !Array.isArray(item) &&
      Object.getPrototypeOf(item) !== Object.prototype &&
      Object.getPrototypeOf(item) !== null
    ) {
      return Infinity;
    }
    for (const key of Object.keys(item)) {
      bytes += key.length * 3;
      const descriptor = Object.getOwnPropertyDescriptor(item, key);
      if (!descriptor || descriptor.get || descriptor.set) {
        return Infinity;
      }
      stack.push(descriptor.value);
      if (stack.length > 100_000 || bytes > MAX_ENTRY_BYTES) {
        return Infinity;
      }
    }
  }
  return bytes;
}

/**
 * Settle IPC ownership once while publication retains the capture memory
 * lease.
 */
function settle(id: number, result: ProcessedProxyBodyCapture): void {
  const task = pending.get(id);
  if (!task) {
    return;
  }
  pending.delete(id);
  clearTimeout(task.timer);
  task.resolve(result);
  if (!pending.size) {
    worker?.unref();
  }
}

/**
 * Fail every pending capture explicitly and back off without moving bulk
 * work to the caller.
 */
function failWorker(current: Worker, reason: string): void {
  if (worker !== current) {
    return;
  }
  worker = undefined;
  retryAfter = Date.now() + 5_000;
  for (const id of pending.keys()) {
    settle(id, {
      error: reason,
      stored: { bodyWriteFailed: true },
    });
  }
  void current.terminate().catch(() => undefined);
}

/**
 * Lazily create the bounded worker; only admitted processing keeps it
 * referenced.
 */
function getWorker(): Worker {
  if (worker) {
    return worker;
  }
  const current = new Worker(
    workerUrl ?? new URL("./bodyCaptureWorkerEntry.js", import.meta.url),
    {
      execArgv: process.execArgv.filter(
        (arg) => !arg.startsWith("--input-type"),
      ),
      resourceLimits: { maxOldGenerationSizeMb: 128 },
    },
  );
  worker = current;
  current.on(
    "message",
    (message: { id: number; result: ProcessedProxyBodyCapture }) => {
      if (worker === current) {
        settle(message.id, message.result);
      }
    },
  );
  current.on("error", () => failWorker(current, "body_worker_error"));
  current.on("exit", () => failWorker(current, "body_worker_exit"));
  current.unref();
  return current;
}

/** Bounded bulk capture. Failures are indexed; never fall back to blocking work. */
export async function captureProxyBody(
  entry: ProxyBodyCaptureEntry,
  logDir: string | null,
  consume: (result: ProcessedProxyBodyCapture) => Promise<void>,
): Promise<void> {
  snapshot.attempted += 1;
  let bytes: number;
  try {
    bytes = estimateCloneBytes(entry);
  } catch {
    bytes = Infinity;
  }
  if (
    bytes > MAX_ENTRY_BYTES ||
    snapshot.pending >= MAX_PENDING ||
    snapshot.pendingBytes + bytes > MAX_PENDING_BYTES ||
    Date.now() < retryAfter
  ) {
    snapshot.rejected += 1;
    const error =
      bytes > MAX_ENTRY_BYTES
        ? "body_capture_too_large_or_non_json"
        : Date.now() < retryAfter
          ? "body_worker_backoff"
          : "body_capture_queue_full";
    snapshot.lastError = error;
    return consume({ error, stored: { bodyWriteFailed: true } });
  }
  let current: Worker;
  try {
    current = getWorker();
  } catch {
    snapshot.failed += 1;
    retryAfter = Date.now() + 5_000;
    return consume({
      error: "body_worker_start_failed",
      stored: { bodyWriteFailed: true },
    });
  }
  const id = ++nextId;
  return new Promise((resolve) => {
    const timer = setTimeout(
      () => failWorker(current, "body_worker_timeout"),
      PROXY_BODY_CAPTURE_DEADLINE_MS,
    );
    timer.unref();
    pending.set(id, {
      timer,
      resolve: (result) => {
        // Keep the byte/count lease through index writes and OTLP publication,
        // so completed worker results cannot form an unbounded parent backlog.
        void consume(result)
          .catch(() => {
            result.error ??= "body_capture_publication_failed";
          })
          .finally(() => {
            snapshot.pending -= 1;
            snapshot.pendingBytes -= bytes;
            if (result.error || result.stored.bodyWriteFailed) {
              snapshot.failed += 1;
            } else {
              snapshot.completed += 1;
            }
            if (result.error) {
              snapshot.lastError = result.error;
            }
            resolve();
          });
      },
    });
    snapshot.pending += 1;
    snapshot.pendingBytes += bytes;
    current.ref();
    try {
      current.postMessage({ id, entry, logDir, queuedAt: Date.now() });
    } catch {
      settle(id, {
        error: "body_capture_clone_failed",
        stored: { bodyWriteFailed: true },
      });
    }
  });
}

/**
 * Return independent counters for processing, rejection, failure, and
 * retained publication work.
 */
export function getBodyCaptureWorkerSnapshot(): ProxyBodyCaptureWorkerSnapshot {
  return { ...snapshot };
}

/** Isolated tests point at a separately executed built worker. */
export const __bodyCaptureWorkerTestHooks = {
  /**
   * Reset an isolated worker after capture publications drain, optionally selecting a fixture entry.
   */
  async reset(url?: URL): Promise<void> {
    if (worker) {
      const current = worker;
      failWorker(current, "body_worker_test_reset");
      await current.terminate();
    }
    workerUrl = url;
    retryAfter = 0;
    Object.assign(snapshot, {
      attempted: 0,
      completed: 0,
      rejected: 0,
      failed: 0,
      pending: 0,
      pendingBytes: 0,
      lastError: undefined,
    });
  },
};
