/**
 * TlsFingerprint — optional TLS fingerprint mimicry (stub).
 *
 * In a full implementation this would configure the TLS ClientHello to
 * match a known browser or CLI fingerprint (JA3/JA4), making the TLS
 * handshake indistinguishable from a genuine Claude Code session.
 *
 * This is a placeholder: the transformRequest is a no-op pass-through.
 * Real JA3 mimicry requires a native TLS library (e.g. curl-impersonate
 * or a custom Node.js TLS agent), which is out of scope for the initial
 * implementation.
 */

import type {
  CloakingPlugin,
  CloakingContext,
  TlsFingerprintOptions,
} from "../../../types/index.js";
import { logger } from "../../../utils/logger.js";

export function createTlsFingerprint(
  options: TlsFingerprintOptions = {},
): CloakingPlugin {
  const profile = options.profile ?? "claude-code";
  const warnOnUse = options.warnOnUse ?? true;
  let hasWarned = false;

  return {
    name: "tls-fingerprint",
    order: 0,
    // Stub — no real TLS mimicry is implemented; default-off to avoid misleading operators.
    enabled: false,

    async transformRequest(ctx: CloakingContext): Promise<CloakingContext> {
      if (warnOnUse && !hasWarned) {
        hasWarned = true;
        logger.warn(
          `[tls-fingerprint] Stub: profile "${profile}" requested but TLS mimicry is not implemented.`,
        );
      }

      // No-op: return context unchanged.
      // A real implementation would attach a custom TLS agent to the
      // request context here.
      return ctx;
    },

    async transformResponse(ctx: CloakingContext): Promise<CloakingContext> {
      // No-op pass-through
      return ctx;
    },
  };
}
