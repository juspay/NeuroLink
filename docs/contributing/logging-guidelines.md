# Logging Guidelines

This document provides standardized logging conventions for NeuroLink. Following these guidelines ensures consistent, maintainable, and secure logging across all providers and components.

## Overview

NeuroLink uses a unified logging utility (`src/lib/utils/logger.ts`) that provides:

- Multiple log levels (debug, info, warn, error)
- Structured data support for complex objects
- Log history retention with configurable limits
- Conditional logging based on environment settings

## Log Levels

### DEBUG

Use for routine operations, request details, and internal state changes. Debug logs are only visible when `--debug` flag is used or `NEUROLINK_DEBUG=true` is set.

**When to use:**

- Request/response construction details
- API call parameters and configurations
- Internal state changes and transitions
- Parser processing steps
- Capability detection operations

**Examples:**

```typescript
// Provider initialization
logger.debug("HuggingFaceProvider initialized", {
  modelName: this.modelName,
  endpoint: this.endpoint,
});

// Request details
logger.debug("SageMaker doGenerate called", {
  messageCount: messages.length,
  hasTools: !!tools,
});

// State changes
logger.debug("Concurrency adjusted", {
  previous: oldConcurrency,
  current: newConcurrency,
});
```

### INFO

Use for significant events that are notable but not problematic. These logs help trace the main flow of operations.

**When to use:**

- Generation started/completed milestones
- Tool calls executed successfully
- Configuration changes applied
- Provider fallback decisions
- File processing completions

**Examples:**

```typescript
// Operation completion
logger.info("Generation complete", {
  provider: this.providerName,
  tokensUsed: tokens,
});

// Significant events
logger.info("Creating streaming response", {
  endpointName: this.endpoint,
  modelType: detectedType,
});

// Configuration applied
logger.info("Enabled tools for MCP integration");
```

### WARN

Use for recoverable issues, retry attempts, and deprecated features. These indicate potential problems that don't prevent operation.

**When to use:**

- Retry attempts after failures
- Fallback behavior triggered
- Deprecated feature usage
- Parsing failures with recovery
- Rate limiting applied

**Examples:**

```typescript
// Retry/fallback
logger.warn("Streaming failed, falling back to non-streaming", {
  error: error.message,
  endpoint: this.endpoint,
});

// Recoverable issues
logger.warn("Failed to parse JSON in streaming response", {
  rawContent: content.substring(0, 100),
});

// Reduced capabilities
logger.warn("Reduced concurrency due to error", {
  previousConcurrency: prev,
  newConcurrency: current,
});
```

### ERROR

Use for failures and exceptions that prevent successful completion. These require attention and may need intervention.

**When to use:**

- API call failures
- Invalid configuration that prevents operation
- Unhandled exceptions
- Critical system errors

**Examples:**

```typescript
// API failures
logger.error("SageMaker doGenerate failed", {
  error: error.message,
  endpoint: this.endpoint,
});

// Invalid configuration
logger.error("Route validation failed", {
  route: routeName,
  reason: validationError,
});

// Critical errors
logger.error("Redis connection retries exhausted");
```

## Format Standards

### ✅ Good: Structured Logging

Always use structured logging with an object for additional context:

```typescript
logger.info("Generation complete", {
  provider: this.providerName,
  tokensUsed: tokens,
  duration: endTime - startTime,
});

logger.error("API request failed", {
  provider: this.providerName,
  statusCode: response.status,
  error: error.message,
});

logger.debug("Request parameters", {
  model: this.modelName,
  temperature: options.temperature,
  maxTokens: options.maxTokens,
});
```

### ❌ Bad: String Interpolation

Avoid string interpolation for data that should be structured:

```typescript
// ❌ Bad - loses structure and makes parsing difficult
logger.info(`Complete: ${tokens} tokens for ${provider}`);

// ❌ Bad - harder to filter and analyze
logger.error(`Failed with status ${status}: ${message}`);

// ❌ Bad - mixes concerns
logger.debug(`Request: model=${model}, temp=${temp}`);
```

### Message Conventions

- **Start with a clear action or status**: "Generation complete", "Request failed", "Retry attempt"
- **Use consistent prefixes for components**: `[CSV]`, `[PDF]`, `[FileDetector]`
- **Keep messages concise**: Put details in the data object
- **Use present or past tense consistently**: "Creating response" or "Response created"

```typescript
// Good: Clear component prefix and structured data
logger.info("[CSV] ✅ Processed", {
  filename: file.name,
  rows: result.rowCount,
});

// Good: Concise message with details in object
logger.debug("Streaming chunk received", {
  chunkSize: chunk.length,
  totalReceived: totalBytes,
});
```

## Sensitive Data

### NEVER Log

Protect user privacy and security by never logging:

- **API keys and secrets**
- **Authentication tokens**
- **User credentials**
- **Personal identifiable information (PII)**
- **Full request/response bodies with sensitive content**

### Use Parameter Transformation

When logging request parameters, use the `transformParamsForLogging` utility to sanitize sensitive fields:

```typescript
import { transformParamsForLogging } from "../utils/transformationUtils.js";

// Automatically sanitizes API keys and sensitive data
logger.debug("Request parameters", transformParamsForLogging(params));
```

### Truncate Large Data

For large content that needs logging for debugging:

```typescript
// Truncate large content
logger.debug("Response received", {
  contentPreview: content.substring(0, 100) + "...",
  contentLength: content.length,
});

// Summarize arrays
logger.debug("Processing messages", {
  messageCount: messages.length,
  firstMessageType: messages[0]?.role,
});
```

## Provider-Specific Guidelines

When implementing logging in providers:

1. **Initialization**: Log at DEBUG with model name and configuration
2. **Request start**: Log at DEBUG with request parameters (sanitized)
3. **Request completion**: Log at INFO for successful generation
4. **Errors**: Log at ERROR with error details and context
5. **Fallbacks**: Log at WARN when falling back to alternative methods

```typescript
class ExampleProvider {
  constructor(modelName: string) {
    logger.debug("ExampleProvider initialized", {
      modelName,
      version: this.version,
    });
  }

  async generate(options: GenerateOptions) {
    logger.debug("Generate called", {
      inputLength: options.input.text.length,
      temperature: options.temperature,
    });

    try {
      const result = await this.callAPI(options);
      logger.info("Generation complete", {
        provider: this.providerName,
        tokensUsed: result.usage?.totalTokens,
      });
      return result;
    } catch (error) {
      logger.error("Generation failed", {
        provider: this.providerName,
        error: error.message,
      });
      throw error;
    }
  }
}
```

## Testing Logging

When writing tests that verify logging behavior:

```typescript
import { logger } from "../utils/logger.js";
import { vi } from "vitest";

describe("Provider logging", () => {
  beforeEach(() => {
    vi.spyOn(logger, "debug");
    vi.spyOn(logger, "info");
    vi.spyOn(logger, "error");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should log generation completion at INFO level", async () => {
    await provider.generate({ input: { text: "test" } });

    expect(logger.info).toHaveBeenCalledWith(
      "Generation complete",
      expect.objectContaining({
        provider: expect.any(String),
      }),
    );
  });
});
```

## Environment Configuration

### Log Level Control

Set the minimum log level using environment variables:

```bash
# Show all logs including debug
NEUROLINK_LOG_LEVEL=debug

# Show only warnings and errors
NEUROLINK_LOG_LEVEL=warn

# Show only errors
NEUROLINK_LOG_LEVEL=error
```

### Debug Mode

Enable debug mode for verbose logging:

```bash
# Via environment variable
NEUROLINK_DEBUG=true

# Via CLI flag
neurolink generate "prompt" --debug
```

## Quick Reference

| Level | Use Case                             | Example                             |
| ----- | ------------------------------------ | ----------------------------------- |
| DEBUG | Routine operations, internal details | Request construction, state changes |
| INFO  | Significant events, milestones       | Generation complete, tool executed  |
| WARN  | Recoverable issues, fallbacks        | Retry attempt, deprecated feature   |
| ERROR | Failures, exceptions                 | API error, invalid configuration    |

## Checklist for Contributors

Before submitting code with logging:

- [ ] Used appropriate log level for each message
- [ ] Used structured logging (object as second parameter)
- [ ] No sensitive data in log messages
- [ ] Large data is truncated or summarized
- [ ] Messages are clear and actionable
- [ ] Component prefixes are consistent with existing code
