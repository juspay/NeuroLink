/**
 * NeuroLink Server Adapters
 * Expose NeuroLink capabilities through HTTP APIs
 *
 * @example
 * ```typescript
 * import { NeuroLink } from "@juspay/neurolink";
 * import { createServer, createAllRoutes } from "@juspay/neurolink/server";
 *
 * const neurolink = new NeuroLink({
 *   provider: "openai",
 *   apiKey: process.env.OPENAI_API_KEY,
 * });
 *
 * // Create and start server
 * const server = await createServer(neurolink, {
 *   framework: "hono",
 *   config: { port: 3000 },
 * });
 *
 * await server.initialize();
 * await server.start();
 * ```
 */

// ============================================
// Abstract Base Class
// ============================================
export { BaseServerAdapter } from "./abstract/baseServerAdapter.js";

// ============================================
// Framework Adapters
// ============================================
export { HonoServerAdapter } from "./adapters/honoAdapter.js";
export { ExpressServerAdapter } from "./adapters/expressAdapter.js";
export { FastifyServerAdapter } from "./adapters/fastifyAdapter.js";
export { KoaServerAdapter } from "./adapters/koaAdapter.js";

// ============================================
// Factory
// ============================================
export {
  createServer,
  ServerAdapterFactory,
} from "./factory/serverAdapterFactory.js";

// ============================================
// Routes
// ============================================
export {
  createAgentRoutes,
  createAllRoutes,
  createHealthRoutes,
  createMCPRoutes,
  createMemoryRoutes,
  createOpenApiRoutes,
  createToolRoutes,
  registerAllRoutes,
  type CreateRoutesOptions,
} from "./routes/index.js";

// ============================================
// Middleware
// ============================================
export {
  createAuthMiddleware,
  createRoleMiddleware,
  type AuthConfig,
  type AuthResult,
} from "./middleware/auth.js";

export {
  createRateLimitMiddleware,
  createSlidingWindowRateLimitMiddleware,
  InMemoryRateLimitStore,
  RateLimitError,
  type RateLimitMiddlewareConfig,
  type RateLimitStore,
} from "./middleware/rateLimit.js";

export {
  createCacheMiddleware,
  createCacheInvalidator,
  InMemoryCacheStore,
  type CacheConfig,
  type CacheEntry,
  type CacheStore,
} from "./middleware/cache.js";

export {
  createRequestValidationMiddleware,
  createFieldValidator,
  ValidationError,
  type ValidationConfig,
  type ValidationSchema,
  type PropertySchema,
} from "./middleware/validation.js";

export {
  createTimingMiddleware,
  createRequestIdMiddleware,
  createErrorHandlingMiddleware,
  createSecurityHeadersMiddleware,
  createLoggingMiddleware,
  createCompressionMiddleware,
} from "./middleware/common.js";

// ============================================
// Types
// ============================================
export type {
  AgentExecuteRequest,
  AgentExecuteResponse,
  BodyParserConfig,
  CORSConfig,
  DataStreamWriter,
  HealthResponse,
  HttpMethod,
  LoggingConfig,
  MCPServerStatusResponse,
  MiddlewareDefinition,
  MiddlewareHandler,
  RateLimitConfig,
  ReadyResponse,
  RequiredServerAdapterConfig,
  RouteDefinition,
  RouteGroup,
  RouteHandler,
  ServerAdapterConfig,
  ServerAdapterEvents,
  ServerAdapterFactoryOptions,
  ServerContext,
  ServerFramework,
  ServerResponse,
  ServerStatus,
  SSEWriteOptions,
  StreamingConfig,
  ToolExecuteRequest,
  ToolExecuteResponse,
  // WebSocket Types
  WebSocketConfig,
  WebSocketHandler,
  WebSocketConnection,
  WebSocketMessage,
  WebSocketMessageType,
  AuthenticatedUser,
  AuthConfig as WebSocketAuthConfig,
  AuthStrategy,
  // Error Types
  ErrorCategoryType,
  ErrorSeverityType,
  ServerAdapterErrorCodeType,
  ServerAdapterErrorContext,
} from "./types.js";

// Export error constants
export {
  ErrorCategory,
  ErrorSeverity,
  ServerAdapterErrorCode,
} from "./types.js";

// ============================================
// Validation Utilities
// ============================================
export type { ErrorResponse, ValidationResult } from "./utils/validation.js";
export {
  AgentExecuteRequestSchema,
  createErrorResponse,
  ServerNameParamSchema,
  SessionIdParamSchema,
  ToolArgumentsSchema,
  ToolExecuteRequestSchema,
  ToolNameParamSchema,
  ToolSearchQuerySchema,
  validateParams,
  validateQuery,
  validateRequest,
} from "./utils/validation.js";

// ============================================
// OpenAPI
// ============================================
export {
  // Generator
  OpenAPIGenerator,
  createOpenAPIGenerator,
  generateOpenAPISpec,
  generateOpenAPIFromConfig,
  type OpenAPIGeneratorConfig,
  type OpenAPISpec,

  // Schemas
  ErrorResponseSchema,
  TokenUsageSchema,
  AgentInputSchema,
  AgentExecuteRequestSchema as OpenAPIAgentExecuteRequestSchema,
  AgentExecuteResponseSchema,
  ToolCallSchema,
  ProviderInfoSchema,
  ToolParameterSchema,
  ToolDefinitionSchema,
  ToolListResponseSchema,
  ToolExecuteRequestSchema as OpenAPIToolExecuteRequestSchema,
  ToolExecuteResponseSchema,
  MCPServerToolSchema,
  MCPServerStatusSchema,
  MCPServersListResponseSchema,
  ConversationMessageSchema,
  SessionSchema,
  SessionsListResponseSchema,
  HealthResponseSchema,
  ReadyResponseSchema,
  MetricsResponseSchema,
  OpenAPISchemas,

  // Templates
  createSuccessResponse,
  createErrorResponse as createOpenAPIErrorResponse,
  createStreamingResponse,
  StandardErrorResponses,
  createPathParameter,
  createQueryParameter,
  createHeaderParameter,
  CommonParameters,
  createGetOperation,
  createPostOperation,
  createStreamingPostOperation,
  createDeleteOperation,
  BearerSecurityScheme,
  ApiKeySecurityScheme,
  BasicSecurityScheme,
  StandardTags,
  createServer as createOpenAPIServer,
  DefaultServers,
  createApiInfo,
  NeuroLinkApiInfo,
} from "./openapi/index.js";

// ============================================
// Streaming
// ============================================
export {
  // Types
  type DataStreamEventType,
  type DataStreamEvent,
  type TextStartEvent,
  type TextDeltaEvent,
  type TextEndEvent,
  type ToolCallEvent,
  type ToolResultEvent,
  type DataEvent,
  type ErrorEvent,
  type FinishEvent,

  // Writer
  type DataStreamWriterConfig,
  createDataStreamWriter,

  // Response
  type DataStreamResponseConfig,
  DataStreamResponse,
  createDataStreamResponse,

  // Helpers
  pipeAsyncIterableToDataStream,
  createSSEHeaders,
  createNDJSONHeaders,
} from "./streaming/index.js";

// ============================================
// WebSocket
// ============================================
export {
  WebSocketConnectionManager,
  WebSocketMessageRouter,
  createAgentWebSocketHandler,
} from "./websocket/index.js";

// ============================================
// Errors
// ============================================
export {
  // Base error class
  ServerAdapterError,
  // Configuration errors
  ConfigurationError,
  RouteConflictError,
  RouteNotFoundError,
  // Validation errors
  ValidationError as ServerValidationError,
  // Authentication/Authorization errors
  AuthenticationError,
  InvalidAuthenticationError,
  AuthorizationError,
  // Rate limit errors
  RateLimitError as ServerRateLimitError,
  // Timeout errors
  TimeoutError,
  // Handler errors
  HandlerError,
  // Streaming errors
  StreamingError,
  StreamAbortedError,
  // WebSocket errors
  WebSocketError,
  WebSocketConnectionError,
  // Server lifecycle errors
  ServerStartError,
  ServerStopError,
  AlreadyRunningError,
  NotRunningError,
  // Dependency errors
  MissingDependencyError,
  // Error recovery
  ErrorRecoveryStrategies,
  // Utilities
  wrapError,
} from "./errors.js";
