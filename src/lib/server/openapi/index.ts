/**
 * OpenAPI Module
 * Exports for OpenAPI 3.1 specification generation
 */

// Generator
export {
  OpenAPIGenerator,
  createOpenAPIGenerator,
  generateOpenAPISpec,
  generateOpenAPIFromConfig,
} from "./generator.js";

// Schemas
export {
  // Common schemas
  ErrorResponseSchema,
  TokenUsageSchema,

  // Agent schemas
  AgentInputSchema,
  AgentExecuteRequestSchema,
  AgentExecuteResponseSchema,
  ToolCallSchema,
  ProviderInfoSchema,

  // Tool schemas
  ToolParameterSchema,
  ToolDefinitionSchema,
  ToolListResponseSchema,
  ToolExecuteRequestSchema,
  ToolExecuteResponseSchema,

  // MCP schemas
  MCPServerToolSchema,
  MCPServerStatusSchema,
  MCPServersListResponseSchema,

  // Memory schemas
  ConversationMessageSchema,
  SessionSchema,
  SessionsListResponseSchema,

  // Health schemas
  HealthResponseSchema,
  ReadyResponseSchema,
  MetricsResponseSchema,

  // Schema registry
  OpenAPISchemas,
} from "./schemas.js";

// Templates
export {
  // Response templates
  createSuccessResponse,
  createErrorResponse,
  createStreamingResponse,
  StandardErrorResponses,

  // Parameter templates
  createPathParameter,
  createQueryParameter,
  createHeaderParameter,
  CommonParameters,

  // Operation templates
  createGetOperation,
  createPostOperation,
  createStreamingPostOperation,
  createDeleteOperation,

  // Security schemes
  BearerSecurityScheme,
  ApiKeySecurityScheme,
  BasicSecurityScheme,

  // Tags and servers
  StandardTags,
  createServer,
  DefaultServers,

  // Info templates
  createApiInfo,
  NeuroLinkApiInfo,
} from "./templates.js";
