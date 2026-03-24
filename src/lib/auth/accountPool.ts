/**
 * AccountPool — manages a pool of proxy accounts with round-robin / fill-first
 * selection and exponential-backoff cooldowns for quota-exceeded accounts.
 *
 * @module auth/accountPool
 */

import type { ProxyAccount, AccountPoolConfig } from "../types/index.js";
import { tokenStore } from "./tokenStore.js";

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_COOLDOWN_MS = 300_000;
const DEFAULT_MAX_COOLDOWN_MS = 1_800_000;

// =============================================================================
// IMPLEMENTATION
// =============================================================================

export class AccountPool {
  private accounts: Map<string, ProxyAccount> = new Map();
  private cursor = 0;
  private readonly config: Required<AccountPoolConfig>;

  constructor(config: Partial<AccountPoolConfig> = {}) {
    this.config = {
      strategy: config.strategy ?? "round-robin",
      defaultCooldownMs: config.defaultCooldownMs ?? DEFAULT_COOLDOWN_MS,
      maxCooldownMs: config.maxCooldownMs ?? DEFAULT_MAX_COOLDOWN_MS,
      maxRetryAccounts: config.maxRetryAccounts ?? 0,
    };
  }

  /** Add (or replace) an account in the pool. */
  addAccount(account: ProxyAccount): void {
    // Clear any stale token refresher for a previously-registered account
    // with the same id — wireTokenRefresh() captures the old account object
    // in its closure, so leaving it behind would refresh the wrong tokens.
    tokenStore.clearTokenRefresher(account.id);
    this.accounts.set(account.id, { ...account });
  }

  /** Remove an account from the pool by id. */
  removeAccount(id: string): void {
    tokenStore.clearTokenRefresher(id);
    this.accounts.delete(id);
  }

  /**
   * Return the next healthy account according to the configured strategy.
   * Returns `null` when no healthy accounts are available.
   */
  getNextAccount(): ProxyAccount | null {
    this._expireCooldowns();
    const healthy = this._getHealthyAccounts();
    if (healthy.length === 0) {
      return null;
    }

    if (this.config.strategy === "fill-first") {
      const account = healthy[0];
      account.requestCount++;
      account.lastUsed = Date.now();
      return account;
    }

    // round-robin
    const index = this.cursor % healthy.length;
    this.cursor++;
    const account = healthy[index];
    account.requestCount++;
    account.lastUsed = Date.now();
    return account;
  }

  /**
   * Mark an account as quota-exceeded.  The account enters a cooldown state
   * with exponential backoff capped at `maxCooldownMs`.
   *
   * @deprecated Proxy routes now use `RuntimeAccountState` in `claudeProxyRoutes.ts`
   * for runtime account state management. This method is retained for public API compatibility.
   *
   * @param id             Account id
   * @param retryAfterMs   Optional explicit retry-after duration (from server header)
   */
  markQuotaExceeded(id: string, retryAfterMs?: number): void {
    const account = this.accounts.get(id);
    if (!account) {
      return;
    }
    account.consecutiveFailures++;
    const backoff = Math.min(
      this.config.defaultCooldownMs *
        Math.pow(2, account.consecutiveFailures - 1),
      this.config.maxCooldownMs,
    );
    account.cooldownUntil = Date.now() + (retryAfterMs ?? backoff);
    account.status = "cooling";
  }

  /**
   * Manually mark an account as available (healthy), clearing its cooldown.
   *
   * @deprecated Proxy routes now use `RuntimeAccountState` in `claudeProxyRoutes.ts`
   * for runtime account state management. This method is retained for public API compatibility.
   */
  markAvailable(id: string): void {
    const account = this.accounts.get(id);
    if (!account) {
      return;
    }
    account.status = "healthy";
    account.cooldownUntil = undefined;
  }

  /**
   * Mark an account as having completed a request successfully.
   *
   * @deprecated Proxy routes now use `RuntimeAccountState` in `claudeProxyRoutes.ts`
   * for runtime account state management. This method is retained for public API compatibility.
   */
  markSuccess(id: string): void {
    const account = this.accounts.get(id);
    if (!account) {
      return;
    }
    account.status = "healthy";
    account.cooldownUntil = undefined;
    account.consecutiveFailures = 0;
  }

  /** Return the number of currently healthy (not cooling/disabled) accounts. */
  getHealthyCount(): number {
    this._expireCooldowns();
    return this._getHealthyAccounts().length;
  }

  /** Return a snapshot of all accounts in the pool. */
  getAllAccounts(): ProxyAccount[] {
    return Array.from(this.accounts.values());
  }

  /** Return the configured selection strategy. */
  getStrategy(): string {
    return this.config.strategy;
  }

  /**
   * Wire automatic token refresh for an OAuth account.
   * Call after addAccount() for OAuth accounts that have a refresh token.
   *
   * @param accountId  The account id to wire refresh for
   * @param refreshFn  Function that takes a refresh token and returns new token data
   */
  wireTokenRefresh(
    accountId: string,
    refreshFn: (refreshToken: string) => Promise<{
      accessToken: string;
      refreshToken?: string;
      expiresAt: number | Date;
      tokenType?: string;
    }>,
  ): void {
    const account = this.accounts.get(accountId);
    if (!account || account.type !== "oauth" || !account.tokens?.refreshToken) {
      return;
    }

    tokenStore.setTokenRefresher(accountId, async (refreshToken: string) => {
      const result = await refreshFn(refreshToken);
      const newTokens = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken ?? refreshToken,
        expiresAt:
          result.expiresAt instanceof Date
            ? result.expiresAt.getTime()
            : result.expiresAt,
        tokenType: result.tokenType ?? "Bearer",
      };

      // Update in-memory account
      if (account.tokens) {
        account.tokens.accessToken = newTokens.accessToken;
        account.tokens.expiresAt = newTokens.expiresAt;
        if (newTokens.refreshToken) {
          account.tokens.refreshToken = newTokens.refreshToken;
        }
      }

      return newTokens;
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _getHealthyAccounts(): ProxyAccount[] {
    return Array.from(this.accounts.values()).filter(
      (a) => a.status === "healthy",
    );
  }

  private _expireCooldowns(): void {
    const now = Date.now();
    for (const account of this.accounts.values()) {
      if (
        account.status === "cooling" &&
        account.cooldownUntil &&
        now >= account.cooldownUntil
      ) {
        account.status = "healthy";
        account.cooldownUntil = undefined;
      }
    }
  }
}
