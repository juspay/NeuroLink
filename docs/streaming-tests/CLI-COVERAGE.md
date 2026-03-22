# CLI Coverage for Streaming Architecture

This document describes the CLI coverage status for the streaming architecture feature.

## Overview

The streaming architecture is primarily an SDK feature that integrates with the existing NeuroLink CLI. The CLI inherits streaming capabilities from the base SDK implementation.

## CLI Commands with Streaming Support

### `neurolink generate` (with `--stream` flag)

The primary CLI command for streaming text generation.

```bash
# Basic streaming generation
neurolink generate "Hello, how are you?" --stream

# With specific provider
neurolink generate "Tell me a story" --provider openai --model gpt-4o --stream

# With tool calling
neurolink generate "What's the weather in NYC?" --provider openai --stream --tools weather

# With thinking level (Anthropic/Google)
neurolink generate "Solve this problem" --provider anthropic --thinking-level high --stream
```

| Feature                     | CLI Support | Notes                    |
| --------------------------- | ----------- | ------------------------ |
| Text streaming              | Yes         | `--stream` flag          |
| Tool streaming              | Yes         | With `--tools`           |
| Reasoning streaming         | Yes         | With `--thinking-level`  |
| Structured output streaming | Partial     | Schema via JSON file     |
| Progress display            | Yes         | Built-in spinner         |
| Error display               | Yes         | Formatted error messages |

### `neurolink loop` (Interactive Mode)

Interactive mode with streaming support.

```bash
# Start interactive loop with streaming
neurolink loop --provider openai --stream

# Commands in loop mode:
# /stream on|off - Toggle streaming
# /provider <name> - Switch provider
# /model <name> - Switch model
```

| Feature               | CLI Support | Notes                |
| --------------------- | ----------- | -------------------- |
| Interactive streaming | Yes         | Default in loop mode |
| Provider switching    | Yes         | `/provider` command  |
| Stream toggle         | Yes         | `/stream on\|off`    |
| Tool integration      | Yes         | With MCP tools       |

## Streaming Events in CLI

### Event Display Mapping

| Event Type        | CLI Display            |
| ----------------- | ---------------------- |
| `text:delta`      | Printed to stdout      |
| `text:end`        | Newline added          |
| `tool:call`       | "Calling tool: {name}" |
| `tool:result`     | Tool result formatted  |
| `reasoning:delta` | Dimmed/italic text     |
| `error`           | Red error message      |
| `progress`        | Spinner update         |

### Example Output

```
$ neurolink generate "What's the weather?" --stream --tools weather

[thinking] Let me check the weather for you...
[calling] weather({ city: "current_location" })
[result] { temp: 72, condition: "sunny" }

The current weather is 72°F and sunny. It's a beautiful day!

✓ Complete (1.2s, 150 tokens)
```

## CLI Options for Streaming

### Global Streaming Options

```bash
--stream              # Enable streaming mode
--no-stream           # Disable streaming (batch mode)
--stream-format       # Output format: text|json|events
--stream-buffer-size  # Buffer size for backpressure
```

### Provider-Specific Options

```bash
--thinking-level      # Thinking level: minimal|low|medium|high
--max-steps           # Maximum agentic steps
--timeout             # Stream timeout in seconds
```

## Test Coverage

### Unit Tests

The CLI streaming functionality is tested through the SDK tests:

| Test File                                      | Coverage     |
| ---------------------------------------------- | ------------ |
| `test/streaming/MastraModelOutput.test.ts`     | Output class |
| `test/streaming/streamEventTypes.test.ts`      | Event types  |
| `test/streaming/StreamCompletionHooks.test.ts` | Hooks        |

### Integration Tests

CLI-specific streaming tests:

```bash
# Run CLI streaming tests
pnpm vitest run test/cli/streaming.test.ts
```

| Scenario             | Covered |
| -------------------- | ------- |
| Basic text streaming | Yes     |
| Tool call streaming  | Yes     |
| Error handling       | Yes     |
| Provider fallback    | Partial |
| Interrupt handling   | Yes     |

## Manual CLI Verification

### Basic Streaming

```bash
# 1. Basic text stream
neurolink generate "Count from 1 to 10 slowly" --stream

# Expected: Numbers appear one by one
```

### Tool Streaming

```bash
# 2. Tool call stream
neurolink generate "Search for Node.js tutorials" --stream --tools websearch

# Expected: Tool call displayed, then results
```

### Error Handling

```bash
# 3. Error recovery
OPENAI_API_KEY=invalid neurolink generate "Hello" --stream

# Expected: Clear error message, retry suggestion
```

### Provider Switching

```bash
# 4. Provider fallback
neurolink generate "Hello" --stream --provider openai --fallback anthropic

# Expected: Falls back to Anthropic if OpenAI fails
```

## Limitations

### Current Limitations

1. **Structured Output Display**: JSON streaming shows raw deltas, not formatted objects
2. **Audio/Image Streaming**: Not displayed in CLI (base64 data only)
3. **Checkpoint/Resume**: Not exposed in CLI (SDK only)
4. **Backpressure Tuning**: Limited CLI options

### Planned Improvements

- [ ] Better structured output formatting
- [ ] Rich progress display with event counts
- [ ] Interactive checkpoint management
- [ ] Stream analytics display

## Configuration

### Environment Variables

```bash
# Streaming defaults
export NEUROLINK_STREAM_DEFAULT=true
export NEUROLINK_STREAM_FORMAT=text
export NEUROLINK_STREAM_TIMEOUT=300000
```

### Config File (`neurolink.config.json`)

```json
{
  "streaming": {
    "enabled": true,
    "format": "text",
    "showProgress": true,
    "showToolCalls": true,
    "showReasoning": false,
    "bufferSize": 1000
  }
}
```

## Related Documentation

- [TESTING.md](./TESTING.md) - How to run tests
- [CONFIGURATION.md](./CONFIGURATION.md) - Configuration options
- [VERIFICATION.md](./VERIFICATION.md) - Manual verification checklist
