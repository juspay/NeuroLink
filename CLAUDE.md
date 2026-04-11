# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Contents

1. [Project Overview](#project-overview)
2. [Critical Rules](#critical-rules)
3. [Architecture](#architecture)
4. [Key Files](#key-files)
5. [Development Commands](#development-commands)
6. [How-To Guides](#how-to-guides)
7. [Common Patterns](#common-patterns)

---

## Project Overview

NeuroLink is a unified AI development platform shipping as both a **TypeScript SDK** and **CLI**. It wraps 13+ AI providers (OpenAI, Anthropic, Google AI Studio, Vertex, AWS Bedrock, Azure, Mistral, LiteLLM, SageMaker, Hugging Face, Ollama, OpenAI-compatible) behind a single consistent API, with full MCP support, multimodal file processing, RAG pipelines, observability, and a workflow engine.

---

## Critical Rules

These are non-negotiable. Violating them breaks the build or introduces bugs.

1. **Dynamic imports only in registry** — All providers must use dynamic imports inside factory functions in `providerRegistry.ts`. Static imports create circular dependencies.
2. **Types in canonical location** — All type definitions go in `src/lib/types/`. Never create type files inside feature subdirectories.
3. **Gemini tools + JSON schema are mutually exclusive** — Google AI Studio and Vertex AI cannot use tools and `structuredOutput` with a JSON schema simultaneously. It's an API limitation. Design workflows to use one or the other.
4. **CLI ≠ SDK** — CLI can use manual MCP connections; the SDK cannot. Keep concerns separate.
5. **Backward compatibility** — Public SDK API must not break existing callers.
6. **`formatProviderError` must return, never throw** — Any provider error formatter must return the error object, not throw it.

---

## Architecture

### Pattern: Factory + Registry

Every extensible system (providers, processors, chunkers, rerankers) follows the same pattern:

```
Factory  →  creates instances
Registry →  holds factory functions (via dynamic import)
```

- `ProviderFactory` + `ProviderRegistry` — AI providers
- `ProcessorRegistry` — file/multimodal processors
- `ChunkerFactory` + `ChunkerRegistry` — RAG chunking strategies
- `RerankerFactory` + `RerankerRegistry` — RAG rerankers

### Directory Map

```
src/
├── lib/
│   ├── neurolink.ts          # Main SDK entry point
│   ├── providers/            # 13 AI provider implementations
│   ├── factories/            # ProviderFactory + ProviderRegistry
│   ├── core/                 # BaseProvider, constants, infrastructure
│   ├── adapters/             # Provider-specific content adapters (image, TTS)
│   ├── utils/                # MessageBuilder, FileDetector, transformations
│   ├── types/                # ALL type definitions (28+ files)
│   ├── mcp/                  # MCPToolRegistry, client factory, HTTP transport
│   ├── memory/               # Redis + in-memory conversation memory
│   ├── context/              # Context compaction, budget checking
│   ├── processors/           # File processors (17+ types)
│   ├── rag/                  # Chunkers, hybrid search, rerankers, pipeline
│   ├── evaluation/           # RAGAS-based evaluator (no unit tests yet)
│   ├── telemetry/            # OpenTelemetry + Langfuse observability
│   ├── workflow/             # Workflow engine with HITL and checkpointing
│   ├── server/               # Hono/Express/Fastify/Koa adapters
│   ├── config/               # Configuration management
│   └── models/               # Model definitions per provider
├── cli/
│   ├── index.ts              # CLI entry point
│   ├── factories/            # CommandFactory (yargs)
│   ├── commands/             # Individual command implementations
│   └── loop/                 # Interactive REPL session
└── test/
    ├── suites/               # Feature test suites
    └── integration/          # Real-provider integration tests
```

### Message Flow

```
User input (text + files)
  → MessageBuilder (src/lib/utils/messageBuilder.ts)
  → FileDetector detects MIME types
  → ProcessorRegistry selects processor per file
  → ProviderImageAdapter formats for target provider
  → Provider sends to AI API
```

### Context Compaction Pipeline

`BudgetChecker` fires before every LLM call. If context exceeds 80% of the model window, `ContextCompactor` runs 4 stages:

1. Tool output pruning (protect recent 40K tokens)
2. File read deduplication
3. LLM summarization (9-section structured summary)
4. Sliding window truncation

### MCP Transport Protocols

| Transport   | Config key        | Use case                    |
| ----------- | ----------------- | --------------------------- |
| `stdio`     | `command`, `args` | Local server via subprocess |
| `http`      | `url`, `headers`  | Remote HTTP/Streamable HTTP |
| `sse`       | `url`, `headers`  | Server-Sent Events          |
| `websocket` | `url`, `headers`  | WebSocket connection        |

---

## Key Files

| File                                               | Purpose                                                        |
| -------------------------------------------------- | -------------------------------------------------------------- |
| `src/lib/neurolink.ts`                             | Main SDK class — orchestrates everything                       |
| `src/lib/factories/providerRegistry.ts`            | Provider registration (use dynamic imports here)               |
| `src/lib/core/baseProvider.ts`                     | Base class all providers extend; central `stream()` tool merge |
| `src/lib/utils/messageBuilder.ts`                  | Constructs messages; handles all file types                    |
| `src/lib/adapters/providerImageAdapter.ts`         | Per-provider multimodal formatting + vision capability map     |
| `src/lib/mcp/toolRegistry.ts`                      | Tool management + MCP server registry                          |
| `src/lib/mcp/mcpClientFactory.ts`                  | Creates MCP clients for all transport types                    |
| `src/lib/processors/registry/ProcessorRegistry.ts` | Selects file processor by MIME type + priority                 |
| `src/lib/types/index.ts`                           | Main type exports (start here for any type lookup)             |
| `src/lib/types/providers.ts`                       | `AIProvider` interface, `AIProviderName` enum                  |
| `src/lib/types/mcpTypes.ts`                        | `MCPTransportType` and MCP config types                        |
| `src/lib/constants/contextWindows.ts`              | Per-provider, per-model context window sizes                   |
| `src/lib/context/contextCompactor.ts`              | Multi-stage context reduction orchestrator                     |
| `src/lib/context/budgetChecker.ts`                 | Pre-call budget validation                                     |
| `src/lib/rag/ragIntegration.ts`                    | `prepareRAGTool()` — auto RAG setup for generate/stream        |
| `src/cli/factories/commandFactory.ts`              | All CLI command options and flag definitions                   |
| `src/lib/server/routes/agentRoutes.ts`             | HTTP server routes including `/api/agent/embed`                |

---

## Development Commands

```bash
# Build
pnpm run build            # Full SDK + CLI build
pnpm run build:cli        # CLI only (faster iteration)
pnpm run build:complete   # Build + validation

# Type checking
pnpm run check            # Type check
pnpm run check:watch      # Watch mode

# Quality
pnpm run lint             # Check lint + format
pnpm run format           # Auto-format
pnpm run check:all        # All quality checks

# Testing
pnpm test                 # All tests (once)
pnpm run test:watch       # Watch mode
pnpm run test:coverage    # With coverage
pnpm run test:providers   # Provider unit tests only
pnpm run test:cli         # CLI integration tests only
pnpm run test:integration # Integration tests only
pnpm run test:e2e         # End-to-end
pnpm run test:ci          # CI mode (coverage + reporters)

# Run a single test file
vitest run test/suites/tool-discovery.test.ts

# Environment
pnpm run env:validate     # Validate .env setup
pnpm run env:setup        # Interactive setup

# CLI smoke test
pnpm run build:cli && pnpm run cli <command>
```

**Workflow:** edit → `pnpm run check` → `pnpm run lint` → `pnpm test` → `pnpm run build`

---

## How-To Guides

### Adding a New Provider

1. Create `src/lib/providers/yourProvider.ts` — extend `BaseProvider`
2. Add name to `AIProviderName` enum in `src/lib/types/providers.ts`
3. Add model constants to `src/lib/models/`
4. Register in `ProviderRegistry.registerAllProviders()` using a dynamic import:

   ```typescript
   ProviderFactory.registerProvider(
     AIProviderName.YOUR_PROVIDER,
     async (modelName?, _providerName?, sdk?) => {
       const { YourProvider } = await import("../providers/yourProvider.js");
       return new YourProvider(modelName, sdk as NeuroLink | undefined);
     },
     YourModels.DEFAULT,
     ["alias1", "alias2"],
   );
   ```

5. If multimodal: add vision capabilities to `ProviderImageAdapter.VISION_CAPABILITIES`
6. Add to CLI provider choices in `src/cli/factories/commandFactory.ts`
7. Add tests in `test/suites/` and `test/integration/`

### Adding a New File Processor

1. Create processor in the appropriate category under `src/lib/processors/`:
   - `document/` — Excel, Word, RTF, OpenDocument
   - `data/` — JSON, YAML, XML
   - `markup/` — HTML, SVG, Markdown, Text
   - `code/` — source code, config files
   - `media/` — video, audio
   - `archive/` — zip, tar, gz
2. Extend `BaseFileProcessor` and implement `canProcess()`, `process()`, `getInfo()`
3. Register in `ProcessorRegistry` with a priority (lower number = higher priority)
4. Add MIME type mappings in `src/lib/processors/config/mimeTypes.ts`
5. Add tests in `test/file-processor-test-suite.ts`

### Modifying Message Building

1. Core logic: `src/lib/utils/messageBuilder.ts`
2. Provider formatting: `src/lib/adapters/` (add provider-specific adapter if needed)
3. Type changes: `src/lib/types/conversation.ts`
4. Ensure backward compatibility — existing message formats must still work

### Working with Embeddings

Four providers support embeddings natively: OpenAI, Google AI Studio, Google Vertex, Amazon Bedrock. All expose `embed()` / `embedMany()` on the provider interface. Unsupported providers throw descriptive errors.

Server endpoints: `POST /api/agent/embed` and `POST /api/agent/embed-many` in `src/lib/server/routes/agentRoutes.ts`.

### RAG Integration

**Simple path** — pass `rag` config directly to `generate()` or `stream()`:

```typescript
const result = await neurolink.generate({
  prompt: "What are the key features?",
  rag: {
    files: ["./docs/guide.md", "./docs/api.md"],
    strategy: "markdown", // auto-detected from extension if omitted
    chunkSize: 512, // default: 1000
    topK: 5, // default: 5
  },
});
```

CLI equivalent: `neurolink generate "query" --rag-files ./docs/guide.md --rag-strategy markdown`

NeuroLink creates a `search_knowledge_base` tool the model can call. For full control (custom vector stores, embeddings), use `createVectorQueryTool` from `src/lib/rag/retrieval/vectorQueryTool.ts` directly.

**Chunking strategies:** `character`, `recursive`, `sentence`, `token`, `markdown`, `html`, `json`, `latex`, `semantic`, `semantic-markdown`

**Rerankers:** `simple` (TF-IDF, no LLM), `llm`, `batch`, `cross-encoder` (stub), `cohere` (stub)

### Observability (Langfuse + OTEL)

NeuroLink initializes its own `TracerProvider` by default. If your app already has one, set `useExternalTracerProvider: true` to avoid duplicate registration errors, then add NeuroLink's span processors via `getSpanProcessors()` to your OTEL SDK setup.

Use `setLangfuseContext({ userId, sessionId, conversationId, ... }, callback)` to attach context to traces. Trace names default to `userId:operationName`; customize with `traceNameFormat`.

Key exports: `getSpanProcessors`, `setLangfuseContext`, `getLangfuseContext`, `getTracer`, `createContextEnricher`, `isUsingExternalTracerProvider`.

### Thinking Level

Supported by Anthropic Claude, Gemini 2.5+, Gemini 3:

```typescript
await neurolink.generate({ prompt: "...", thinkingLevel: "high" });
// CLI: neurolink generate "..." --thinking-level high
```

Levels: `minimal` | `low` | `medium` (default) | `high`

### Per-Request Credentials

Pass provider credentials at instance level or per-call. Per-call wins over instance, instance wins over env vars.

```typescript
// Instance-level default
const nl = new NeuroLink({
  credentials: { openai: { apiKey: "sk-..." } },
});

// Per-call override
await nl.generate({
  input: { text: "hello" },
  provider: "openai",
  credentials: { openai: { apiKey: "sk-user-key" } },
});
```

Credentials flow through the factory chain (`neurolink.ts` → `core/factory.ts` → `providerFactory.ts` → `providerRegistry.ts` → provider constructor). Each provider's constructor accepts a provider-scoped slice (e.g. `{ apiKey }` for OpenAI, `{ accessKeyId, secretAccessKey }` for Bedrock, `{ projectId, serviceAccountKey }` for Vertex).

CLI-only usage still relies on env vars — credentials field is excluded from `textGenerationOptionsSchema` to avoid shell-history leaks.

See `docs/features/per-request-credentials.md` for the full provider reference.

---

## Common Patterns

### Error Handling

- Use `ErrorFactory` for typed errors
- Wrap async calls with `withTimeout` utility
- `formatProviderError` must **return** errors, never throw

### Tool Transformations

- `transformToolExecutions()` — convert tool results for providers
- `transformAvailableTools()` — format tools for AI model calls
- `transformParamsForLogging()` — safely strip secrets before logging

### Memory

- Development: in-memory store
- Production: Redis (set `REDIS_URL`)
- Long conversations auto-compact via `SummarizationEngine` + `BudgetChecker`

### Streaming Tool Injection

`BaseProvider.stream()` merges base tools (MCP/built-in) with user-provided tools before calling provider-specific `executeStream()`. Individual providers use `options.tools || await this.getAllTools()` as fallback. This is the canonical pattern — do not bypass it.

### Logger Guard

Always wrap expensive serialization with `logger.shouldLog("debug")` before calling it.
