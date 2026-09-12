/* eslint-disable no-console -- This proxy-only sink replaces console methods with OTLP emission. */
import { inspect } from "node:util";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { ExportResultCode } from "@opentelemetry/core";
import type { ExportResult } from "@opentelemetry/core";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import type {
  LogRecordExporter,
  LogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { sanitizeForLog } from "../utils/logSanitize.js";

let provider: LoggerProvider | undefined;
let restoreConsole: (() => void) | undefined;
const queues: Array<ReturnType<typeof createTrackedProcessor>> = [];

/** Explicit opt-in; configuration never silently falls back to file logging. */
export function isProxyOtelOnly(): boolean {
  return process.env.NEUROLINK_PROXY_LOG_SINK === "otel";
}

/** Reserve capacity including exports in flight, independently for metadata and bodies. */
function createTrackedProcessor(url: string, capacity: number) {
  const state = {
    attempted: 0,
    submitted: 0,
    transportAcknowledged: 0,
    exportUnconfirmed: 0,
    dropped: 0,
    outstanding: 0,
    lastAcknowledgedAt: undefined as string | undefined,
    lastFailureAt: undefined as string | undefined,
  };
  const transport = new OTLPLogExporter({ url, timeoutMillis: 5000 });
  const exporter: LogRecordExporter = {
    export(records, callback) {
      let settled = false;
      const settle = (result: ExportResult): void => {
        if (settled) {
          return;
        }
        settled = true;
        state.outstanding -= records.length;
        if (result.code === ExportResultCode.SUCCESS) {
          state.transportAcknowledged += records.length;
          state.lastAcknowledgedAt = new Date().toISOString();
        } else {
          state.exportUnconfirmed += records.length;
          state.lastFailureAt = new Date().toISOString();
        }
        callback(result);
      };
      try {
        transport.export(records, settle);
      } catch (error) {
        settle({
          code: ExportResultCode.FAILED,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    },
    shutdown: () => transport.shutdown(),
  };
  const batch = new BatchLogRecordProcessor(exporter, {
    maxQueueSize: capacity,
    maxExportBatchSize: 64,
    scheduledDelayMillis: 1000,
    exportTimeoutMillis: 6000,
  });
  const processor: LogRecordProcessor = {
    onEmit(record) {
      state.attempted++;
      if (state.outstanding >= capacity) {
        state.dropped++;
        return;
      }
      state.submitted++;
      state.outstanding++;
      batch.onEmit(record);
    },
    forceFlush: () => batch.forceFlush(),
    shutdown: () => batch.shutdown(),
  };
  return { state, processor, capacity };
}

/** Initialize a log-only provider in every proxy process, including the supervisor. */
export function initializeProxyOtelLogs(
  role = "worker",
): LoggerProvider | undefined {
  if (!isProxyOtelOnly()) {
    return undefined;
  }
  if (provider) {
    return provider;
  }
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ??
    (process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, "")}/v1/logs`
      : undefined);
  if (!endpoint) {
    throw new Error("OTel-only proxy logging requires an OTLP endpoint");
  }
  const url = new URL(endpoint);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Proxy OTLP logs endpoint must use HTTP or HTTPS");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol === "http:" && !loopback) {
    throw new Error(
      "Proxy OTLP logs require HTTPS for non-loopback collectors",
    );
  }
  const metadata = createTrackedProcessor(endpoint, 2048);
  const bodies = createTrackedProcessor(endpoint, 256);
  queues.push(metadata, bodies);
  provider = new LoggerProvider({
    resource: resourceFromAttributes({
      "service.name": process.env.OTEL_SERVICE_NAME ?? "neurolink-proxy",
      "service.instance.id": `${role}-${process.pid}`,
      "process.pid": process.pid,
      "proxy.process.role": role,
    }),
    processors: [
      {
        onEmit(record, context) {
          (record.attributes?.["proxy.record_kind"] === "body"
            ? bodies
            : metadata
          ).processor.onEmit(record, context);
        },
        forceFlush: async () => {
          await Promise.all(queues.map((q) => q.processor.forceFlush()));
        },
        shutdown: async () => {
          await Promise.all(queues.map((q) => q.processor.shutdown()));
        },
      },
    ],
  });
  return provider;
}

/** Structured evidence without final-request dashboard fields on auxiliary events. */
export function emitProxyOtelEvent(
  kind: string,
  record: Record<string, unknown>,
): void {
  if (!isProxyOtelOnly()) {
    return;
  }
  try {
    initializeProxyOtelLogs()
      ?.getLogger("neurolink-proxy-events")
      .emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: JSON.stringify(record),
        attributes: {
          "proxy.record_kind": kind,
          "event.name": `proxy.${kind}`,
          ...(typeof record.requestId === "string"
            ? { "request.id": record.requestId }
            : {}),
          ...(typeof record.event === "string"
            ? { "proxy.lifecycle.event": record.event }
            : {}),
        },
      });
  } catch {
    // Telemetry must never fail a model request. Invalid records are observable.
    invalidRecords++;
  }
}
let invalidRecords = 0;

/** Capture application console diagnostics only inside proxy service processes. */
export function routeProxyConsoleToOtel(): void {
  if (!isProxyOtelOnly() || restoreConsole) {
    return;
  }
  initializeProxyOtelLogs();
  const originals = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };
  let emitting = false;
  for (const level of Object.keys(originals) as Array<keyof typeof originals>) {
    console[level] = (...args: unknown[]) => {
      if (emitting) {
        return;
      }
      emitting = true;
      try {
        const body = args
          .map((value) =>
            typeof value === "string"
              ? value
              : inspect(value, {
                  depth: 4,
                  maxArrayLength: 30,
                  maxStringLength: 16000,
                }),
          )
          .join(" ");
        provider?.getLogger("neurolink-proxy-console").emit({
          body: sanitizeForLog(body, 32000),
          severityText: level.toUpperCase(),
          severityNumber:
            level === "error"
              ? SeverityNumber.ERROR
              : level === "warn"
                ? SeverityNumber.WARN
                : level === "debug"
                  ? SeverityNumber.DEBUG
                  : SeverityNumber.INFO,
          attributes: { "proxy.record_kind": "console" },
        });
      } catch {
        invalidRecords++;
      } finally {
        emitting = false;
      }
    };
  }
  restoreConsole = () => Object.assign(console, originals);
}

/** Counters acknowledge collector transport only, never backend persistence. */
export function getProxyOtelLogSnapshot() {
  return {
    mode: isProxyOtelOnly() ? "otel" : "file-and-otel",
    initialized: provider !== undefined,
    deliveryGuarantee:
      "best-effort; HTTP success is not per-record acceptance or backend persistence",
    invalidRecords,
    queues: queues.map((q, index) => ({
      kind: index === 0 ? "metadata" : "bodies",
      capacity: q.capacity,
      ...q.state,
    })),
  };
}

/** Bounded provider flush belongs after final request and lifecycle publication. */
export async function flushProxyOtelLogs(): Promise<void> {
  await provider?.forceFlush();
}

/** Release this process's exporter and restore console ownership. */
export async function shutdownProxyOtelLogs(): Promise<void> {
  restoreConsole?.();
  restoreConsole = undefined;
  await provider?.shutdown();
  provider = undefined;
  queues.length = 0;
  invalidRecords = 0;
}

/** Flush short-lived proxy command diagnostics on every normal return or exception. */
export function withProxyOtelLogShutdown<TArg>(
  handler: (arg: TArg) => Promise<void>,
): (arg: TArg) => Promise<void> {
  return async (arg) => {
    try {
      await handler(arg);
    } finally {
      await flushProxyOtelLogs().catch(() => undefined);
      await shutdownProxyOtelLogs().catch(() => undefined);
    }
  };
}
