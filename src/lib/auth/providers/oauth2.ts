// src/lib/auth/providers/oauth2.ts

import * as jose from "jose";
import { createProxyFetch } from "../../proxy/proxyFetch.js";
import type {
  AuthHealthCheck,
  AuthProviderConfig,
  AuthRequestContext,
  AuthSession,
  AuthUser,
  TokenValidationResult,
} from "../../types/authTypes.js";
import { logger } from "../../utils/logger.js";
import {
  InvalidConfigurationError,
  ProviderAPIError,
  ProviderInitializationError,
} from "../authErrors.js";
import { BaseAuthProvider, type MastraAuthProvider } from "../authProvider.js";
import type { OAuth2Config } from "../types/authTypes.js";

/**
 * Generic OAuth2/OIDC Provider
 *
 * Supports any OAuth2-compliant identity provider with configurable endpoints.
 * Works with both JWKS-based JWT validation and token introspection.
 *
 * Features:
 * - JWT validation with JWKS (if jwksUrl provided)
 * - Token introspection endpoint support
 * - User info endpoint integration
 * - PKCE support
 * - In-memory session management
 *
 * @example
 * ```typescript
 * const oauth2 = new OAuth2Provider({
 *   type: "oauth2",
 *   authorizationUrl: "https://idp.example.com/oauth/authorize",
 *   tokenUrl: "https://idp.example.com/oauth/token",
 *   userInfoUrl: "https://idp.example.com/userinfo",
 *   jwksUrl: "https://idp.example.com/.well-known/jwks.json",
 *   clientId: "your-client-id",
 *   clientSecret: "your-client-secret",
 * });
 *
 * const result = await oauth2.authenticateToken(accessToken);
 * ```
 */
export class OAuth2Provider
  extends BaseAuthProvider
  implements MastraAuthProvider
{
  readonly type = "oauth2" as const;

  private authorizationUrl: string;
  private tokenUrl: string;
  private userInfoUrl?: string;
  private jwksUrl?: string;
  private clientId: string;
  private clientSecret?: string;
  private scopes: string[];
  private redirectUrl?: string;
  private usePKCE: boolean;

  private jwks: jose.JWTVerifyGetKey | null = null;
  private sessions: Map<string, AuthSession> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();

  constructor(config: AuthProviderConfig & OAuth2Config) {
    super(config);

    if (!config.authorizationUrl) {
      throw new InvalidConfigurationError(
        "OAuth2 authorizationUrl is required",
        "oauth2",
        ["authorizationUrl"],
      );
    }
    if (!config.tokenUrl) {
      throw new InvalidConfigurationError(
        "OAuth2 tokenUrl is required",
        "oauth2",
        ["tokenUrl"],
      );
    }
    if (!config.clientId) {
      throw new InvalidConfigurationError(
        "OAuth2 clientId is required",
        "oauth2",
        ["clientId"],
      );
    }

    this.authorizationUrl = config.authorizationUrl;
    this.tokenUrl = config.tokenUrl;
    this.userInfoUrl = config.userInfoUrl;
    this.jwksUrl = config.jwksUrl;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.scopes = config.scopes ?? ["openid", "profile", "email"];
    this.redirectUrl = config.redirectUrl;
    this.usePKCE = config.usePKCE ?? false;
  }

  /**
   * Initialize JWKS for JWT verification (if jwksUrl is provided)
   */
  async initialize(): Promise<void> {
    if (this.jwksUrl) {
      try {
        const jwksUrl = new URL(this.jwksUrl);
        this.jwks = jose.createRemoteJWKSet(jwksUrl);
        logger.debug(`OAuth2 provider initialized with JWKS: ${this.jwksUrl}`);
      } catch (error) {
        throw new ProviderInitializationError(
          "Failed to initialize OAuth2 JWKS",
          "oauth2",
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }
  }

  /**
   * Validate OAuth2 access token
   *
   * Uses JWKS validation if available, otherwise falls back to userinfo endpoint
   */
  async authenticateToken(
    token: string,
    _context?: AuthRequestContext,
  ): Promise<TokenValidationResult> {
    // Try JWKS validation first if available
    if (this.jwksUrl && this.jwks) {
      try {
        const { payload } = await jose.jwtVerify(token, this.jwks);

        const user: AuthUser = {
          id: payload.sub ?? "",
          email: payload.email as string | undefined,
          name: payload.name as string | undefined,
          picture: payload.picture as string | undefined,
          roles: (payload.roles as string[]) ?? [],
          permissions: (payload.permissions as string[]) ?? [],
          metadata: payload as Record<string, unknown>,
        };

        return {
          valid: true,
          payload: payload as unknown as Record<string, unknown>,
          user,
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
          tokenType: "jwt",
        };
      } catch {
        logger.debug("JWKS validation failed, trying userinfo endpoint");
      }
    }

    // Fall back to userinfo endpoint if available
    if (this.userInfoUrl) {
      return this.validateViaUserInfo(token);
    }

    return {
      valid: false,
      error: "No validation method available (provide jwksUrl or userInfoUrl)",
    };
  }

  /**
   * Validate token via userinfo endpoint
   */
  private async validateViaUserInfo(
    token: string,
  ): Promise<TokenValidationResult> {
    try {
      const proxyFetch = createProxyFetch();
      const response = await proxyFetch(this.userInfoUrl!, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return {
          valid: false,
          error: `UserInfo endpoint returned ${response.status}`,
        };
      }

      const data = (await response.json()) as Record<string, unknown>;

      const user: AuthUser = {
        id: (data.sub as string) ?? (data.id as string) ?? "",
        email: data.email as string | undefined,
        name: data.name as string | undefined,
        picture: data.picture as string | undefined,
        emailVerified: data.email_verified as boolean | undefined,
        roles: (data.roles as string[]) ?? [],
        permissions: (data.permissions as string[]) ?? [],
        metadata: data,
      };

      return {
        valid: true,
        payload: data,
        user,
        tokenType: "jwt",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn("OAuth2 userinfo validation failed:", message);

      return {
        valid: false,
        error: message,
      };
    }
  }

  /**
   * Create a new session
   */
  async createSession(
    user: AuthUser,
    context?: AuthRequestContext,
  ): Promise<AuthSession> {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const duration = this.config.session?.duration || 3600;

    const session: AuthSession = {
      id: sessionId,
      user,
      createdAt: now,
      expiresAt: new Date(now.getTime() + duration * 1000),
      isValid: true,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    };

    this.sessions.set(sessionId, session);

    if (!this.userSessions.has(user.id)) {
      this.userSessions.set(user.id, new Set());
    }
    this.userSessions.get(user.id)!.add(sessionId);

    this.emit("auth:login", user);
    logger.debug(`OAuth2 session created for user: ${user.id}`);

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<AuthSession | null> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    if (new Date() > session.expiresAt) {
      await this.destroySession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Refresh session
   */
  async refreshSession(sessionId: string): Promise<AuthSession | null> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return null;
    }

    const duration = this.config.session?.duration || 3600;
    session.expiresAt = new Date(Date.now() + duration * 1000);

    this.sessions.set(sessionId, session);
    this.emit("auth:tokenRefresh", session);

    return session;
  }

  /**
   * Destroy a session
   */
  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (session) {
      const userSessionSet = this.userSessions.get(session.user.id);
      if (userSessionSet) {
        userSessionSet.delete(sessionId);
      }

      this.sessions.delete(sessionId);
      this.emit("auth:logout", session.user.id);
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<AuthSession[]> {
    const sessionIds = this.userSessions.get(userId);

    if (!sessionIds) {
      return [];
    }

    const sessions: AuthSession[] = [];
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyAllUserSessions(userId: string): Promise<void> {
    const sessionIds = this.userSessions.get(userId);

    if (sessionIds) {
      for (const sessionId of sessionIds) {
        this.sessions.delete(sessionId);
      }
      this.userSessions.delete(userId);
      this.emit("auth:logout", userId);
    }
  }

  /**
   * Get authorization URL for OAuth2 flow
   */
  getAuthorizationUrl(state: string, codeChallenge?: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      scope: this.scopes.join(" "),
      state,
    });

    if (this.redirectUrl) {
      params.set("redirect_uri", this.redirectUrl);
    }

    if (this.usePKCE && codeChallenge) {
      params.set("code_challenge", codeChallenge);
      params.set("code_challenge_method", "S256");
    }

    return `${this.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(
    code: string,
    codeVerifier?: string,
  ): Promise<{ accessToken: string; refreshToken?: string; idToken?: string }> {
    const proxyFetch = createProxyFetch();

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.clientId,
      code,
    });

    if (this.clientSecret) {
      body.set("client_secret", this.clientSecret);
    }

    if (this.redirectUrl) {
      body.set("redirect_uri", this.redirectUrl);
    }

    if (this.usePKCE && codeVerifier) {
      body.set("code_verifier", codeVerifier);
    }

    const response = await proxyFetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new ProviderAPIError(
        `Token exchange failed: ${response.status}`,
        "oauth2",
        response.status,
      );
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string | undefined,
      idToken: data.id_token as string | undefined,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<AuthHealthCheck> {
    try {
      // Try to fetch JWKS or authorization endpoint to check connectivity
      const proxyFetch = createProxyFetch();
      const checkUrl = this.jwksUrl ?? this.authorizationUrl;
      const response = await proxyFetch(checkUrl, { method: "HEAD" });

      return {
        healthy: response.ok || response.status === 405, // 405 is ok for HEAD
        providerConnected: true,
        sessionStorageHealthy: true,
        error:
          response.ok || response.status === 405
            ? undefined
            : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        providerConnected: false,
        sessionStorageHealthy: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.sessions.clear();
    this.userSessions.clear();
    logger.debug("OAuth2 provider cleaned up");
  }
}
