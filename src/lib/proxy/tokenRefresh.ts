import { logger } from "../utils/logger.js";
import { tokenStore } from "../auth/tokenStore.js";
import type {
  RefreshableAccount,
  RefreshResult,
  StoredOAuthTokens,
  TokenPersistTarget,
} from "../types/index.js";

const REFRESH_URL = "https://api.anthropic.com/v1/oauth/token";
const REFRESH_URL_FALLBACK = "https://console.anthropic.com/v1/oauth/token";
const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const BUFFER_MS = 60 * 60 * 1000;
const USER_AGENT = "claude-cli/2.1.80 (external, cli)";

export function needsRefresh(account: RefreshableAccount): boolean {
  return !!(
    account.expiresAt &&
    account.expiresAt <= Date.now() + BUFFER_MS &&
    account.refreshToken
  );
}

export async function refreshToken(
  account: RefreshableAccount,
): Promise<RefreshResult> {
  if (!account.refreshToken) {
    return { success: false, error: "No refresh token available" };
  }

  const formBody = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: account.refreshToken,
    client_id: CLIENT_ID,
  }).toString();

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": USER_AGENT,
  };

  const urls = [REFRESH_URL, REFRESH_URL_FALLBACK];

  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: formBody,
        signal: AbortSignal.timeout(10_000),
      });

      if (!resp.ok) {
        const errorBody = await resp.text();
        logger.warn(`[token-refresh] failed for ${account.label} at ${url}`, {
          status: resp.status,
          error: errorBody.slice(0, 500),
        });
        // If primary URL returned a non-ok status, try fallback
        if (url === REFRESH_URL) {
          continue;
        }
        return { success: false, error: errorBody, status: resp.status };
      }

      const data = (await resp.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
      };
      const previousExpiresAt = account.expiresAt;
      account.token = data.access_token;
      account.expiresAt =
        data.expires_in !== undefined
          ? Date.now() + data.expires_in * 1000
          : previousExpiresAt && previousExpiresAt > Date.now()
            ? previousExpiresAt
            : Date.now() + 55 * 60 * 1000;
      if (data.refresh_token) {
        account.refreshToken = data.refresh_token;
      }
      logger.debug(`[token-refresh] refreshed for ${account.label}`);
      return { success: true };
    } catch (e) {
      logger.warn(`[token-refresh] exception for ${account.label} at ${url}`, {
        error: String(e),
      });
      // If primary URL threw, try fallback
      if (url === REFRESH_URL) {
        continue;
      }
      return { success: false, error: String(e) };
    }
  }

  // Should not reach here, but guard against empty urls array
  return { success: false, error: "No refresh URLs available" };
}

export async function persistTokens(
  target: TokenPersistTarget,
  account: RefreshableAccount,
): Promise<void> {
  if (typeof target !== "string" && "providerKey" in target) {
    await persistTokenStoreAccount(target.providerKey, account);
    return;
  }

  const credPath = typeof target === "string" ? target : target.credPath;
  await persistLegacyCredentials(credPath, account);
}

async function persistLegacyCredentials(
  credPath: string,
  account: RefreshableAccount,
): Promise<void> {
  try {
    const fs = await import("fs/promises");
    const existing = JSON.parse(await fs.readFile(credPath, "utf8"));
    existing.oauth = {
      ...existing.oauth,
      accessToken: account.token,
      expiresAt: account.expiresAt,
      refreshToken: account.refreshToken,
    };
    existing.updatedAt = Date.now();
    const tmpPath = credPath + ".tmp";
    await fs.writeFile(tmpPath, JSON.stringify(existing, null, 2), {
      mode: 0o600,
    });
    await fs.rename(tmpPath, credPath);
  } catch (err) {
    logger.warn("[token-refresh] Failed to persist legacy credentials", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function persistTokenStoreAccount(
  providerKey: string,
  account: RefreshableAccount,
): Promise<void> {
  try {
    const existing = await tokenStore.loadTokens(providerKey);
    const merged: StoredOAuthTokens = {
      accessToken: account.token,
      refreshToken: account.refreshToken ?? existing?.refreshToken,
      expiresAt:
        account.expiresAt ?? existing?.expiresAt ?? Date.now() + 55 * 60 * 1000,
      tokenType: existing?.tokenType ?? "Bearer",
      ...(existing?.scope ? { scope: existing.scope } : {}),
    };
    await tokenStore.saveTokens(providerKey, merged);
  } catch (err) {
    logger.warn("[token-refresh] Failed to persist TokenStore credentials", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
