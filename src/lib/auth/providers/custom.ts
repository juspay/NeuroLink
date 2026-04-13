// src/lib/auth/providers/custom.ts

import type {
  AuthProviderConfig,
  CustomAuthConfig,
  AuthUser,
  AuthSession,
  TokenValidationResult,
  AuthRequestContext,
  AuthHealthCheck,
} from "../../types/index.js";
import { logger } from "../../utils/logger.js";
import { AuthError } from "../errors.js";
import { BaseAuthProvider } from "./BaseAuthProvider.js";

/**
 * Custom Authentication Provider
 *
 * Allows users to provide their own authentication logic through callback functions.
 * Useful for integrating with custom auth systems or implementing unique auth flows.
 *
 * Features:
 * - Custom token validation via callback
 * - Custom user fetching (optional)
 * - Custom session creation (optional, delegates to base when not provided)
 * - Session management (inherited from BaseAuthProvider)
 *
 * @example
 * ```typescript
 * const custom = new CustomAuthProvider({
 *   type: "custom",
 *   validateToken: async (token, context) => {
 *     // Your custom token validation logic
 *     const decoded = await myAuthService.verify(token);
 *     return {
 *       valid: !!decoded,
 *       user: decoded ? {
 *         id: decoded.sub,
 *         email: decoded.email,
 *         roles: decoded.roles || [],
 *         permissions: decoded.permissions || [],
 *       } : undefined,
 *     };
 *   },
 *   getUser: async (userId) => {
 *     // Your custom user fetching logic
 *     return myUserService.getById(userId);
 *   },
 * });
 *
 * const result = await custom.authenticateToken(token);
 * ```
 */
export class CustomAuthProvider extends BaseAuthProvider {
  readonly type = "custom" as const;

  private validateTokenFn: (
    token: string,
    context?: AuthRequestContext,
  ) => Promise<TokenValidationResult>;
  private getUserFn?: (userId: string) => Promise<AuthUser | null>;
  private createSessionFn?: (
    user: AuthUser,
    context?: AuthRequestContext,
  ) => Promise<AuthSession>;

  constructor(config: AuthProviderConfig & CustomAuthConfig) {
    super(config);

    if (!config.validateToken) {
      throw AuthError.create(
        "CONFIGURATION_ERROR",
        "Custom validateToken function is required",
        { details: { provider: "custom", missingFields: ["validateToken"] } },
      );
    }

    this.validateTokenFn = config.validateToken;
    this.getUserFn = config.getUser;
    this.createSessionFn = config.createSession;
  }

  /**
   * Validate token using custom function
   */
  async authenticateToken(
    token: string,
    context?: AuthRequestContext,
  ): Promise<TokenValidationResult> {
    try {
      return await this.validateTokenFn(token, context);
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create a new session.
   * Uses custom function if provided, otherwise delegates to BaseAuthProvider.
   */
  async createSession(
    user: AuthUser,
    context?: AuthRequestContext,
  ): Promise<AuthSession> {
    if (this.createSessionFn) {
      const session = await this.createSessionFn(user, context);
      await this.sessionStorage.save(session);
      this.emit("auth:login", session.user);
      return session;
    }

    // Delegate to base class session creation
    return super.createSession(user, context);
  }

  /**
   * Get user by ID using custom function
   */
  async getUser(userId: string): Promise<AuthUser | null> {
    if (this.getUserFn) {
      try {
        return await this.getUserFn(userId);
      } catch (error) {
        logger.error("Custom getUser failed:", error);
        return null;
      }
    }

    // No custom user fetching, return null
    logger.warn("Custom getUser function not provided");
    return null;
  }

  /**
   * Health check - always healthy for custom provider
   */
  async healthCheck(): Promise<AuthHealthCheck> {
    return {
      healthy: true,
      providerConnected: true,
      sessionStorageHealthy: true,
    };
  }
}
