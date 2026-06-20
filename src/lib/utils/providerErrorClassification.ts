/**
 * Shared provider-error classification utilities used by both neurolink.ts and
 * the ModelPool routing subsystem.
 *
 * Extracted here to avoid duplication and to ensure that typed error classes
 * (AuthenticationError, AuthorizationError, ModelAccessDeniedError) are
 * checked consistently in both code paths.
 */

import {
  AuthenticationError,
  AuthorizationError,
  InvalidModelError,
  ModelAccessDeniedError,
} from "../types/index.js";
import {
  NON_RETRYABLE_HTTP_STATUS_CODES,
  isDeterministicClientErrorMessage,
} from "./retryability.js";

/**
 * Detects whether an error object looks like a model-access-denied condition.
 * Matches LiteLLM "team not allowed" / "team can only access models=[...]"
 * plus typed-error name/code markers when the full typed class is not present.
 */
export function looksLikeModelAccessDenied(error: unknown): boolean {
  if (!error) {
    return false;
  }
  const e = error as { name?: string; code?: string; message?: string };
  if (e.name === "ModelAccessDeniedError") {
    return true;
  }
  if (e.code === "MODEL_ACCESS_DENIED") {
    return true;
  }
  const msg =
    typeof e.message === "string"
      ? e.message
      : error instanceof Error
        ? error.message
        : String(error);
  if (!msg) {
    return false;
  }
  const lower = msg.toLowerCase();
  return (
    (lower.includes("team") && lower.includes("not allowed")) ||
    lower.includes("team can only access") ||
    /not\s+allowed\s+to\s+access\s+(this\s+)?model/i.test(msg)
  );
}

/**
 * Returns true when the error is definitively non-retryable: typed error
 * classes (auth, access-denied, invalid-model), non-retryable HTTP status
 * codes, or deterministic 400-class message patterns.
 *
 * NOTE: ContextBudgetExceededError is intentionally NOT non-retryable —
 * each provider has its own context window, so a budget rejection on one
 * provider does not preclude another provider accepting the same payload.
 */
export function isNonRetryableProviderError(error: unknown): boolean {
  if (error instanceof InvalidModelError) {
    return true;
  }
  if (error instanceof AuthenticationError) {
    return true;
  }
  if (error instanceof AuthorizationError) {
    return true;
  }
  if (error instanceof ModelAccessDeniedError) {
    return true;
  }

  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    const status =
      typeof err.status === "number"
        ? err.status
        : typeof err.statusCode === "number"
          ? err.statusCode
          : undefined;

    if (
      status !== undefined &&
      NON_RETRYABLE_HTTP_STATUS_CODES.includes(status)
    ) {
      return true;
    }
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (
      msg.includes("NOT_FOUND") ||
      msg.includes("Model Not Found") ||
      msg.includes("model not found") ||
      msg.includes("PERMISSION_DENIED") ||
      msg.includes("UNAUTHENTICATED")
    ) {
      return true;
    }
    if (isDeterministicClientErrorMessage(msg)) {
      return true;
    }
  }

  return false;
}
