import type { LifecycleMiddlewareConfig } from "../types/index.js";

/**
 * Default deadline applied to consumer-supplied lifecycle callbacks
 * (`onChunk`, `onFinish`, `onError`) when neither
 * `LifecycleMiddlewareConfig.timeoutMs` nor the
 * `NEUROLINK_LIFECYCLE_TIMEOUT_MS` env var is set.
 *
 * 5s is generous — far longer than legitimate sync logging, far
 * shorter than a stuck network call. Callers with slow telemetry
 * sinks should set `timeoutMs` explicitly.
 */
export const DEFAULT_LIFECYCLE_TIMEOUT_MS = 5_000;

/**
 * Resolve the deadline for a single lifecycle callback invocation.
 *
 * Order of precedence:
 *   1. `lifecycle.timeoutMs` from the per-call SDK config
 *   2. `NEUROLINK_LIFECYCLE_TIMEOUT_MS` env var (also honored by the CLI)
 *   3. `DEFAULT_LIFECYCLE_TIMEOUT_MS` (5_000)
 *
 * Negative / non-finite values fall through to the next source. `0`
 * is accepted and means "no wait" (the consumer's async work is
 * effectively fire-and-forget).
 */
export function resolveLifecycleTimeoutMs(
  lifecycle?: Pick<LifecycleMiddlewareConfig, "timeoutMs"> | null,
): number {
  if (lifecycle && typeof lifecycle.timeoutMs === "number") {
    if (Number.isFinite(lifecycle.timeoutMs) && lifecycle.timeoutMs >= 0) {
      return lifecycle.timeoutMs;
    }
  }
  const raw = process.env.NEUROLINK_LIFECYCLE_TIMEOUT_MS;
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return DEFAULT_LIFECYCLE_TIMEOUT_MS;
}
