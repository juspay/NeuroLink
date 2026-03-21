/**
 * NeuroLink Authentication Module
 *
 * Exports the full multi-provider authentication system including:
 * - Anthropic OAuth 2.0 flow (PKCE, token storage, callback server)
 * - Multi-provider auth (Auth0, Clerk, Firebase, Supabase, Cognito,
 *   Keycloak, Better Auth, WorkOS, JWT, OAuth2, Custom)
 * - AuthProviderFactory / AuthProviderRegistry for lazy-loaded provider creation
 * - Auth middleware (token extraction, RBAC, rate limiting)
 * - Session management (memory, Redis)
 * - Auth context (AsyncLocalStorage-based request scoping)
 */

// =============================================================================
// ANTHROPIC OAUTH - OAuth 2.0 Authentication
// =============================================================================

// OAuth Constants
export {
  ANTHROPIC_OAUTH_BASE_URL,
  DEFAULT_SCOPES,
  DEFAULT_REDIRECT_URI,
  DEFAULT_CALLBACK_PORT,
} from "./anthropicOAuth.js";

// Main OAuth class
export { AnthropicOAuth } from "./anthropicOAuth.js";

// OAuth error classes (canonical definitions in types/errors.ts)
export {
  OAuthError,
  OAuthConfigurationError,
  OAuthTokenExchangeError,
  OAuthTokenRefreshError,
  OAuthTokenValidationError,
  OAuthTokenRevocationError,
  OAuthCallbackServerError,
} from "../types/errors.js";

// OAuth helper functions
export {
  createAnthropicOAuth,
  createAnthropicOAuthConfig,
  hasAnthropicOAuthCredentials,
  startCallbackServer,
  stopCallbackServer,
  performOAuthFlow,
} from "./anthropicOAuth.js";

// OAuth types (canonical definitions in types/subscriptionTypes.ts)
export type {
  OAuthTokenResponse,
  OAuthFlowTokens,
  OAuthFlowTokens as OAuthTokens,
  TokenValidationResult as OAuthTokenValidationResult,
  AnthropicOAuthConfig,
  PKCEParams,
  CallbackResult,
} from "../types/index.js";

// =============================================================================
// TOKEN STORE - Secure Token Storage
// =============================================================================

// Main TokenStore class and instances
export { TokenStore, tokenStore, defaultTokenStore } from "./tokenStore.js";

// Token store error class (canonical definition in types/errors.ts)
export { TokenStoreError } from "../types/errors.js";

// Token store types (canonical location: types/authTypes.ts)
export type { StoredOAuthTokens, TokenRefresher } from "../types/authTypes.js";

// =============================================================================
// UNIFIED AUTH INTERFACE (canonical definitions in types/subscriptionTypes.ts)
// =============================================================================

export type { NeuroLinkAuthOptions, AuthStatus } from "../types/index.js";

// =============================================================================
// ACCOUNT POOL - Multi-account rotation with cooldowns
// =============================================================================

export { AccountPool } from "./accountPool.js";
export type { ProxyAccount, AccountPoolConfig } from "../types/index.js";

// =============================================================================
// MULTI-PROVIDER AUTH SYSTEM
// =============================================================================

// Factory and Registry
export {
  AuthProviderFactory,
  createAuthProvider,
} from "./AuthProviderFactory.js";

export { AuthProviderRegistry } from "./AuthProviderRegistry.js";

// Unified error factory
export { AuthError, AuthErrorCodes } from "./errors.js";

// Base Provider
export {
  AuthProviderError,
  BaseAuthProvider,
  InMemorySessionStorage,
} from "./providers/BaseAuthProvider.js";

// Provider Implementations
// NOTE: Concrete provider classes are NOT re-exported here to preserve lazy
// loading via dynamic imports in AuthProviderFactory.  Obtain provider
// instances through the factory instead:
//   const provider = await AuthProviderFactory.create("auth0", config);

// Auth Middleware
export {
  AuthMiddlewareError,
  AuthMiddlewareErrorCodes,
  createAuthMiddleware,
  createExpressAuthMiddleware,
  createProtectedMiddleware,
  createRBACMiddleware,
  createRequestContext,
  type ExpressMiddleware,
  extractToken,
  type MiddlewareHandler,
  type MiddlewareResult,
  type NextFunction,
} from "./middleware/AuthMiddleware.js";

// Rate Limiting Middleware
export {
  createAuthenticatedRateLimitMiddleware,
  createRateLimitByUserMiddleware,
  createRateLimitStorage,
  MemoryRateLimitStorage,
  type RateLimitConfig,
  type RateLimitMiddlewareResult,
  type RateLimitResult,
  type RateLimitStorage,
  RedisRateLimitStorage,
  UserRateLimiter,
} from "./middleware/rateLimitByUser.js";

// Session Management
export {
  createSessionStorage,
  MemorySessionStorage,
  RedisSessionStorage,
  SessionManager,
  type SessionManagerStorage as SessionStorageInterface,
} from "./sessionManager.js";

// Auth Context
export {
  AuthContextHolder,
  createAuthenticatedContext,
  getAuthContext,
  getCurrentSession,
  getCurrentUser,
  globalAuthContext,
  hasAllPermissions,
  hasAnyRole,
  hasPermission,
  hasRole,
  isAuthenticated,
  requireAuth,
  requirePermission,
  requireRole,
  requireUser,
  runWithAuthContext,
} from "./authContext.js";

// Request Context
export {
  RequestContext,
  NEUROLINK_RESOURCE_ID_KEY,
  NEUROLINK_THREAD_ID_KEY,
} from "./RequestContext.js";

// Auth Types
export type {
  Auth0Config,
  AuthCacheConfig,
  AuthErrorInfo as AuthErrorType,
  AuthErrorCode,
  AuthEventData,
  AuthEventHandler,
  AuthEventType,
  AuthenticatedContext,
  AuthMiddlewareConfig,
  AuthorizationResult,
  AuthProviderConfig,
  AuthProviderFactoryFn,
  AuthProviderHealthCheck,
  AuthProviderRegistration,
  AuthProviderType,
  AuthRequestContext,
  AuthSession,
  AuthUser,
  BaseAuthProviderConfig,
  BetterAuthConfig,
  ClerkConfig,
  CognitoConfig,
  CustomAuthConfig,
  FirebaseConfig,
  JWK,
  JWKS,
  JWTConfig,
  KeycloakConfig,
  MastraAuthProvider,
  OAuth2Config,
  RBACConfig,
  RBACMiddlewareConfig,
  SessionConfig,
  SessionStorage,
  SessionValidationResult,
  SupabaseConfig,
  TokenClaims,
  TokenExtractionConfig,
  TokenValidationConfig,
  TokenValidationResult as AuthTokenValidationResult,
  WorkOSConfig,
} from "../types/authTypes.js";

// Server Bridge
export { createAuthValidatorFromProvider } from "./serverBridge.js";
