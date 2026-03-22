#!/usr/bin/env node
/**
 * Node.js Backend Example with NeuroLink Client SDK
 *
 * Demonstrates using the NeuroLink Client SDK in a Node.js backend environment
 * with Express.js for building AI-powered API endpoints.
 *
 * Features:
 * - Express.js API endpoints
 * - HTTP client usage in server context
 * - OAuth2 authentication with automatic refresh
 * - Middleware integration (logging, retry, caching)
 * - Error handling and validation
 * - Streaming responses via SSE
 * - Agent and workflow execution
 * - Rate limiting and request throttling
 *
 * @example Usage: npx tsx examples/client-sdks/node-backend.ts
 *
 * NOTE: This example requires the following dependencies to be installed separately:
 *   npm install express cors helmet compression
 *   npm install -D @types/express @types/cors @types/compression
 */

import { fileURLToPath } from "url";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { createClient, NeuroLinkClient } from "@juspay/neurolink/client";
import {
  OAuth2TokenManager,
  createDynamicAuthInterceptor,
  createLoggingInterceptor,
  createRetryInterceptor,
  createCacheInterceptor,
  createRateLimitInterceptor,
  type GenerateRequestOptions,
  type AgentExecuteOptions,
  type WorkflowExecuteOptions,
  isNeuroLinkError,
  ErrorCode,
} from "@juspay/neurolink/client";

// =============================================================================
// Configuration
// =============================================================================

const PORT = process.env.PORT || 3000;
const NEUROLINK_BASE_URL =
  process.env.NEUROLINK_BASE_URL || "http://localhost:8000";

// OAuth2 configuration (if using OAuth2)
const OAUTH_CONFIG = {
  tokenUrl: process.env.OAUTH_TOKEN_URL || "",
  clientId: process.env.OAUTH_CLIENT_ID || "",
  clientSecret: process.env.OAUTH_CLIENT_SECRET || "",
  scope: "api:read api:write",
  audience: NEUROLINK_BASE_URL,
};

// =============================================================================
// NeuroLink Client Setup
// =============================================================================

let neurolinkClient: NeuroLinkClient;

function createNeurolinkClient(): NeuroLinkClient {
  const client = createClient({
    baseUrl: NEUROLINK_BASE_URL,
    timeout: 60000,
    retry: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      retryOnNetworkError: true,
    },
    debug: process.env.NODE_ENV === "development",
  });

  // Setup OAuth2 authentication (if configured)
  if (OAUTH_CONFIG.clientId && OAUTH_CONFIG.clientSecret) {
    const tokenManager = new OAuth2TokenManager(OAUTH_CONFIG, {
      refreshBufferMs: 60000, // Refresh 60s before expiry
    });

    client.use(
      createDynamicAuthInterceptor(async () => {
        return await tokenManager.getToken();
      }),
    );
  } else if (process.env.NEUROLINK_API_KEY) {
    // Fallback to API key
    client.updateConfig({
      apiKey: process.env.NEUROLINK_API_KEY,
    });
  }

  // Add logging middleware
  client.use(
    createLoggingInterceptor({
      logger: console,
      logRequest: true,
      logResponse: true,
      logErrors: true,
      logHeaders: false, // Don't log sensitive headers
      maxBodyLength: 500,
      redactHeaders: ["authorization", "x-api-key"],
    }),
  );

  // Add retry middleware
  client.use(
    createRetryInterceptor({
      maxAttempts: 5,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt} due to:`, error.message);
      },
    }),
  );

  // Add caching middleware (for GET requests)
  client.use(
    createCacheInterceptor({
      ttl: 60000, // Cache for 1 minute
      maxSize: 100,
      strategy: "lru",
      shouldCache: (req, res) => {
        return req.method === "GET" && res.status === 200;
      },
      onHit: (key) => {
        console.log("Cache hit:", key);
      },
    }),
  );

  // Add rate limiting middleware
  client.use(
    createRateLimitInterceptor({
      maxRequests: 100,
      intervalMs: 60000, // 100 requests per minute
      strategy: "sliding-window",
      onLimit: (retryAfter) => {
        console.warn(`Rate limited, retry after ${retryAfter}ms`);
      },
    }),
  );

  return client;
}

// Initialize client
neurolinkClient = createNeurolinkClient();

// =============================================================================
// Express App Setup
// =============================================================================

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// =============================================================================
// API Routes
// =============================================================================

/**
 * Health check endpoint
 */
app.get("/health", async (req: Request, res: Response) => {
  try {
    const health = await neurolinkClient.health();
    res.json({
      status: "ok",
      server: health.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: (error as Error).message,
    });
  }
});

/**
 * Generate text endpoint
 *
 * POST /api/generate
 * Body: {
 *   input: { text: string, images?: string[], files?: string[] },
 *   provider?: string,
 *   model?: string,
 *   temperature?: number,
 *   maxTokens?: number,
 *   systemPrompt?: string,
 *   enableTools?: boolean,
 * }
 */
app.post("/api/generate", async (req: Request, res: Response) => {
  try {
    const options: GenerateRequestOptions = {
      input: {
        text: req.body.input?.text || req.body.prompt,
        images: req.body.input?.images,
        files: req.body.input?.files,
      },
      provider: req.body.provider,
      model: req.body.model,
      temperature: req.body.temperature,
      maxTokens: req.body.maxTokens,
      systemPrompt: req.body.systemPrompt || req.body.system,
      enableTools: req.body.enableTools,
      tools: req.body.tools,
    };

    const result = await neurolinkClient.generate(options);

    res.json({
      success: true,
      data: result.data,
      duration: result.duration,
      requestId: result.requestId,
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * Stream text generation endpoint (SSE)
 *
 * POST /api/stream
 * Body: Same as /api/generate
 */
app.post("/api/stream", async (req: Request, res: Response) => {
  try {
    const options: GenerateRequestOptions = {
      input: {
        text: req.body.input?.text || req.body.prompt,
        images: req.body.input?.images,
        files: req.body.input?.files,
      },
      provider: req.body.provider,
      model: req.body.model,
      temperature: req.body.temperature,
      maxTokens: req.body.maxTokens,
      systemPrompt: req.body.systemPrompt,
      enableTools: req.body.enableTools,
      tools: req.body.tools,
    };

    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Create an AbortController and abort upstream streaming when the
    // HTTP client disconnects, so we don't keep consuming provider tokens.
    const abortController = new AbortController();
    req.on("close", () => {
      abortController.abort();
    });

    // Stream response
    await neurolinkClient.stream(
      options,
      {
        onText: (text) => {
          res.write(
            `data: ${JSON.stringify({ type: "text", content: text })}\n\n`,
          );
        },
        onToolCall: (toolCall) => {
          res.write(
            `data: ${JSON.stringify({ type: "tool-call", toolCall })}\n\n`,
          );
        },
        onToolResult: (toolResult) => {
          res.write(
            `data: ${JSON.stringify({ type: "tool-result", toolResult })}\n\n`,
          );
        },
        onMetadata: (metadata) => {
          res.write(
            `data: ${JSON.stringify({ type: "metadata", metadata })}\n\n`,
          );
        },
        onDone: (result) => {
          res.write(`data: ${JSON.stringify({ type: "done", result })}\n\n`);
          res.write("data: [DONE]\n\n");
          res.end();
        },
        onError: (error) => {
          res.write(`data: ${JSON.stringify({ type: "error", error })}\n\n`);
          res.end();
        },
      },
      {
        signal: abortController.signal,
      },
    );
  } catch (error) {
    if (!res.headersSent) {
      handleApiError(error, res);
    }
  }
});

/**
 * Execute agent endpoint
 *
 * POST /api/agents/:agentId/execute
 * Body: {
 *   input: string,
 *   sessionId?: string,
 *   context?: object,
 *   tools?: { enabled?: string[], disabled?: string[], mode?: string },
 * }
 */
app.post(
  "/api/agents/:agentId/execute",
  async (req: Request, res: Response) => {
    try {
      const options: AgentExecuteOptions = {
        agentId: req.params.agentId,
        input: req.body.input,
        sessionId: req.body.sessionId,
        context: req.body.context,
        stream: req.body.stream,
        tools: req.body.tools,
      };

      if (options.stream) {
        // Stream agent execution
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });

        await neurolinkClient.streamAgent(options, {
          onText: (text) => {
            res.write(
              `data: ${JSON.stringify({ type: "text", content: text })}\n\n`,
            );
          },
          onDone: (result) => {
            res.write(`data: ${JSON.stringify({ type: "done", result })}\n\n`);
            res.write("data: [DONE]\n\n");
            res.end();
          },
        });
      } else {
        // Execute agent
        const result = await neurolinkClient.executeAgent(options);

        res.json({
          success: true,
          data: result.data,
          duration: result.duration,
        });
      }
    } catch (error) {
      handleApiError(error, res);
    }
  },
);

/**
 * List agents endpoint
 */
app.get("/api/agents", async (req: Request, res: Response) => {
  try {
    const result = await neurolinkClient.listAgents();

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * Get agent details endpoint
 */
app.get("/api/agents/:agentId", async (req: Request, res: Response) => {
  try {
    const result = await neurolinkClient.getAgent(req.params.agentId);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * Execute workflow endpoint
 *
 * POST /api/workflows/:workflowId/execute
 * Body: {
 *   input: object,
 *   sessionId?: string,
 *   resumeToken?: string,
 *   callbackUrl?: string,
 * }
 */
app.post(
  "/api/workflows/:workflowId/execute",
  async (req: Request, res: Response) => {
    try {
      const options: WorkflowExecuteOptions = {
        workflowId: req.params.workflowId,
        input: req.body.input,
        sessionId: req.body.sessionId,
        resumeToken: req.body.resumeToken,
        callbackUrl: req.body.callbackUrl,
      };

      const result = await neurolinkClient.executeWorkflow(options);

      res.json({
        success: true,
        data: result.data,
        duration: result.duration,
      });
    } catch (error) {
      handleApiError(error, res);
    }
  },
);

/**
 * Resume workflow endpoint
 */
app.post(
  "/api/workflows/:workflowId/resume",
  async (req: Request, res: Response) => {
    try {
      const result = await neurolinkClient.resumeWorkflow(
        req.params.workflowId,
        req.body.resumeToken,
        req.body.resumeData,
      );

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      handleApiError(error, res);
    }
  },
);

/**
 * Get workflow status endpoint
 */
app.get(
  "/api/workflows/:workflowId/runs/:runId",
  async (req: Request, res: Response) => {
    try {
      const result = await neurolinkClient.getWorkflowStatus(
        req.params.workflowId,
        req.params.runId,
      );

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      handleApiError(error, res);
    }
  },
);

/**
 * Cancel workflow endpoint
 */
app.post(
  "/api/workflows/:workflowId/runs/:runId/cancel",
  async (req: Request, res: Response) => {
    try {
      const result = await neurolinkClient.cancelWorkflow(
        req.params.workflowId,
        req.params.runId,
      );

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      handleApiError(error, res);
    }
  },
);

/**
 * List workflows endpoint
 */
app.get("/api/workflows", async (req: Request, res: Response) => {
  try {
    const result = await neurolinkClient.listWorkflows();

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * List tools endpoint
 */
app.get("/api/tools", async (req: Request, res: Response) => {
  try {
    const result = await neurolinkClient.listTools({
      category: req.query.category as string | undefined,
      serverId: req.query.serverId as string | undefined,
    });

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * Execute tool endpoint
 */
app.post(
  "/api/tools/:toolName/execute",
  async (req: Request, res: Response) => {
    try {
      const result = await neurolinkClient.executeTool(
        req.params.toolName,
        req.body.params || req.body,
      );

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      handleApiError(error, res);
    }
  },
);

/**
 * List providers endpoint
 */
app.get("/api/providers", async (req: Request, res: Response) => {
  try {
    const result = await neurolinkClient.listProviders();

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * Get provider status endpoint
 */
app.get(
  "/api/providers/:providerName/status",
  async (req: Request, res: Response) => {
    try {
      const result = await neurolinkClient.getProviderStatus(
        req.params.providerName,
      );

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      handleApiError(error, res);
    }
  },
);

// =============================================================================
// Error Handling
// =============================================================================

function handleApiError(error: unknown, res: Response) {
  console.error("API Error:", error);

  if (isNeuroLinkError(error)) {
    const statusCode = error.status || 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        retryable: error.retryable,
        requestId: error.requestId,
      },
    });
  } else {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Internal server error",
      },
    });
  }
}

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: err.message,
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// =============================================================================
// Server Startup
// =============================================================================

async function startServer() {
  try {
    // Test connection to NeuroLink server
    console.log("Testing connection to NeuroLink server...");
    const health = await neurolinkClient.health();
    console.log("NeuroLink server health:", health.data);

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   API endpoints:`);
      console.log(`     POST /api/generate - Generate text`);
      console.log(`     POST /api/stream - Stream generation`);
      console.log(`     POST /api/agents/:agentId/execute - Execute agent`);
      console.log(
        `     POST /api/workflows/:workflowId/execute - Execute workflow`,
      );
      console.log(`     GET  /api/tools - List tools`);
      console.log(`     GET  /api/providers - List providers`);
      console.log(`\n   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`   NeuroLink URL: ${NEUROLINK_BASE_URL}\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  process.exit(0);
});

// Start server (ESM module guard)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

// =============================================================================
// Example Usage
// =============================================================================

/*
# Example API calls

# Generate text
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "input": { "text": "Explain quantum computing" },
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7
  }'

# Stream generation
curl -X POST http://localhost:3000/api/stream \
  -H "Content-Type: application/json" \
  -d '{
    "input": { "text": "Write a story" },
    "provider": "anthropic",
    "model": "claude-3-5-sonnet"
  }'

# Execute agent
curl -X POST http://localhost:3000/api/agents/code-assistant/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Refactor this code to use async/await",
    "sessionId": "session-123",
    "context": { "language": "typescript" }
  }'

# List tools
curl http://localhost:3000/api/tools?category=data

# Execute tool
curl -X POST http://localhost:3000/api/tools/getCurrentWeather/execute \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "location": "San Francisco, CA",
      "units": "fahrenheit"
    }
  }'
*/
