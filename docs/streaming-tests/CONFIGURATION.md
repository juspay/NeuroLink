# Streaming Configuration Options

This document describes all configuration options available for the NeuroLink streaming architecture.

## StreamEventEmitter Configuration

The `StreamEventEmitter` transforms AI SDK streams into fine-grained event streams.

```typescript
interface StreamEventEmitterConfig {
  // Required
  provider: string; // Provider name (e.g., "openai", "anthropic")
  model: string; // Model name (e.g., "gpt-4o", "claude-3-opus")

  // Optional
  streamId?: string; // Unique stream identifier (auto-generated if not provided)
  includeAccumulated?: boolean; // Include accumulated text in text:delta events (default: false)
  emitReasoningEvents?: boolean; // Emit reasoning:* events for extended thinking (default: true)
  maxSteps?: number; // Maximum agentic steps (default: 10)
  emitProgressEvents?: boolean; // Emit progress events (default: false)
  progressInterval?: number; // Progress event interval in ms (default: 1000)
}
```

### Example

```typescript
import { StreamEventEmitter } from "@neurolink/streaming";

const emitter = new StreamEventEmitter({
  provider: "openai",
  model: "gpt-4o",
  includeAccumulated: true,
  emitReasoningEvents: true,
  maxSteps: 5,
});
```

## MastraModelOutput Configuration

The `MastraModelOutput` class provides typed access to stream results.

```typescript
interface MastraModelOutputConfig {
  // Required
  provider: string; // Provider name
  model: string; // Model name

  // Optional
  streamId?: string; // Unique stream identifier

  // Callbacks
  onTextDelta?: (delta: string, accumulated: string) => void;
  onToolExecution?: (toolName: string, result: unknown) => void;
  onMessageComplete?: (text: string, usage: TokenUsage) => void;
  onError?: (error: Error) => void;
}
```

### Example

```typescript
import { createMastraModelOutput } from "@neurolink/streaming";

const output = createMastraModelOutput(eventStream, {
  provider: "anthropic",
  model: "claude-3-opus",
  onTextDelta: (delta, accumulated) => {
    console.log("Delta:", delta);
  },
  onMessageComplete: (text, usage) => {
    console.log("Complete:", text, usage);
  },
});
```

## BackpressureController Configuration

The `BackpressureController` manages stream flow control.

```typescript
interface BackpressureConfig {
  // Buffer watermarks
  highWatermark?: number; // Pause threshold (default: 100)
  lowWatermark?: number; // Resume threshold (default: 25)
  maxBufferSize?: number; // Maximum buffer size (default: 1000)

  // Memory management
  maxMemoryBytes?: number; // Memory limit in bytes (default: 50MB)
  monitorMemory?: boolean; // Enable memory monitoring (default: true)

  // Overflow handling
  overflowStrategy?: "drop-oldest" | "drop-newest" | "error";

  // Callbacks
  onPressure?: (paused: boolean, bufferSize: number) => void;
  onDrop?: (dropped: number, reason: "overflow" | "memory") => void;
}
```

### Overflow Strategies

| Strategy      | Behavior                  | Use Case                                    |
| ------------- | ------------------------- | ------------------------------------------- |
| `drop-oldest` | FIFO eviction             | Real-time streams where recent data matters |
| `drop-newest` | Reject new events         | Ordered processing, sequence integrity      |
| `error`       | Throw BufferOverflowError | Critical streams, no data loss acceptable   |

### Example

```typescript
import { BackpressureController } from "@neurolink/streaming";

const controller = new BackpressureController({
  highWatermark: 50,
  lowWatermark: 10,
  maxBufferSize: 500,
  overflowStrategy: "drop-oldest",
  onPressure: (paused, size) => {
    console.log(`Backpressure: paused=${paused}, buffer=${size}`);
  },
  onDrop: (dropped, reason) => {
    console.warn(`Dropped ${dropped} events due to ${reason}`);
  },
});
```

## AdaptiveRateController Configuration

The `AdaptiveRateController` dynamically adjusts stream processing rate.

```typescript
interface AdaptiveRateConfig {
  initialRate?: number; // Initial events/second (default: 100)
  minRate?: number; // Minimum rate (default: 10)
  maxRate?: number; // Maximum rate (default: 1000)
  adjustmentFactor?: number; // Rate adjustment multiplier (default: 0.8)
  measurementWindow?: number; // Measurement window in ms (default: 1000)
  targetBufferUtilization?: number; // Target buffer fill % (default: 0.5)
}
```

### Example

```typescript
import { AdaptiveRateController } from "@neurolink/streaming";

const rateController = new AdaptiveRateController({
  initialRate: 100,
  minRate: 10,
  maxRate: 500,
  adjustmentFactor: 0.8,
  measurementWindow: 1000,
});
```

## StreamCompletionHooks Configuration

The `StreamCompletionHooks` class manages lifecycle callbacks.

```typescript
interface StreamHooksConfig {
  // Required
  streamId: string; // Stream identifier
  provider: string; // Provider name
  model: string; // Model name

  // Optional
  metadata?: Record<string, unknown>; // Custom metadata
  defaultPriority?: "critical" | "high" | "normal" | "low";
}
```

### Hook Priority Levels

| Priority   | Order | Use Case                |
| ---------- | ----- | ----------------------- |
| `critical` | 1st   | Error handlers, cleanup |
| `high`     | 2nd   | Metrics, logging        |
| `normal`   | 3rd   | Business logic          |
| `low`      | 4th   | Analytics, telemetry    |

### Example

```typescript
import { createStreamHooks } from "@neurolink/streaming";

const hooks = createStreamHooks({
  streamId: "stream-123",
  provider: "openai",
  model: "gpt-4o",
  metadata: { userId: "user-1", sessionId: "session-1" },
});

hooks.onStart(() => console.log("Stream started"), { priority: "high" });
hooks.onComplete((ctx) => console.log("Complete:", ctx.text));
hooks.onError((ctx) => console.error("Error:", ctx.error));
```

## PartialObjectStreamHandler Configuration

The `PartialObjectStreamHandler` handles incremental JSON parsing.

```typescript
interface PartialObjectHandlerConfig {
  // Schema validation
  schema?: JsonSchema; // JSON Schema for validation
  validateIncrementally?: boolean; // Validate each partial (default: false)

  // Callbacks
  onPartialUpdate?: (partial: unknown, path: string) => void;
  onValidationError?: (errors: string[], partial: unknown) => void;
  onParseError?: (error: Error, buffer: string) => void;
}
```

### JSON Schema Support

```typescript
interface JsonSchema {
  type: "object" | "array" | "string" | "number" | "boolean";
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}
```

### Example

```typescript
import { createPartialObjectHandlerWithSchema } from "@neurolink/streaming";

const handler = createPartialObjectHandlerWithSchema(
  {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      age: { type: "number", minimum: 0, maximum: 150 },
    },
    required: ["name", "age"],
  },
  {
    validateIncrementally: true,
    onValidationError: (errors) => {
      console.warn("Validation errors:", errors);
    },
  },
);
```

## Retry Configuration

Error recovery and retry configuration.

```typescript
interface RetryConfig {
  maxRetries?: number; // Maximum retry attempts (default: 3)
  initialDelay?: number; // Initial delay in ms (default: 1000)
  maxDelay?: number; // Maximum delay in ms (default: 30000)
  backoffMultiplier?: number; // Exponential backoff multiplier (default: 2)
  jitter?: boolean; // Add random jitter (default: true)
  retriableErrors?: string[]; // Error codes to retry
}
```

### Preset Configurations

```typescript
// Default - balanced retry
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

// Aggressive - more retries, shorter delays
const AGGRESSIVE_RETRY_CONFIG = {
  maxRetries: 5,
  initialDelay: 500,
  maxDelay: 15000,
  backoffMultiplier: 1.5,
  jitter: true,
};

// Conservative - fewer retries, longer delays
const CONSERVATIVE_RETRY_CONFIG = {
  maxRetries: 2,
  initialDelay: 2000,
  maxDelay: 60000,
  backoffMultiplier: 3,
  jitter: false,
};
```

### Example

```typescript
import { withStreamRetry } from "@neurolink/streaming";

const stream = withStreamRetry(() => createStream(), {
  maxRetries: 5,
  initialDelay: 500,
  backoffMultiplier: 2,
  retriableErrors: ["RATE_LIMIT", "NETWORK_ERROR", "TIMEOUT"],
});
```

## Provider Fallback Configuration

Configure fallback providers for resilience.

```typescript
interface FallbackConfig {
  providers: Array<{
    provider: string;
    model: string;
    priority?: number;
  }>;
  failoverDelay?: number; // Delay before trying next provider (default: 100)
  maxAttempts?: number; // Max attempts per provider (default: 1)
}
```

### Example

```typescript
import { withProviderFallback } from "@neurolink/streaming";

const stream = withProviderFallback(
  (provider, model) => createStreamForProvider(provider, model),
  {
    providers: [
      { provider: "openai", model: "gpt-4o", priority: 1 },
      { provider: "anthropic", model: "claude-3-opus", priority: 2 },
      { provider: "google", model: "gemini-2.5-flash", priority: 3 },
    ],
    failoverDelay: 100,
    maxAttempts: 2,
  },
);
```

## Stream Transformer Options

### bufferedStream

```typescript
interface BufferedStreamOptions {
  bufferSize: number; // Events to buffer before flush
  flushInterval?: number; // Max time before flush (ms)
  onFlush?: (events: StreamEvent[]) => void;
}
```

### rateLimitedStream

```typescript
interface RateLimitedStreamOptions {
  eventsPerSecond: number; // Rate limit
  burstLimit?: number; // Maximum burst size
}
```

### chunkedStream

```typescript
interface ChunkedStreamOptions {
  chunkSize: number; // Events per chunk
}
```

## Environment Variables

| Variable                          | Description         | Default |
| --------------------------------- | ------------------- | ------- |
| `NEUROLINK_STREAM_BUFFER_SIZE`    | Default buffer size | 1000    |
| `NEUROLINK_STREAM_HIGH_WATERMARK` | High watermark      | 100     |
| `NEUROLINK_STREAM_LOW_WATERMARK`  | Low watermark       | 25      |
| `NEUROLINK_STREAM_MAX_MEMORY_MB`  | Max memory in MB    | 50      |
| `NEUROLINK_STREAM_TIMEOUT_MS`     | Stream timeout      | 300000  |

## Related Documentation

- [TESTING.md](./TESTING.md) - How to run tests
- [VERIFICATION.md](./VERIFICATION.md) - Manual verification checklist
- [CLI-COVERAGE.md](./CLI-COVERAGE.md) - CLI coverage status
