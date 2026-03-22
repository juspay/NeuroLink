# Streaming Architecture Refactor — Extend Existing Patterns

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the streaming architecture to extend existing `StreamResult` and provider patterns instead of maintaining a parallel event system. Fix providers to pass through AI SDK rich data (usage, toolCalls, finishReason, reasoning) that is currently discarded. Keep valuable utilities (backpressure, error recovery, client adapters) and orchestration (agent network, workflow streaming) but make them work with `StreamResult` directly.

**Architecture:** Extend `StreamResult` type with `fullStream` field for raw AI SDK stream access. Add a shared `buildEnhancedStreamResult()` helper in `BaseProvider` that all 12+ providers use. Refactor utility modules to work on `StreamResult` and `AsyncIterable<T>` instead of `MastraModelOutput`. Remove the parallel event system (`MastraModelOutput`, `StreamEventEmitter`, 24 custom event types). Agent network and workflow streaming return `StreamResult`.

**Tech Stack:** TypeScript, Vercel AI SDK (`streamText`), Vitest, custom continuous test suites (`npx tsx`)

---

## Wave 1 — Independent Tasks (All Parallel)

### Task 1: Extend StreamResult Type + BaseProvider Helper

**Files:**

- Modify: `src/lib/types/streamTypes.ts:485-576` — StreamResult type
- Modify: `src/lib/core/baseProvider.ts:157-296` — add helper method
- Create: `test/continuous-test-suite-streaming-types.ts`

**What to do:**

1. In `StreamResult` type, add these fields:

   ```typescript
   // Raw AI SDK typed stream (tool calls, reasoning, steps, etc.)
   fullStream?: AsyncIterable<Record<string, unknown>>;
   // Reasoning/thinking content (resolves after stream completion)
   reasoning?: string | Promise<string>;
   ```

2. Change existing fields to also accept Promises (follows existing `analytics?: AnalyticsData | Promise<AnalyticsData>` pattern):

   ```typescript
   usage?: TokenUsage | Promise<TokenUsage>;
   finishReason?: string | Promise<string>;
   toolCalls?: ToolCall[] | Promise<ToolCall[]>;
   toolResults?: ToolResult[] | Promise<ToolResult[]>;
   ```

3. In `BaseProvider`, add a protected helper method `buildEnhancedStreamResult()` that takes the AI SDK `streamText` result + stream options and builds a complete `StreamResult`:

   ```typescript
   protected buildEnhancedStreamResult(
     aiResult: ReturnType<typeof streamText>,
     textStream: AsyncIterable<{ content: string }>,
     options: StreamOptions,
     extra?: Partial<StreamResult>,
   ): StreamResult {
     return {
       stream: textStream,
       fullStream: aiResult.fullStream,
       provider: this.providerName,
       model: options.model || this.modelName,
       usage: aiResult.usage,
       finishReason: aiResult.finishReason,
       toolCalls: aiResult.toolCalls,
       toolResults: aiResult.toolResults,
       ...extra,
     };
   }
   ```

4. Write continuous test suite verifying:
   - StreamResult type accepts all new fields
   - `fullStream` is iterable
   - Promise-based fields resolve correctly
   - Backward compat: `stream` field still works as `AsyncIterable<{ content: string }>`
   - Helper builds correct StreamResult shape

---

### Task 3: Refactor Backpressure Utilities

**Files:**

- Modify: `src/lib/streaming/backpressure.ts`
- Create: `test/continuous-test-suite-streaming-backpressure.ts`

**What to do:**

1. Remove all imports of `StreamEventPayload`, `MastraModelOutput`, or any custom event types
2. Ensure `BackpressureController<T>` stays fully generic (it already is, just remove type-specific references)
3. `withBackpressure<T>(stream: AsyncIterable<T>, config)` must work on any `AsyncIterable<T>`
4. Keep: `BackpressureController`, `withBackpressure`, `bufferedStream`, `rateLimitedStream`, `chunkedStream`, `AdaptiveRateController`, `createPressureMonitor`
5. Remove any references to the custom event system

**Continuous test suite must verify:**

- `BackpressureController` push/pull with high/low watermarks
- Overflow strategies: `drop-oldest`, `drop-newest`, `error`
- `withBackpressure` wraps any `AsyncIterable<T>` correctly
- `bufferedStream` batches by count and time
- `rateLimitedStream` enforces rate limits
- `chunkedStream` batches correctly
- `AdaptiveRateController` adjusts rate based on consumer latency
- `createPressureMonitor` fires warning/critical callbacks
- All functions work with plain `AsyncIterable<{ content: string }>` (StreamResult.stream shape)

---

### Task 4: Refactor Error Recovery

**Files:**

- Modify: `src/lib/streaming/errorRecovery.ts`
- Create: `test/continuous-test-suite-streaming-recovery.ts`

**What to do:**

1. Remove all imports of `StreamEventPayload`, `ErrorPayload`, `MastraModelOutput`, or any custom event types
2. Keep the typed error hierarchy: `StreamError`, `RateLimitError`, `NetworkError`, `TimeoutError`, `ProviderError`, `ValidationError`, `ContentFilterError`
3. `withRetry<T>(fn, config)` stays generic
4. `withStreamRetry(streamFactory: () => Promise<StreamResult>, config)` — takes and returns `StreamResult`
5. `withStreamRecovery(primaryFactory, fallbackFactories[], config)` — takes `() => Promise<StreamResult>` factories, returns `StreamResult`
6. `withProviderFallback<T>(fn, fallbacks[])` stays generic
7. Remove any `.toEventPayload()` methods from error classes
8. Keep: `categorizeError()`, `isRetriableError()`, `calculateRetryDelay()`, retry configs (`DEFAULT_RETRY_CONFIG`, `AGGRESSIVE_RETRY_CONFIG`, `CONSERVATIVE_RETRY_CONFIG`)

**Continuous test suite must verify:**

- Each error type constructs correctly with code, category, retriable flag
- `RateLimitError` respects `retryAfter`
- `categorizeError()` categorizes known error patterns
- `isRetriableError()` returns true for retriable, false for non-retriable
- `calculateRetryDelay()` applies exponential backoff with jitter
- `withRetry` retries retriable errors up to maxRetries, skips non-retriable
- `withStreamRetry` re-creates stream on failure, returns valid StreamResult
- `withStreamRecovery` falls back through provider chain in order
- Retry configs have correct values

---

### Task 5: Refactor Client Integration + SSE

**Files:**

- Modify: `src/lib/streaming/clientIntegration.ts`
- Modify: `src/lib/streaming/dataStreamProtocol.ts`
- Create: `test/continuous-test-suite-streaming-client.ts`

**What to do:**

**clientIntegration.ts:**

1. Remove all imports of `MastraModelOutput`, `StreamEventPayload`, or custom event types
2. `consumeStream(streamResult: StreamResult, callbacks)` — takes `StreamResult`, iterates `stream` field, fires `onTextDelta(content)`, `onComplete(fullText)`, `onError(error)` callbacks
3. `toNodeReadable(streamResult: StreamResult)` — creates Node.js `Readable` from `streamResult.stream`
4. `toWebReadable(streamResult: StreamResult)` — creates Web `ReadableStream` from `streamResult.stream`
5. Keep generic stream operators: `withTimeout<T>(stream, ms)`, `bufferStream<T>(stream, size, flushMs)`, `debounceStream<T>(stream, delayMs)`, `throttleStream<T>(stream, eventsPerSec)`, `teeStream<T>(stream, count)`, `mergeStreams<T>(streams[])`
6. `consumeStreamWithState(streamResult, updateState, signal)` — React-compatible consumption
7. Remove `fetchStream` (it was MastraModelOutput-based)

**dataStreamProtocol.ts:**

1. Remove custom event translation functions (`toAISDKEvent`, `fromAISDKEvent` based on custom events)
2. Keep SSE utilities: `encodeSSE(data)`, `parseSSELine(line)`, `encodeSSEDone()`
3. `toSSEResponse(streamResult: StreamResult, options?)` — takes `StreamResult`, returns HTTP `Response` with `text/event-stream` content type. Iterates `streamResult.stream`, encodes each chunk as SSE.
4. `parseSSEResponse(response: Response)` — parses SSE response back to `AsyncIterable<{ content: string }>`
5. Keep: `createDataPart`, `createStatusPart`, `createProgressPart`, `createMetadataPart` for injecting custom data into SSE streams

**Continuous test suite must verify:**

- `consumeStream` fires onTextDelta for each chunk, onComplete at end
- `consumeStream` fires onError on stream error
- `toNodeReadable` creates valid Node Readable that emits data events
- `toWebReadable` creates valid Web ReadableStream
- `withTimeout` throws on slow stream, passes through fast stream
- `bufferStream` batches correctly
- `teeStream` creates independent copies
- `mergeStreams` interleaves multiple streams
- `encodeSSE` produces valid SSE format (`data: ...\n\n`)
- `parseSSELine` parses SSE lines back to objects
- `toSSEResponse` creates Response with correct headers and body
- `parseSSEResponse` round-trips with `toSSEResponse`

---

## Wave 2 — Depends on Task 1 (All Parallel After Task 1)

### Task 2: Fix All Provider executeStream Methods

**Files:**

- Modify: all provider files in `src/lib/providers/` (12+ files)
- Create: `test/continuous-test-suite-streaming-providers.ts`

**What to do:**

For each provider's `executeStream()` method:

1. After calling `streamText()`, keep the existing `transformedStream()` generator for backward compat `stream` field
2. Use `this.buildEnhancedStreamResult()` (from Task 1) to build the return value
3. Pass through: `result.fullStream`, `result.usage`, `result.finishReason`, `result.toolCalls`, `result.toolResults`
4. Keep existing analytics, metadata, OTEL span handling

Example for OpenAI (lines 669-678), change from:

```typescript
return {
  stream: transformedStream(),
  provider: this.providerName,
  model: this.modelName,
  analytics: analyticsPromise,
  metadata: { startTime, streamId: `openai-${Date.now()}` },
};
```

to:

```typescript
return this.buildEnhancedStreamResult(result, transformedStream(), options, {
  analytics: analyticsPromise,
  metadata: { startTime, streamId: `openai-${Date.now()}` },
});
```

Apply same pattern to: `anthropic.ts`, `googleAiStudio.ts`, `googleVertex.ts`, `amazonBedrock.ts`, `azureOpenai.ts`, `mistral.ts`, `litellm.ts`, `amazonSagemaker.ts`, `ollama.ts`, `huggingFace.ts`, `openaiCompatible.ts`, `openRouter.ts`

**Continuous test suite must verify (per provider, mocked):**

- `executeStream()` returns StreamResult with `fullStream` populated
- `usage` field is a Promise that resolves to valid TokenUsage
- `finishReason` field is populated
- `toolCalls` field is populated (when tools used)
- Legacy `stream` field still yields `{ content: string }` chunks
- Provider and model fields are set

---

### Task 6: Refactor Agent Network Streaming

**Files:**

- Modify: `src/lib/streaming/agentNetworkStream.ts`
- Create: `test/continuous-test-suite-streaming-network.ts`

**What to do:**

1. Replace all `MastraModelOutput` references with `StreamResult`
2. Agent factories become `() => Promise<StreamResult>` instead of `() => MastraModelOutput`
3. Each orchestration mode (sequential, parallel, hierarchical, round-robin, voting) takes `StreamResult` factories and returns `StreamResult`
4. Agent-specific events (agent:start, agent:handoff, etc.) are emitted as objects in the combined output stream, mixed with text content chunks
5. The returned `StreamResult.stream` yields both `{ content: string }` chunks and `{ type: "agent:event", ... }` chunks (discriminated by `type` field — this already exists in the StreamResult stream union)
6. Remove imports of custom event types

**Continuous test suite must verify:**

- Sequential mode: agents run in order, output flows forward
- Parallel mode: agents run concurrently, results interleaved
- Hierarchical mode: orchestrator routes to workers
- Round-robin mode: agents take turns
- Voting mode: aggregation selects winner
- All modes return valid `StreamResult`
- Agent events appear in stream alongside content

---

### Task 7: Refactor Workflow Streaming

**Files:**

- Modify: `src/lib/streaming/workflowStream.ts`
- Create: `test/continuous-test-suite-streaming-workflow.ts`

**What to do:**

1. Replace all `MastraModelOutput` references with `StreamResult`
2. Each AI step produces a `StreamResult` via an executor function
3. Workflow events emitted as typed objects in the stream
4. `WorkflowBuilder` fluent API stays but returns configs that produce `StreamResult`
5. Template interpolation (`{{varName}}`) stays
6. All 7 step types work: ai, tool, condition, transform, parallel, loop, wait
7. Remove imports of custom event types
8. **SECURITY NOTE:** Replace `new Function()` in `evaluateExpression` with a safe expression evaluator (simple property access + comparisons only)

**Continuous test suite must verify:**

- Each step type executes correctly
- Template interpolation resolves variables
- DAG traversal follows nextStep pointers
- Conditional branching works (ifTrue/ifFalse)
- Loop step respects maxIterations and breakCondition
- Parallel step runs sub-steps concurrently
- Returns valid StreamResult
- WorkflowBuilder creates valid definitions

---

## Wave 3 — After All Tasks Complete

### Task 8: Cleanup + Update Exports

**Files:**

- Delete: `src/lib/core/stream/MastraModelOutput.ts`
- Delete: `src/lib/core/stream/PartialObjectStreamHandler.ts`
- Delete: `src/lib/core/stream/StreamCompletionHooks.ts`
- Delete: `src/lib/core/stream/index.ts`
- Modify: `src/lib/streaming/index.ts` — remove MastraModelOutput, StreamEventEmitter exports; keep utility exports
- Modify: `src/lib/streaming/types.ts` — remove the 24 custom event types (keep only types needed by agent network/workflow events)
- Delete: `src/lib/streaming/streamOutput.ts` (MastraModelOutput)
- Delete: `src/lib/streaming/streamEventEmitter.ts` (StreamEventEmitter)
- Delete: `src/lib/types/streamEventTypes.ts` (duplicate types)
- Modify: `src/lib/index.ts` — remove core/stream exports, update streaming exports
- Modify: `src/lib/types/index.ts` — remove re-exports of deleted types
- Modify: `src/lib/neurolink.ts` — remove `fromLegacyStream` import and usage
- Modify: `src/lib/streaming/chunkTypes.ts` — keep only if chunk conversion utilities are used by other modules; otherwise delete

### Task 9: Master Integration Test Suite

**Files:**

- Rewrite: `test/continuous-test-suite-streaming.ts` — master test that imports and runs all streaming sub-suites
- Update: `test/streaming/*.test.ts` vitest files — update or remove tests for deleted classes

**What to verify:**

- Full round-trip: provider → StreamResult → utility functions → consumption
- Backpressure works on real StreamResult streams
- Error recovery with provider fallback produces valid StreamResult
- SSE encoding/decoding round-trips StreamResult
- Agent network orchestration end-to-end
- Workflow DAG execution end-to-end
- No broken imports across the codebase
- TypeScript compilation succeeds (`pnpm run check`)

---

## Parallel Execution Map

```
Wave 1 (all start immediately):
  Agent 1: Task 1 (Foundation)     ──┐
  Agent 3: Task 3 (Backpressure)     │ all parallel
  Agent 4: Task 4 (Error Recovery)   │
  Agent 5: Task 5 (Client+SSE)    ──┘

Wave 2 (after Agent 1 completes):
  Agent 2: Task 2 (Providers)      ──┐
  Agent 6: Task 6 (Agent Network)    │ all parallel
  Agent 7: Task 7 (Workflow)       ──┘

Wave 3 (after all complete):
  Agent 8: Task 8 (Cleanup)
  Agent 9: Task 9 (Integration Tests)
```
