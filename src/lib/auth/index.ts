/**
 * NeuroLink Authentication Module
 *
 * Provides OAuth 2.0 authentication support for Claude Pro/Max subscriptions
 * and secure token storage.
 *
 * Key components:
 * - AnthropicOAuth: OAuth 2.0 flow implementation with PKCE support
 * - TokenStore: Secure local storage for OAuth tokens
 * - Callback Server: Local HTTP server for OAuth redirects
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
} from "./anthropicOAuth.js";

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
  TokenValidationResult,
  AnthropicOAuthConfig,
  PKCEParams,
  CallbackResult,
} from "./anthropicOAuth.js";

// =============================================================================
// TOKEN STORE - Secure Token Storage
// =============================================================================

// Main TokenStore class and instances
export { TokenStore, tokenStore, defaultTokenStore } from "./tokenStore.js";

// Token store error class (canonical definition in types/errors.ts)
export { TokenStoreError } from "./tokenStore.js";

// Token store types
export type {
  StoredOAuthTokens,
  OAuthTokens as StoredOAuthTokensLegacy,
  TokenRefresher,
} from "./tokenStore.js";

// =============================================================================
// UNIFIED AUTH INTERFACE (canonical definitions in types/subscriptionTypes.ts)
// =============================================================================

export type {
  NeuroLinkAuthOptions,
  AuthStatus,
} from "../types/subscriptionTypes.js";

// =============================================================================
// MULTI-PROVIDER AUTH SYSTEM
// =============================================================================

// Factory and Registry
export {
  AuthFactoryError,
  AuthFactoryErrorCodes,
  AuthProviderFactory,
  createAuthProvider,
  getAuthProviderFactory,
} from "./AuthProviderFactory.js";

export {
  type AuthProviderMetadata,
  AuthProviderRegistry,
  AuthRegistryError,
  AuthRegistryErrorCodes,
  getAuthProviderRegistry,
  type ProviderHealthStatus,
  registerAllAuthProviders,
} from "./AuthProviderRegistry.js";

// Base Provider
export {
  AuthProviderError,
  AuthProviderErrorCodes,
  BaseAuthProvider,
  InMemorySessionStorage,
} from "./providers/BaseAuthProvider.js";

// Provider Implementations
export { Auth0Provider } from "./providers/auth0.js";
export { BetterAuthProvider } from "./providers/betterAuth.js";
export { CognitoProvider } from "./providers/CognitoProvider.js";
export { ClerkProvider } from "./providers/clerk.js";
export { CustomAuthProvider } from "./providers/custom.js";
export {
  FirebaseAuthProvider,
  FirebaseAuthProvider as FirebaseProvider,
} from "./providers/firebase.js";
export { JWTProvider } from "./providers/jwt.js";
export { KeycloakProvider } from "./providers/KeycloakProvider.js";
export { OAuth2Provider } from "./providers/oauth2.js";
export {
  SupabaseAuthProvider,
  SupabaseAuthProvider as SupabaseProvider,
} from "./providers/supabase.js";
export { WorkOSProvider } from "./providers/workos.js";

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
  type SessionStorage as SessionStorageInterface,
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

// Auth Errors
export {
  AuthError,
  AuthenticationFailedError,
  AuthRateLimitError,
  InsufficientPermissionsError,
  InvalidConfigurationError,
  InvalidTokenError,
  isAuthError,
  isAuthenticationError,
  isPermissionError,
  isSessionError,
  isTokenError,
  MissingTokenError,
  ProviderAPIError,
  ProviderInitializationError,
  SessionExpiredError,
  SessionNotFoundError,
  TokenExpiredError,
  UserNotFoundError,
} from "./authErrors.js";

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
  AuthError as AuthErrorType,
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
} from "./types/authTypes.js";

// Server Bridge
export { createAuthValidatorFromProvider } from "./serverBridge.js";
