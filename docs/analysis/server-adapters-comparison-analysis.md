---
title: "Server Adapters Comparison Analysis"
description: "Comprehensive comparison analysis of NeuroLink server adapters implementation versus Mastra reference implementation"
---

# Server Adapters Comparison Analysis: NeuroLink vs Mastra

**Status**: COMPREHENSIVE COMPARISON COMPLETE (REVISED v1.1)
**Reference**: Mastra server adapters implementation
**Files Analyzed**: 50+ source files across both repositories

> **v1.1 Changes:**
>
> - Added Gap 8: Documentation Structure (missing guides for server adapters)
> - Clarified that stream redaction must be **disabled by default** (opt-in only)
> - Corrected type references to use existing streaming types from codebase

---

## Executive Summary

This document provides a comprehensive analysis comparing the NeuroLink server adapters implementation against the Mastra reference implementation. The analysis covers architecture, routes, middleware, streaming, error handling, testing, documentation, and identified gaps.

### Key Findings

| Category          | NeuroLink Status | Comparison to Mastra                                         |
| ----------------- | ---------------- | ------------------------------------------------------------ |
| Architecture      | Excellent        | **Better** - Factory pattern with lazy loading               |
| Framework Support | Excellent        | **Equal** - Hono, Express, Fastify, Koa                      |
| Route Coverage    | Good             | **Partial** - Missing workflow, vector, A2A routes           |
| Middleware        | Excellent        | **Better** - More middleware options                         |
| Streaming         | Good             | **Partial** - Missing stream redaction (disabled by default) |
| WebSocket         | Excellent        | **Better** - Full WebSocket support                          |
| Error Handling    | Excellent        | **Better** - Tiered hierarchy with recovery                  |
| Testing           | Good             | **Partial** - Missing shared test utilities                  |
| Documentation     | **Needs Work**   | **Partial** - Missing guides, CLI commands                   |
| OpenAPI           | Excellent        | **Equal** - Full OpenAPI 3.1 support                         |

---

## 1. Architecture Analysis

### 1.1 NeuroLink Architecture

NeuroLink implements a **factory pattern with lazy loading** and dynamic provider registration:

```
src/lib/server/
├── abstract/
│   └── baseServerAdapter.ts    # EventEmitter-based base class
├── adapters/
│   ├── honoAdapter.ts          # Hono adapter (Node.js + edge runtime)
│   ├── expressAdapter.ts       # Express adapter (async initialization)
│   ├── fastifyAdapter.ts       # Fastify adapter (plugin system)
│   └── koaAdapter.ts           # Koa adapter (router integration)
├── factory/
│   └── serverAdapterFactory.ts # Central factory with lazy loading
├── middleware/
│   ├── auth.ts                 # Authentication (bearer, api-key, basic, custom)
│   ├── rateLimit.ts            # Fixed + sliding window rate limiting
│   ├── cache.ts                # LRU caching with TTL
│   ├── validation.ts           # Zod schema validation
│   └── role.ts                 # Role-based access control
├── routes/
│   ├── agentRoutes.ts          # /agent/execute, /agent/stream, /agent/providers
│   ├── toolRoutes.ts           # /tools, /tools/:name, /tools/search, /tools/execute
│   ├── mcpRoutes.ts            # /mcp/servers, /mcp/health
│   ├── memoryRoutes.ts         # /memory/stats, /memory/health, /memory/sessions
│   └── healthRoutes.ts         # /health, /health/live, /health/ready, /health/startup
├── utils/
│   ├── validation.ts           # Request validation utilities
│   └── openapi.ts              # OpenAPI 3.1 spec generator
├── types.ts                    # All type definitions
├── errors.ts                   # Error hierarchy with recovery strategies
└── index.ts                    # Barrel exports
```

**Key Design Decisions:**

1. **Base Class Pattern**: `BaseServerAdapter` extends `EventEmitter` for lifecycle events
2. **Lazy Loading**: Adapters instantiated on-demand via factory
3. **Route Groups**: Routes organized into logical groups with prefix support
4. **Middleware Chain**: Framework-agnostic middleware interface
5. **Type-First Design**: All types defined in `types.ts` using TypeScript `type` (not `interface`)

### 1.2 Mastra Architecture

Mastra uses a **monorepo structure** with separate packages per framework:

```
mastra/
├── packages/
│   └── server/
│       └── src/server/
│           ├── server-adapter/
│           │   ├── express.ts
│           │   ├── fastify.ts
│           │   ├── hono.ts
│           │   └── redact.ts      # Stream chunk redaction
│           ├── handlers/
│           │   ├── workflow.ts    # Workflow execution handlers
│           │   ├── agent.ts       # Agent handlers
│           │   └── vector.ts      # Vector store handlers
│           └── auth/
│               └── helpers.ts     # Auth helpers with dev skip
├── server-adapters/
│   ├── express/                   # Express-specific package
│   ├── fastify/                   # Fastify-specific package
│   ├── hono/                      # Hono-specific package
│   └── next/                      # Next.js adapter
└── tests/
    └── server-adapter.test.ts     # Shared test utilities
```

**Key Differences:**

| Aspect             | NeuroLink                 | Mastra                       |
| ------------------ | ------------------------- | ---------------------------- |
| Package Structure  | Monolithic                | Multi-package monorepo       |
| Adapter Pattern    | Factory with lazy loading | Direct instantiation         |
| Route Organization | Route groups with prefix  | Individual handler functions |
| Middleware         | Framework-agnostic        | Framework-specific           |
| Type Location      | Centralized `types.ts`    | Scattered across files       |

---

## 2. Framework Adapter Comparison

### 2.1 Hono Adapter

| Feature                | NeuroLink              | Mastra                 |
| ---------------------- | ---------------------- | ---------------------- |
| Multi-runtime support  | Yes (Node.js + edge)   | Yes                    |
| Middleware integration | Native Hono middleware | Native Hono middleware |
| Route registration     | Via RouteGroup         | Direct app.route()     |
| Error handling         | Custom error boundary  | Try-catch per route    |
| Streaming              | ReadableStream         | ReadableStream         |

**NeuroLink Hono Adapter** (`src/lib/server/adapters/honoAdapter.ts`):

```typescript
// Multi-runtime support with @hono/node-server
import { serve } from "@hono/node-server";
import { Hono } from "hono";

export class HonoServerAdapter extends BaseServerAdapter {
  private app: Hono;

  registerRoutes(routes: RouteGroup[]): void {
    for (const group of routes) {
      for (const route of group.routes) {
        this.registerSingleRoute(route);
      }
    }
  }
}
```

### 2.2 Express Adapter

| Feature              | NeuroLink      | Mastra           |
| -------------------- | -------------- | ---------------- |
| Async initialization | Yes            | Yes              |
| Body parsing         | Built-in       | Built-in         |
| Abort signal support | **NO**         | **YES**          |
| Route registration   | Via RouteGroup | Direct app.use() |

**Gap Identified**: Express abort signal handling

**Mastra Implementation** (reference):

```typescript
// mastra/server-adapters/express/src/index.ts
const controller = new AbortController();
res.on("close", () => {
  if (!res.writableFinished) {
    controller.abort();
  }
});
res.locals.abortSignal = controller.signal;
```

### 2.3 Fastify Adapter

| Feature             | NeuroLink      | Mastra               |
| ------------------- | -------------- | -------------------- |
| Plugin system       | Yes            | Yes                  |
| Schema validation   | Via Zod        | Built-in JSON Schema |
| MCP body attachment | **NO**         | **YES**              |
| Route registration  | Via RouteGroup | fastify.register()   |

**Gap Identified**: MCP raw body attachment

**Mastra Implementation** (reference):

```typescript
// mastra/server-adapters/fastify/src/index.ts
const rawReq = request.raw as typeof request.raw & { body?: unknown };
if (request.body !== undefined) {
  rawReq.body = request.body;
}
```

### 2.4 Koa Adapter

| Feature            | NeuroLink      | Mastra       |
| ------------------ | -------------- | ------------ |
| Router integration | @koa/router    | @koa/router  |
| Middleware support | Native Koa     | Native Koa   |
| Error handling     | Custom handler | Try-catch    |
| Route registration | Via RouteGroup | router.use() |

---

## 3. Route Coverage Analysis

### 3.1 Routes Present in Both

| Route Category | NeuroLink            | Mastra                     |
| -------------- | -------------------- | -------------------------- |
| Health/Ready   | `/api/health/*`      | `/health`, `/ready`        |
| Agent Execute  | `/api/agent/execute` | `/api/agents/:id/generate` |
| Agent Stream   | `/api/agent/stream`  | `/api/agents/:id/stream`   |
| Tools List     | `/api/tools`         | `/api/tools`               |
| Tool Execute   | `/api/tools/execute` | `/api/tools/:id/execute`   |
| MCP Health     | `/api/mcp/health`    | `/mcp/health`              |

### 3.2 Routes in Mastra but NOT in NeuroLink

| Route            | Mastra Path                  | Purpose                      | Priority |
| ---------------- | ---------------------------- | ---------------------------- | -------- |
| Workflow Execute | `/api/workflows/:id/execute` | Execute workflow             | Medium   |
| Workflow Resume  | `/api/workflows/:id/resume`  | Resume paused workflow       | Medium   |
| Workflow Watch   | `/api/workflows/:id/watch`   | Watch workflow status        | Medium   |
| Vector Query     | `/api/vectors/:id/query`     | Query vector store           | Medium   |
| Vector Upsert    | `/api/vectors/:id/upsert`    | Insert/update vectors        | Medium   |
| A2A Protocol     | `/api/a2a/*`                 | Agent-to-agent communication | Low      |
| Syncs            | `/api/syncs/*`               | Data synchronization         | Low      |

### 3.3 Routes in NeuroLink but NOT in Mastra

| Route           | NeuroLink Path             | Purpose                  |
| --------------- | -------------------------- | ------------------------ |
| Health Detailed | `/api/health/detailed`     | Full system diagnostics  |
| Health Startup  | `/api/health/startup`      | Startup probe for K8s    |
| Memory Stats    | `/api/memory/stats`        | Memory usage statistics  |
| Memory Sessions | `/api/memory/sessions/:id` | Session management       |
| Version         | `/api/version`             | Package version info     |
| Agent Providers | `/api/agent/providers`     | List available providers |
| Tool Search     | `/api/tools/search`        | Search tools by query    |

---

## 4. Middleware Comparison

### 4.1 Authentication

| Feature             | NeuroLink | Mastra  |
| ------------------- | --------- | ------- |
| Bearer Token        | Yes       | Yes     |
| API Key             | Yes       | Yes     |
| Basic Auth          | Yes       | No      |
| Custom Auth         | Yes       | Yes     |
| Dev Playground Skip | **NO**    | **YES** |
| Skip Paths          | Yes       | Yes     |

**Gap Identified**: Dev playground authentication skip

**Mastra Implementation** (reference):

```typescript
// mastra/packages/server/src/server/auth/helpers.ts
if (isDevPlayground(headers)) {
  return { valid: true, user: { id: "playground" } };
}
```

### 4.2 Rate Limiting

| Feature              | NeuroLink | Mastra |
| -------------------- | --------- | ------ |
| Fixed Window         | Yes       | Yes    |
| Sliding Window       | **YES**   | No     |
| Per-IP               | Yes       | Yes    |
| Per-User             | Yes       | Yes    |
| Custom Key Generator | Yes       | No     |
| Skip Paths           | Yes       | Yes    |

**NeuroLink Advantage**: Sliding window rate limiting provides smoother limits

### 4.3 Caching

| Feature       | NeuroLink | Mastra |
| ------------- | --------- | ------ |
| In-Memory LRU | Yes       | No     |
| TTL Support   | Yes       | No     |
| Per-Path TTL  | Yes       | No     |
| Cache Headers | Yes       | No     |

**NeuroLink Advantage**: Full caching middleware with LRU eviction

### 4.4 Validation

| Feature            | NeuroLink | Mastra            |
| ------------------ | --------- | ----------------- |
| Zod Schemas        | Yes       | No (uses TypeBox) |
| JSON Schema        | Via Zod   | Yes               |
| Field Validators   | Yes       | No                |
| Request Validation | Yes       | Yes               |

---

## 5. Streaming Implementation

### 5.1 SSE/NDJSON Streaming

| Feature            | NeuroLink | Mastra  |
| ------------------ | --------- | ------- |
| SSE Format         | Yes       | Yes     |
| NDJSON Format      | Yes       | Yes     |
| Chunk Redaction    | **NO**    | **YES** |
| Abort Signal       | Partial   | Yes     |
| Data Stream Writer | Yes       | Yes     |

**Gap Identified**: Stream chunk redaction for sensitive data

> **Important Implementation Note**: Stream redaction must be **DISABLED by default** in NeuroLink implementation. Unlike Mastra's always-on approach, NeuroLink should require explicit opt-in via `config.redaction.enabled = true`. This ensures backward compatibility and allows users to control when redaction is applied.

**Existing Types to Reuse** (DO NOT DUPLICATE):

- `DataStreamEvent` from `src/lib/server/streaming/dataStream.ts`
- `DataStreamEventType` from `src/lib/server/streaming/dataStream.ts`
- `DataStreamWriter` from `src/lib/server/types.ts`

**Mastra Implementation** (reference):

```typescript
// mastra/packages/server/src/server/server-adapter/redact.ts
export function redactStreamChunk<OUTPUT = undefined>(
  chunk: ChunkType<OUTPUT>,
): ChunkType<OUTPUT> {
  if (!chunk || typeof chunk !== "object") return chunk;

  switch (chunk.type) {
    case "step-start": {
      if ("payload" in chunk && chunk.payload) {
        const { request, ...payloadRest } = chunk.payload;
        return {
          ...chunk,
          payload: { ...payloadRest, request: {} },
        };
      }
    }
    case "tool-call":
    case "tool-result":
      // Redact sensitive tool data
      break;
  }
  return chunk;
}
```

**NeuroLink Implementation Requirement**:

```typescript
// Redaction MUST check enabled flag first
if (!config?.enabled) {
  return chunk; // Return unchanged when not enabled
}
```

### 5.2 WebSocket Support

| Feature               | NeuroLink | Mastra |
| --------------------- | --------- | ------ |
| WebSocket Connections | **YES**   | No     |
| Connection Management | **YES**   | No     |
| Heartbeat             | **YES**   | No     |
| Reconnection          | **YES**   | No     |

**NeuroLink Advantage**: Full WebSocket support with connection management

---

## 6. Error Handling Analysis

### 6.1 NeuroLink Error Hierarchy

NeuroLink implements a **tiered error hierarchy** with categories and recovery strategies:

```typescript
// Error categories
type ServerAdapterErrorCategory =
  | "VALIDATION"
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "INTERNAL"
  | "PROVIDER"
  | "CONFIGURATION";

// Error with recovery strategy
type ServerAdapterError = {
  code: string;
  message: string;
  category: ServerAdapterErrorCategory;
  statusCode: number;
  details?: Record<string, unknown>;
  recoveryStrategy?: ErrorRecoveryStrategy;
  requestId?: string;
};

// Recovery strategies
type ErrorRecoveryStrategy =
  | "RETRY"
  | "RETRY_WITH_BACKOFF"
  | "FAIL_FAST"
  | "FALLBACK"
  | "CIRCUIT_BREAK";
```

### 6.2 Mastra Error Handling

Mastra uses simpler error handling without recovery strategies:

```typescript
// Simple error response
throw new HTTPException(400, { message: "Invalid request" });
```

**NeuroLink Advantage**: Richer error information with recovery guidance

---

## 7. Testing Infrastructure

### 7.1 Test Coverage Comparison

| Category              | NeuroLink  | Mastra         |
| --------------------- | ---------- | -------------- |
| Unit Tests            | Yes        | Yes            |
| Integration Tests     | Yes        | Yes            |
| E2E Tests             | Partial    | Yes            |
| Shared Test Utilities | **NO**     | **YES**        |
| Test Fixtures         | JSON files | Shared helpers |

**Gap Identified**: Shared test utilities like `createTestAgent()`

### 7.2 NeuroLink Test Structure

```
test/
├── suites/
│   ├── tool-discovery.test.ts
│   ├── business-tools.test.ts
│   └── consistency.test.ts
├── integration/
│   └── server-adapter.test.ts
└── fixtures/
    └── servers/
        ├── hono-config.json
        ├── express-config.json
        └── ...
```

### 7.3 Mastra Test Utilities (Reference)

```typescript
// mastra/tests/utils.ts
export function createTestAgent(config?: AgentConfig) {
  return new Agent({
    name: "test-agent",
    model: "test-model",
    ...config,
  });
}

export function createTestMastra() {
  return new Mastra({
    agents: { testAgent: createTestAgent() },
  });
}
```

---

## 8. OpenAPI/Documentation

### 8.1 OpenAPI Generation

| Feature             | NeuroLink | Mastra |
| ------------------- | --------- | ------ |
| OpenAPI 3.1         | Yes       | Yes    |
| Auto-generation     | Yes       | Yes    |
| Schema Inference    | Yes       | Yes    |
| Route Documentation | Yes       | Yes    |
| CLI Export          | Yes       | Yes    |

**Note**: The `neurolink server openapi` CLI command is now implemented for OpenAPI export.

### 8.2 Documentation Coverage

| Documentation             | NeuroLink | Mastra  |
| ------------------------- | --------- | ------- |
| API Reference             | Yes       | Yes     |
| Configuration Guide       | Yes       | Yes     |
| Verification Checklist    | Yes       | Yes     |
| CLI Commands              | **NO**    | **YES** |
| Quick Start Guide         | **NO**    | **YES** |
| Framework-Specific Guides | **NO**    | **YES** |
| Security Best Practices   | **NO**    | **YES** |
| Deployment Guide          | **NO**    | **YES** |

**Gap Identified**: Documentation structure for server adapters

**Current NeuroLink Documentation Issues:**

1. No dedicated `docs/guides/server-adapters/` directory
2. `CONFIGURATION.md` located in `docs/server-tests/` instead of `docs/reference/`
3. No quick-start guide for server adapters
4. No framework-specific guides (Hono, Express, Fastify, Koa)
5. No security or deployment guides
6. Missing integration with main Docusaurus sidebar

**Required Documentation Structure:**

```
docs/
├── guides/
│   └── server-adapters/       # NEW
│       ├── index.md           # Quick start
│       ├── hono.md            # Hono guide
│       ├── express.md         # Express guide
│       ├── fastify.md         # Fastify guide
│       ├── koa.md             # Koa guide
│       ├── security.md        # Security best practices
│       └── deployment.md      # Deployment guide
└── reference/
    └── server-configuration.md  # Move from docs/server-tests/
```

---

## 9. What NeuroLink Does Better

### 9.1 Superior Features

1. **WebSocket Support**: Full WebSocket connection management with heartbeat and reconnection
2. **Sliding Window Rate Limiting**: More accurate rate limiting than fixed windows
3. **LRU Caching Middleware**: In-memory caching with TTL and per-path configuration
4. **Error Recovery Strategies**: Rich error types with recovery guidance
5. **Factory Pattern**: Clean lazy loading with dynamic adapter creation
6. **Health Routes**: Comprehensive health endpoints (live, ready, startup, detailed)
7. **Memory Routes**: Session management and memory statistics
8. **Type Organization**: Centralized type definitions in `types.ts`

### 9.2 Architectural Advantages

1. **Single Package**: Simpler deployment vs Mastra's multi-package approach
2. **EventEmitter Base**: Lifecycle events for monitoring and debugging
3. **Route Groups**: Logical organization with prefix support
4. **Framework-Agnostic Middleware**: Same middleware interface across all adapters

---

## 10. Gap Summary

### High Priority Gaps

| Gap                                    | Impact            | Effort | Reference                                                    |
| -------------------------------------- | ----------------- | ------ | ------------------------------------------------------------ |
| Stream Redaction (disabled by default) | Security          | Medium | `mastra/packages/server/src/server/server-adapter/redact.ts` |
| Express Abort Signal                   | Reliability       | Low    | `mastra/server-adapters/express/src/index.ts`                |
| Fastify MCP Body                       | MCP Compatibility | Low    | `mastra/server-adapters/fastify/src/index.ts`                |
| Shared Test Utilities                  | Testing           | Medium | `mastra/tests/utils.ts`                                      |
| Dev Playground Skip                    | DX                | Low    | `mastra/packages/server/src/server/auth/helpers.ts`          |
| Route Deprecation                      | API Evolution     | Low    | N/A                                                          |
| **Documentation Structure**            | DX                | Medium | NeuroLink Docusaurus patterns                                |

### Medium Priority Gaps

| Gap                   | Impact       | Effort | Reference                                                |
| --------------------- | ------------ | ------ | -------------------------------------------------------- |
| Workflow Routes       | Completeness | High   | `mastra/packages/server/src/server/handlers/workflow.ts` |
| Vector Routes         | Completeness | High   | `mastra/packages/server/src/server/handlers/vector.ts`   |
| A2A Routes            | Completeness | High   | `mastra/packages/server/src/server/handlers/a2a.ts`      |
| Composite Auth        | Flexibility  | Medium | N/A                                                      |
| Per-Route Body Limits | Security     | Low    | N/A                                                      |
| CLI Serve Command     | Usability    | Medium | N/A                                                      |

### Low Priority Gaps

| Gap                     | Impact        | Effort | Reference                                            |
| ----------------------- | ------------- | ------ | ---------------------------------------------------- |
| Sync Routes             | Completeness  | Medium | `mastra/packages/server/src/server/handlers/sync.ts` |
| Memory Routes Expansion | Completeness  | Low    | N/A                                                  |
| Telemetry Routes        | Observability | Low    | N/A                                                  |

---

## 11. Recommendations

### 11.1 Immediate Actions (High Priority)

1. **Implement stream redaction** for sensitive data in streaming responses
   - **IMPORTANT**: Must be DISABLED by default (opt-in via `enabled: true`)
   - Use existing `DataStreamEvent` types from `src/lib/server/streaming/dataStream.ts`
2. **Add Express abort signal** handling for client disconnection
3. **Attach raw body for Fastify** MCP compatibility
4. **Create shared test utilities** following NeuroLink patterns
5. **Create documentation structure** for server adapters
   - Create `docs/guides/server-adapters/` with quick start and framework guides
   - Move `CONFIGURATION.md` to `docs/reference/server-configuration.md`
   - Update Docusaurus sidebar configuration

### 11.2 Short-Term Actions (Medium Priority)

1. **Add CLI `serve` command** for easier server startup
2. **Implement dev playground skip** in authentication
3. **Add route deprecation mechanism** for API evolution

### 11.3 Long-Term Actions (Low Priority)

1. **Consider workflow routes** if NeuroLink adds workflow support
2. **Consider vector routes** if NeuroLink adds vector store support
3. **Add composite authentication** for complex auth scenarios

---

## 12. Conclusion

The NeuroLink server adapters implementation is **architecturally superior** to Mastra in several key areas (factory pattern, error handling, middleware options, WebSocket support). However, there are **specific functional gaps** that should be addressed to achieve feature parity:

1. **Security**: Stream redaction is critical for production use (must be disabled by default)
2. **Reliability**: Abort signal handling improves client disconnection handling
3. **Compatibility**: MCP body attachment is needed for full MCP compliance
4. **Developer Experience**: CLI commands and shared test utilities improve usability
5. **Documentation**: Server adapters need proper Docusaurus documentation structure

The gaps identified are well-scoped and can be implemented incrementally while maintaining NeuroLink's architectural advantages.

**Implementation Notes:**

- Stream redaction must be **disabled by default** (opt-in only) to ensure backward compatibility
- Use existing streaming types from `src/lib/server/streaming/dataStream.ts` - do not duplicate
- Documentation should follow NeuroLink's Docusaurus patterns with proper sidebar integration

---

## Appendix A: File Mapping

| NeuroLink File                              | Mastra Equivalent                              |
| ------------------------------------------- | ---------------------------------------------- |
| `src/lib/server/adapters/honoAdapter.ts`    | `server-adapters/hono/src/index.ts`            |
| `src/lib/server/adapters/expressAdapter.ts` | `server-adapters/express/src/index.ts`         |
| `src/lib/server/adapters/fastifyAdapter.ts` | `server-adapters/fastify/src/index.ts`         |
| `src/lib/server/adapters/koaAdapter.ts`     | N/A (Mastra doesn't have Koa)                  |
| `src/lib/server/middleware/auth.ts`         | `packages/server/src/server/auth/helpers.ts`   |
| `src/lib/server/routes/agentRoutes.ts`      | `packages/server/src/server/handlers/agent.ts` |
| `src/lib/server/utils/openapi.ts`           | `packages/server/src/server/openapi.ts`        |
| `src/lib/server/types.ts`                   | Scattered across multiple files                |

## Appendix B: Type System Comparison

| Aspect            | NeuroLink                                 | Mastra               |
| ----------------- | ----------------------------------------- | -------------------- |
| Type vs Interface | Uses `type` exclusively                   | Mixed usage          |
| Location          | Centralized `types.ts`                    | Per-file definitions |
| Naming Convention | Suffix-based (-Options, -Result, -Config) | Mixed conventions    |
| Export Pattern    | Barrel exports via `index.ts`             | Direct exports       |

## Appendix C: Test Pattern Comparison

| Aspect      | NeuroLink                      | Mastra             |
| ----------- | ------------------------------ | ------------------ |
| Test Runner | Vitest                         | Vitest             |
| Structure   | describe/it blocks             | describe/it blocks |
| Mocking     | vi.mock()                      | vi.mock()          |
| Fixtures    | JSON files in `test/fixtures/` | Inline objects     |
| Assertions  | expect()                       | expect()           |
