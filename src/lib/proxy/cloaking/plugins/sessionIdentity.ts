/**
 * SessionIdentity — generates unique user_id / session_id values per account
 * so that Anthropic sees consistent "user" fingerprints even when requests are
 * spread across multiple accounts.
 *
 * Session IDs follow the format:
 *   user_[32 hex chars]_account_[UUIDv4]_session_[UUIDv4]
 *
 * IDs are cached with a 1-hour TTL and reused for subsequent requests from
 * the same account within that window.
 */

import { randomBytes, randomUUID } from "crypto";
import type {
  CloakingPlugin,
  CloakingContext,
  CachedSession,
} from "../../../types/index.js";

// ── Session cache with TTL ───────────────────────────────────────────────────

const TTL_MS = 3_600_000; // 1 hour

const sessionCache = new Map<string, CachedSession>();

/** Generate a new session user ID in the required format. */
function generateUserId(): string {
  const hex = randomBytes(32).toString("hex"); // 64 hex chars, take first 32
  return `user_${hex.slice(0, 32)}_account_${randomUUID()}_session_${randomUUID()}`;
}

/** Purge all expired sessions from the cache. Exported for external timer use. */
export function purgeExpiredSessions(): void {
  const now = Date.now();
  for (const [key, entry] of sessionCache) {
    if (entry.expiresAt <= now) {
      sessionCache.delete(key);
    }
  }
}

export function createSessionIdentity(): CloakingPlugin {
  return {
    name: "session-identity",
    order: 20,
    enabled: true,

    async transformRequest(ctx: CloakingContext): Promise<CloakingContext> {
      const accountId = ctx.account.id;
      const now = Date.now();

      // Check cache first — reuse if still valid
      let cached = sessionCache.get(accountId);
      if (!cached || cached.expiresAt <= now) {
        cached = {
          userId: generateUserId(),
          expiresAt: now + TTL_MS,
        };
        sessionCache.set(accountId, cached);
      }

      const body = { ...ctx.request.body };
      // Only set user_id if not already present — in passthrough mode,
      // oauthFetch.ts owns this field and sets it from its own session cache.
      if (!(body.metadata as Record<string, unknown> | undefined)?.user_id) {
        body.metadata = {
          ...(body.metadata as Record<string, unknown> | undefined),
          user_id: cached.userId,
        };
      }

      return {
        ...ctx,
        request: {
          ...ctx.request,
          body,
        },
      };
    },
  };
}
