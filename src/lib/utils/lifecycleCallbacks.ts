/**
 * Lifecycle callback firing + dedupe.
 *
 * The same thrown error can travel through multiple layers that each
 * want to surface it to the consumer's `onError`:
 *   - LifecycleMiddleware's `wrapGenerate` / `wrapStream` catch
 *   - `BaseProvider.wrapStreamWithLifecycleCallbacks` (raw-fetch
 *     streaming providers that bypass AI SDK middleware)
 *   - `BaseProvider.fireLifecycleErrorCallback` (top-level provider catch)
 *   - `NeuroLink.generate()` / `NeuroLink.stream()` (early-resolution
 *     failures, before the language model is wrapped)
 *
 * Without a shared dedupe these layers would fire `onError` multiple
 * times for one logical failure. This module stamps a non-enumerable
 * `Symbol.for("neurolink.onErrorFired")` on the error the first time
 * a firing site is reached; subsequent sites observe the stamp and
 * skip their own fire.
 *
 * `Symbol.for` (rather than a local Symbol) so the same key works
 * across modules — anyone who can read the symbol can read the stamp.
 *
 * Frozen / sealed / non-extensible errors: `Object.defineProperty`
 * throws, we catch and proceed. Worst case is a single duplicate fire
 * (the pre-shared-marker behaviour). `WeakSet`-based bookkeeping
 * would handle this case cleanly but the symbol stamp is preferred
 * for cross-realm consistency: a Symbol.for-keyed property survives
 * structuredClone / cross-realm postMessage where a closed-over
 * WeakSet does not.
 */

import type { LifecycleErrorPayload, OnErrorCallback } from "../types/index.js";

const ON_ERROR_FIRED = Symbol.for("neurolink.onErrorFired");

function stampFired(error: object): void {
  try {
    Object.defineProperty(error, ON_ERROR_FIRED, {
      value: true,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  } catch {
    // Non-extensible — fall through; worst case is a duplicate fire.
  }
}

/**
 * Returns true when `markLifecycleErrorFired` or a previous
 * `fireOnErrorOnce` call has already stamped this error.
 */
export function hasLifecycleErrorFired(error: unknown): boolean {
  if (error === null || typeof error !== "object") {
    return false;
  }
  return (error as Record<symbol, unknown>)[ON_ERROR_FIRED] === true;
}

/**
 * Stamps the error as already-fired without invoking any callback.
 * Use this from sites that already invoked `onError` via their own
 * path (e.g. a provider-specific raw-fetch stream wrapper) so the
 * shared dedupe still works.
 */
export function markLifecycleErrorFired(error: unknown): void {
  if (error === null || typeof error !== "object") {
    return;
  }
  if ((error as Record<symbol, unknown>)[ON_ERROR_FIRED] === true) {
    return;
  }
  stampFired(error as object);
}

/**
 * Fire the consumer's `onError` once per logical failure.
 *
 * - No-op when `onError` is missing.
 * - No-op when the error is already stamped (any prior layer fired).
 * - Otherwise: stamps the error, then invokes the callback.
 *
 * The callback is fire-and-forget; rejections are swallowed so a
 * faulty handler can't mask the original throw. Callers that need
 * to AWAIT the callback (e.g. to enforce a timeout) should use
 * `hasLifecycleErrorFired` + `markLifecycleErrorFired` directly and
 * run the callback themselves.
 */
export function fireOnErrorOnce(
  onError: OnErrorCallback | undefined,
  error: unknown,
  payload: LifecycleErrorPayload,
): void {
  if (typeof onError !== "function") {
    return;
  }
  if (hasLifecycleErrorFired(error)) {
    return;
  }
  if (error !== null && typeof error === "object") {
    stampFired(error as object);
  }
  try {
    const result = onError(payload);
    Promise.resolve(result).catch(() => undefined);
  } catch {
    // Consumer callback errors must not poison the original throw.
  }
}
