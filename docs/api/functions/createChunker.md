[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / createChunker

# Function: createChunker()

> **createChunker**(`strategyOrAlias`, `config?`): `Promise<Chunker>`

Defined in: [lib/rag/ChunkerFactory.ts:373](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L373)

Create a chunker instance by strategy name or alias

This factory function provides a convenient way to instantiate chunkers
without directly interacting with the ChunkerFactory singleton. It supports
all built-in chunking strategies and their aliases.

## Parameters

### strategyOrAlias

`string`

Chunking strategy name or alias. Supported strategies:

- `character` (aliases: `char`, `fixed-size`, `fixed`)
- `recursive` (aliases: `recursive-character`, `langchain-default`)
- `sentence` (aliases: `sent`, `sentence-based`)
- `token` (aliases: `tok`, `tokenized`)
- `markdown` (aliases: `md`, `markdown-header`)
- `html` (aliases: `html-tag`, `web`)
- `json` (aliases: `json-object`, `structured`)
- `latex` (aliases: `tex`, `latex-section`)
- `semantic` (aliases: `llm`, `ai-semantic`)
- `semantic-markdown` (aliases: `semantic-md`, `smart-markdown`)

### config?

`ChunkerConfig`

Strategy-specific configuration options:

- `maxSize` - Maximum chunk size (default varies by strategy)
- `overlap` - Overlap between consecutive chunks
- `minSize` - Minimum chunk size
- Additional options vary by strategy

## Returns

`Promise<Chunker>`

A Chunker instance configured with the specified strategy

## Throws

`ChunkingError` - If the strategy is unknown or creation fails

## Examples

### Basic usage with strategy name

```typescript
import { createChunker } from "@juspay/neurolink";

const chunker = await createChunker("recursive");
const chunks = await chunker.chunk(documentText);
```

### Using strategy alias

```typescript
import { createChunker } from "@juspay/neurolink";

// Use 'md' alias for markdown chunker
const chunker = await createChunker("md", { maxSize: 500 });
const chunks = await chunker.chunk(markdownContent);
```

### With custom configuration

```typescript
import { createChunker } from "@juspay/neurolink";

const chunker = await createChunker("sentence", {
  maxSize: 1000,
  overlap: 100,
  minSentences: 2,
  maxSentences: 10,
});

const chunks = await chunker.chunk(articleText);
```

### Processing code with recursive chunker

```typescript
import { createChunker } from "@juspay/neurolink";

const chunker = await createChunker("recursive", {
  maxSize: 800,
  overlap: 50,
  separators: ["\n\n", "\n", " ", ""],
  keepSeparators: true,
});

const codeChunks = await chunker.chunk(sourceCode);
```

## Since

v8.44.0

## See Also

- [getAvailableStrategies](./getAvailableStrategies.md) - List available chunking strategies
- [chunkText](./chunkText.md) - Convenience function for one-off chunking
- [ChunkerConfig](../type-aliases/ChunkerConfig.md) - Configuration options
- [Chunker](../interfaces/Chunker.md) - Chunker interface
