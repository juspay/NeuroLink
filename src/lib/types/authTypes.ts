/**
 * Auth-related type definitions for NeuroLink
 *
 * Canonical location for OAuth token storage types and token refresher contracts.
 * All auth type imports should reference this module (or the barrel re-export
 * via src/lib/types/index.ts).
 */

// =============================================================================
// STORED OAUTH TOKENS
// =============================================================================

/**
 * OAuth tokens structure for storage.
 * Stricter version of OAuthTokens with required fields for persistent storage.
 */
export type StoredOAuthTokens = {
  /** The access token for API authentication */
  accessToken: string;
  /** The refresh token for obtaining new access tokens (optional for some OAuth flows) */
  refreshToken?: string;
  /** Unix timestamp (ms) when the access token expires */
  expiresAt: number;
  /** Token type, typically "Bearer" */
  tokenType: string;
  /** Optional OAuth scopes granted */
  scope?: string;
};

/**
 * Token refresher function type.
 * Takes a refresh token and returns new tokens.
 */
export type TokenRefresher = (
  refreshToken: string,
) => Promise<StoredOAuthTokens>;

// =============================================================================
// TOKEN STORE TYPES
// =============================================================================

/**
 * Internal storage format for multi-provider tokens
 */
export type TokenStorageData = {
  /** Version of the storage format */
  version: string;
  /** Last modified timestamp */
  lastModified: number;
  /** Tokens indexed by provider name */
  providers: Record<string, StoredProviderTokens>;
};

/**
 * Per-provider token storage structure
 */
export type StoredProviderTokens = {
  /** The stored tokens */
  tokens: StoredOAuthTokens;
  /** When the tokens were stored */
  createdAt: number;
  /** When the tokens were last accessed */
  lastAccessed: number;
  /** Whether this provider's tokens are permanently disabled */
  disabled?: boolean;
  /** When the tokens were disabled (Unix ms) */
  disabledAt?: number;
  /** Reason the tokens were disabled (e.g., "refresh_failed") */
  disabledReason?: string;
};
