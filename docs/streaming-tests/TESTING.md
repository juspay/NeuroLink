# Streaming Architecture Tests

This document provides instructions for running and understanding the NeuroLink streaming architecture integration tests.

## Overview

The streaming architecture tests validate the Mastra-style streaming implementation, including:

- **4 Mastra Streaming Patterns**:
  1. `MastraModelOutput` - Basic text/tool streaming
  2. `MastraWorkflowStream` - Workflow execution streaming
  3. `MastraAgentNetworkStream` - Multi-agent streaming
  4. `PartialObjectStreamer` - JSON streaming with auto-closing brackets

- **24 Event Types** - Discriminated union event system
- **Backpressure Handling** - High/low watermarks, overflow strategies
- **Stream Transformations** - Buffered, rate-limited, chunked streams
- **Error Recovery** - Retry patterns, provider fallback

## Prerequisites

### Required Environment

```bash
# Node.js 18+ required
node --version  # v18.0.0 or higher

# pnpm package manager
pnpm --version  # v8.0.0 or higher
```

### Install Dependencies

```bash
# From project root
pnpm install
```

### Required API Keys (for integration tests)

Create `.env` file or export environment variables:

```bash
# Required for integration tests with real providers
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_AI_STUDIO_API_KEY="AIza..."

# Optional providers
export MISTRAL_API_KEY="..."
export AZURE_OPENAI_API_KEY="..."
```

## Running Tests

### Unit Tests

Run streaming unit tests only:

```bash
# Run all streaming unit tests
pnpm vitest run test/streaming/*.test.ts

# Run specific test file
pnpm vitest run test/streaming/MastraModelOutput.test.ts
pnpm vitest run test/streaming/streamEventTypes.test.ts
pnpm vitest run test/streaming/PartialObjectStreamHandler.test.ts
pnpm vitest run test/streaming/StreamCompletionHooks.test.ts

# Run with watch mode
pnpm vitest test/streaming/*.test.ts
```

### Integration Tests

Run streaming integration tests:

```bash
# Run all streaming integration tests
pnpm vitest run test/streaming/integration/streaming.integration.test.ts

# Run with verbose output
pnpm vitest run test/streaming/integration/ --reporter=verbose

# Run specific test groups
pnpm vitest run test/streaming/integration/ -t "Event Emission"
pnpm vitest run test/streaming/integration/ -t "Backpressure"
pnpm vitest run test/streaming/integration/ -t "Error Recovery"
```

### All Tests

Run complete test suite:

```bash
# Run all tests
pnpm test

# Run all tests once (CI mode)
pnpm run test:run

# Run with coverage
pnpm run test:coverage
```

## Test Structure

```
test/streaming/
├── MastraModelOutput.test.ts         # Pattern 2: Output classes (579 lines)
├── streamEventTypes.test.ts          # Pattern 1: Event types (367 lines)
├── PartialObjectStreamHandler.test.ts # Pattern 3: JSON streaming (373 lines)
├── StreamCompletionHooks.test.ts     # Pattern 4: Completion hooks (523 lines)
└── integration/
    └── streaming.integration.test.ts  # Full integration tests (2581 lines)
```

## Test Coverage Summary

| Component                  | Tests    | Coverage                                       |
| -------------------------- | -------- | ---------------------------------------------- |
| Stream Event Types         | 25+      | Event discrimination, sequence ordering        |
| MastraModelOutput          | 30+      | Text/tool streams, callbacks, conversion       |
| PartialObjectStreamHandler | 20+      | JSON parsing, schema validation, path tracking |
| StreamCompletionHooks      | 25+      | Callbacks, priorities, checkpoints             |
| BackpressureController     | 15+      | Watermarks, overflow, rate control             |
| Error Recovery             | 15+      | Retry, fallback, recovery patterns             |
| **Total**                  | **130+** | Full streaming architecture                    |

## Test Fixtures

Test fixtures are located in `test/fixtures/streaming/`:

| File                          | Description                              |
| ----------------------------- | ---------------------------------------- |
| `stream-config.json`          | Provider and backpressure configurations |
| `event-types.json`            | Sample events for all 24 event types     |
| `backpressure-scenarios.json` | Backpressure test scenarios              |

### Using Fixtures in Tests

```typescript
import streamConfig from "../fixtures/streaming/stream-config.json";
import eventTypes from "../fixtures/streaming/event-types.json";
import backpressureScenarios from "../fixtures/streaming/backpressure-scenarios.json";

// Use provider config
const config = streamConfig.providerConfigs.openai;

// Use sample event
const textDelta = eventTypes.sampleEvents["text:delta"];

// Use backpressure scenario
const scenario = backpressureScenarios.scenarios.highWatermarkTrigger;
```

## Debugging Tests

### Verbose Output

```bash
# Enable verbose logging
DEBUG=neurolink:streaming* pnpm vitest run test/streaming/

# Show all console output
pnpm vitest run test/streaming/ --no-silent
```

### Single Test

```bash
# Run single test by name
pnpm vitest run test/streaming/ -t "should emit text:delta events"

# Run tests matching pattern
pnpm vitest run test/streaming/ -t "backpressure"
```

### Debug Mode

```bash
# Run in debug mode
pnpm vitest run test/streaming/ --inspect

# With VS Code debugger (add launch.json config)
```

## Common Issues

### Test Timeouts

```bash
# Increase timeout for slow tests
pnpm vitest run test/streaming/ --testTimeout=30000
```

### Memory Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm vitest run test/streaming/
```

### API Rate Limits

For integration tests with real providers, implement appropriate delays:

```typescript
// Add delay between API calls
await new Promise((r) => setTimeout(r, 1000));
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Streaming Tests
  run: pnpm vitest run test/streaming/ --reporter=github-actions
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Test Reports

```bash
# Generate JUnit XML report
pnpm vitest run test/streaming/ --reporter=junit --outputFile=streaming-tests.xml

# Generate HTML report
pnpm vitest run test/streaming/ --reporter=html
```

## Related Documentation

- [CONFIGURATION.md](./CONFIGURATION.md) - Streaming configuration options
- [VERIFICATION.md](./VERIFICATION.md) - Manual verification checklist
- [CLI-COVERAGE.md](./CLI-COVERAGE.md) - CLI coverage status
