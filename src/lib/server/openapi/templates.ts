/**
 * OpenAPI Templates
 * Reusable OpenAPI path and operation templates
 */

import type { JsonObject } from "../../types/index.js";

// ============================================
// Response Templates
// ============================================

/**
 * Create a success response template
 */
export function createSuccessResponse(
  description: string,
  schemaRef: string,
  contentType: string = "application/json",
): JsonObject {
  return {
    description,
    content: {
      [contentType]: {
        schema: {
          $ref: `#/components/schemas/${schemaRef}`,
        },
      },
    },
  };
}

/**
 * Create an error response template
 */
export function createErrorResponse(
  description: string,
  _statusCode: number = 400,
): JsonObject {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ErrorResponse",
        },
      },
    },
  };
}

/**
 * Create a streaming response template
 */
export function createStreamingResponse(description: string): JsonObject {
  return {
    description,
    content: {
      "text/event-stream": {
        schema: {
          type: "string",
          description: "Server-Sent Events stream",
        },
      },
    },
  };
}

/**
 * Standard error responses for common HTTP status codes
 */
export const StandardErrorResponses: Record<string, JsonObject> = {
  "400": createErrorResponse("Bad Request - Invalid input"),
  "401": createErrorResponse("Unauthorized - Authentication required"),
  "403": createErrorResponse("Forbidden - Insufficient permissions"),
  "404": createErrorResponse("Not Found - Resource does not exist"),
  "429": createErrorResponse("Too Many Requests - Rate limit exceeded"),
  "500": createErrorResponse("Internal Server Error"),
};

// ============================================
// Parameter Templates
// ============================================

/**
 * Create a path parameter template
 */
export function createPathParameter(
  name: string,
  description: string,
  schema: JsonObject = { type: "string" },
): JsonObject {
  return {
    name,
    in: "path",
    required: true,
    description,
    schema,
  };
}

/**
 * Create a query parameter template
 */
export function createQueryParameter(
  name: string,
  description: string,
  schema: JsonObject = { type: "string" },
  required: boolean = false,
): JsonObject {
  return {
    name,
    in: "query",
    required,
    description,
    schema,
  };
}

/**
 * Create a header parameter template
 */
export function createHeaderParameter(
  name: string,
  description: string,
  required: boolean = false,
): JsonObject {
  return {
    name,
    in: "header",
    required,
    description,
    schema: {
      type: "string",
    },
  };
}

/**
 * Common parameters
 */
export const CommonParameters = {
  sessionId: createPathParameter("sessionId", "Session identifier"),
  serverName: createPathParameter("name", "MCP server name"),
  toolName: createPathParameter("name", "Tool name"),
  limitQuery: createQueryParameter(
    "limit",
    "Maximum number of items to return",
    { type: "integer", minimum: 1, maximum: 100, default: 25 },
  ),
  offsetQuery: createQueryParameter("offset", "Number of items to skip", {
    type: "integer",
    minimum: 0,
    default: 0,
  }),
  searchQuery: createQueryParameter("q", "Search query string", {
    type: "string",
  }),
  requestIdHeader: createHeaderParameter(
    "X-Request-ID",
    "Unique request identifier for tracing",
  ),
  authorizationHeader: createHeaderParameter(
    "Authorization",
    "Bearer token or API key",
    true,
  ),
};

// ============================================
// Operation Templates
// ============================================

/**
 * Create a standard GET operation
 */
export function createGetOperation(
  summary: string,
  description: string,
  tags: string[],
  responseSchema: string,
  parameters?: JsonObject[],
): JsonObject {
  return {
    summary,
    description,
    tags,
    parameters: parameters ?? [],
    responses: {
      "200": createSuccessResponse("Success", responseSchema),
      ...StandardErrorResponses,
    },
  };
}

/**
 * Create a standard POST operation
 */
export function createPostOperation(
  summary: string,
  description: string,
  tags: string[],
  requestSchema: string,
  responseSchema: string,
  parameters?: JsonObject[],
): JsonObject {
  return {
    summary,
    description,
    tags,
    parameters: parameters ?? [],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            $ref: `#/components/schemas/${requestSchema}`,
          },
        },
      },
    },
    responses: {
      "200": createSuccessResponse("Success", responseSchema),
      ...StandardErrorResponses,
    },
  };
}

/**
 * Create a streaming POST operation
 */
export function createStreamingPostOperation(
  summary: string,
  description: string,
  tags: string[],
  requestSchema: string,
  parameters?: JsonObject[],
): JsonObject {
  return {
    summary,
    description,
    tags,
    parameters: parameters ?? [],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            $ref: `#/components/schemas/${requestSchema}`,
          },
        },
      },
    },
    responses: {
      "200": createStreamingResponse("Streaming response"),
      ...StandardErrorResponses,
    },
  };
}

/**
 * Create a DELETE operation
 */
export function createDeleteOperation(
  summary: string,
  description: string,
  tags: string[],
  parameters: JsonObject[],
): JsonObject {
  return {
    summary,
    description,
    tags,
    parameters,
    responses: {
      "204": {
        description: "Successfully deleted",
      },
      ...StandardErrorResponses,
    },
  };
}

// ============================================
// Security Scheme Templates
// ============================================

/**
 * Bearer token security scheme
 */
export const BearerSecurityScheme: JsonObject = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT Bearer token authentication",
};

/**
 * API key security scheme (header)
 */
export const ApiKeySecurityScheme: JsonObject = {
  type: "apiKey",
  in: "header",
  name: "X-API-Key",
  description: "API key authentication via header",
};

/**
 * Basic auth security scheme
 */
export const BasicSecurityScheme: JsonObject = {
  type: "http",
  scheme: "basic",
  description: "HTTP Basic authentication",
};

// ============================================
// Tag Templates
// ============================================

/**
 * Standard API tags
 */
export const StandardTags: JsonObject[] = [
  {
    name: "agent",
    description: "Agent execution and streaming endpoints",
  },
  {
    name: "tools",
    description: "Tool discovery and execution endpoints",
  },
  {
    name: "mcp",
    description: "MCP server management endpoints",
  },
  {
    name: "memory",
    description: "Conversation memory and session management",
  },
  {
    name: "health",
    description: "Health check and metrics endpoints",
  },
  {
    name: "streaming",
    description: "Real-time streaming endpoints",
  },
];

// ============================================
// Server Templates
// ============================================

/**
 * Create a server definition
 */
export function createServer(
  url: string,
  description: string,
  variables?: Record<string, { default: string; description: string }>,
): JsonObject {
  const server: JsonObject = {
    url,
    description,
  };

  if (variables) {
    server.variables = Object.entries(variables).reduce(
      (acc, [key, value]) => {
        acc[key] = {
          default: value.default,
          description: value.description,
        };
        return acc;
      },
      {} as Record<string, JsonObject>,
    );
  }

  return server;
}

/**
 * Default server configurations
 */
export const DefaultServers: JsonObject[] = [
  createServer("http://localhost:3000", "Local development server"),
  createServer("{protocol}://{host}:{port}", "Custom server", {
    protocol: {
      default: "http",
      description: "Protocol (http or https)",
    },
    host: {
      default: "localhost",
      description: "Server hostname",
    },
    port: {
      default: "3000",
      description: "Server port",
    },
  }),
];

// ============================================
// Info Templates
// ============================================

/**
 * Create API info section
 */
export function createApiInfo(
  title: string,
  version: string,
  description: string,
  options?: {
    termsOfService?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  },
): JsonObject {
  const info: JsonObject = {
    title,
    version,
    description,
  };

  if (options?.termsOfService) {
    info.termsOfService = options.termsOfService;
  }

  if (options?.contact) {
    info.contact = options.contact;
  }

  if (options?.license) {
    info.license = options.license;
  }

  return info;
}

/**
 * Default NeuroLink API info
 */
export const NeuroLinkApiInfo = createApiInfo(
  "NeuroLink API",
  "1.0.0",
  `
NeuroLink Server API provides a unified interface to access AI capabilities
through multiple providers. This API supports:

- **Agent Execution**: Run AI agents with customizable parameters
- **Streaming**: Real-time streaming responses via Server-Sent Events
- **Tool Management**: Discover and execute tools from MCP servers
- **Memory Management**: Conversation session and context management
- **MCP Integration**: Manage external Model Context Protocol servers

## Authentication

The API supports multiple authentication methods:
- **Bearer Token**: JWT tokens in the Authorization header
- **API Key**: API key via X-API-Key header
- **Basic Auth**: HTTP Basic authentication

## Rate Limiting

Default rate limits apply to all endpoints:
- 100 requests per 15-minute window
- Custom limits may apply to specific endpoints

## Errors

All errors follow a consistent format with error code, message, and optional details.
`.trim(),
  {
    contact: {
      name: "NeuroLink Team",
      url: "https://github.com/juspay/neurolink",
    },
    license: {
      name: "Apache 2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0",
    },
  },
);
