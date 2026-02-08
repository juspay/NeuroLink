[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / getChunkerMetadata

# Function: getChunkerMetadata()

> **getChunkerMetadata**(`strategyOrAlias`): `ChunkerMetadata | undefined`

Defined in: [lib/rag/ChunkerFactory.ts:387](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L387)

Get metadata for a chunking strategy, including description, default configuration,
supported options, use cases, and aliases.

Useful for discovering chunker capabilities and building dynamic configuration UIs.

## Parameters

### strategyOrAlias

`string`

Chunking strategy name or alias (e.g., `"recursive"`, `"md"`, `"semantic"`)

## Returns

`ChunkerMetadata | undefined`

Metadata object if strategy exists, `undefined` otherwise

### ChunkerMetadata Properties

| Property           | Type            | Description                               |
| ------------------ | --------------- | ----------------------------------------- |
| `description`      | `string`        | Human-readable description of the chunker |
| `defaultConfig`    | `ChunkerConfig` | Default configuration values              |
| `supportedOptions` | `string[]`      | List of supported configuration options   |
| `useCases`         | `string[]`      | Recommended use cases for this chunker    |
| `aliases`          | `string[]`      | Alternative names for this strategy       |

## Examples

### Get strategy information

```typescript
import { getChunkerMetadata } from "@juspay/neurolink";

const metadata = getChunkerMetadata("recursive");

if (metadata) {
  console.log(metadata.description);
  // "Recursively splits text using ordered separators"

  console.log(metadata.defaultConfig);
  // { maxSize: 1000, overlap: 100, separators: ["\n\n", "\n", ". ", " ", ""] }

  console.log(metadata.useCases);
  // ["General text documents", "Default choice"]
}
```

### Using aliases

```typescript
import { getChunkerMetadata } from "@juspay/neurolink";

// All these return the same metadata
const md1 = getChunkerMetadata("markdown");
const md2 = getChunkerMetadata("md");
const md3 = getChunkerMetadata("markdown-header");
```

### Build configuration UI

```typescript
import { getChunkerMetadata, getAvailableStrategies } from "@juspay/neurolink";

async function buildChunkerOptions() {
  const strategies = await getAvailableStrategies();

  return strategies.map((strategy) => {
    const metadata = getChunkerMetadata(strategy);
    return {
      value: strategy,
      label: strategy,
      description: metadata?.description || "",
      defaultConfig: metadata?.defaultConfig || {},
      options: metadata?.supportedOptions || [],
    };
  });
}
```

### Validate configuration options

```typescript
import { getChunkerMetadata } from "@juspay/neurolink";

function validateChunkerConfig(
  strategy: string,
  config: Record<string, unknown>,
) {
  const metadata = getChunkerMetadata(strategy);

  if (!metadata) {
    throw new Error(`Unknown strategy: ${strategy}`);
  }

  const invalidOptions = Object.keys(config).filter(
    (key) => !metadata.supportedOptions.includes(key),
  );

  if (invalidOptions.length > 0) {
    console.warn(
      `Warning: Unsupported options for ${strategy}: ${invalidOptions.join(", ")}`,
    );
  }

  return true;
}
```

### Find chunker by use case

```typescript
import { getChunkerMetadata, getAvailableStrategies } from "@juspay/neurolink";

async function findChunkerForUseCase(useCase: string) {
  const strategies = await getAvailableStrategies();

  for (const strategy of strategies) {
    const metadata = getChunkerMetadata(strategy);
    if (
      metadata?.useCases.some((uc) =>
        uc.toLowerCase().includes(useCase.toLowerCase()),
      )
    ) {
      return { strategy, metadata };
    }
  }

  return null;
}

// Find chunker for documentation
const result = await findChunkerForUseCase("documentation");
// Returns { strategy: "markdown", metadata: { ... } }
```

## Available Strategies

| Strategy            | Aliases                                    | Description                         |
| ------------------- | ------------------------------------------ | ----------------------------------- |
| `character`         | `char`, `fixed-size`, `fixed`              | Fixed-size character chunks         |
| `recursive`         | `recursive-character`, `langchain-default` | Recursive splitting with separators |
| `sentence`          | `sent`, `sentence-based`                   | Split by sentence boundaries        |
| `token`             | `tok`, `tokenized`                         | Token-aware splitting               |
| `markdown`          | `md`, `markdown-header`                    | Split by markdown structure         |
| `html`              | `html-tag`, `web`                          | Split by HTML semantic tags         |
| `json`              | `json-object`, `structured`                | Split by JSON object boundaries     |
| `latex`             | `tex`, `latex-section`                     | Split by LaTeX sections             |
| `semantic`          | `llm`, `ai-semantic`                       | LLM-powered semantic splitting      |
| `semantic-markdown` | `semantic-md`, `smart-markdown`            | Semantic markdown combination       |

## Notes

- Returns `undefined` for unknown strategies (check before using)
- Aliases resolve to canonical strategy names
- Metadata is registered at factory initialization
- Use `getAvailableStrategies()` to list all valid strategy names

## Since

v8.44.0

## See Also

- [createChunker](./createChunker.md) - Create a chunker instance
- [getAvailableStrategies](./getAvailableStrategies.md) - List available chunking strategies
- [getDefaultConfig](./getDefaultConfig.md) - Get default configuration for a strategy
