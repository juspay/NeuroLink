import { parentPort } from "node:worker_threads";
import { performance } from "node:perf_hooks";
import type { ProxyBodyCaptureEntry } from "../types/index.js";
import { processProxyBodyCapture } from "./bodyCaptureProcessing.js";

// Sequential processing bounds serialization/compression memory. The parent
// bounds both the queued record count and clone bytes, including in-flight work.
let tail = Promise.resolve();
parentPort?.on(
  "message",
  (message: {
    id: number;
    entry: ProxyBodyCaptureEntry;
    logDir: string;
    queuedAt: number;
  }) => {
    tail = tail.then(async () => {
      const started = performance.now();
      const queueWaitMs = Math.max(0, Date.now() - message.queuedAt);
      try {
        const result = await processProxyBodyCapture(
          message.entry,
          message.logDir,
        );
        parentPort?.postMessage({
          id: message.id,
          result: {
            ...result,
            queueWaitMs,
            processingMs: performance.now() - started,
          },
        });
      } catch {
        parentPort?.postMessage({
          id: message.id,
          result: {
            error: "body_capture_processing_failed",
            stored: { bodyWriteFailed: true },
            queueWaitMs,
            processingMs: performance.now() - started,
          },
        });
      }
    });
  },
);
