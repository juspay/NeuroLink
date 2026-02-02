/**
 * Common Middleware Components
 * Reusable middleware for NeuroLink server adapters
 */

export { createAuthMiddleware, type AuthConfig } from "./auth.js";
export { createCacheMiddleware, type CacheConfig } from "./cache.js";
export {
  createRateLimitMiddleware,
  type RateLimitMiddlewareConfig,
} from "./rateLimit.js";
export {
  createRequestValidationMiddleware,
  type ValidationConfig,
} from "./validation.js";
export {
  createTimingMiddleware,
  createRequestIdMiddleware,
  createErrorHandlingMiddleware,
  createSecurityHeadersMiddleware,
  createLoggingMiddleware,
  createCompressionMiddleware,
} from "./common.js";
export {
  createAbortSignalMiddleware,
  createExpressAbortMiddleware,
  type AbortSignalMiddlewareOptions,
} from "./abortSignal.js";
export {
  createMCPBodyAttachmentMiddleware,
  fastifyMCPBodyHook,
} from "./mcpBodyAttachment.js";
export {
  createDeprecationMiddleware,
  type DeprecationConfig,
} from "./deprecation.js";
