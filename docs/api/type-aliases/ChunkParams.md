[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / ChunkParams

# Type Alias: ChunkParams

> **ChunkParams** = `object`

Defined in: [lib/rag/types.ts:780](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L780)

Parameters for document chunking operations. Combines strategy selection, strategy-specific configuration, and optional metadata extraction.

## Since

v8.44.0

## Properties

### strategy?

> `optional` **strategy**: [`ChunkingStrategy`](ChunkingStrategy.md)

Chunking strategy to use. Defaults to an appropriate strategy based on document type.

Available strategies:

- `"character"` - Simple character-based splitting
- `"recursive"` - Smart recursive splitting with multiple separators
- `"sentence"` - Sentence-aware splitting
- `"token"` - Token-aware splitting using tokenizer
- `"markdown"` - Markdown structure-aware splitting
- `"html"` - HTML DOM structure-aware splitting
- `"json"` - JSON structure-aware splitting
- `"latex"` - LaTeX document structure-aware splitting
- `"semantic"` - LLM-based semantic splitting
- `"semantic-markdown"` - Semantic splitting for markdown

---

### config?

> `optional` **config**: [`ChunkerConfig`](ChunkerConfig.md)

Strategy-specific configuration options including maxSize, overlap, and strategy-specific settings.

---

### extract?

> `optional` **extract**: [`ExtractParams`](ExtractParams.md)

Metadata extraction options to apply during chunking

## Example

```typescript
import { MDocument, type ChunkParams } from "@juspay/neurolink";

const doc = MDocument.fromMarkdown(content);

// Basic chunking with defaults
await doc.chunk();

// Recursive chunking with custom settings
const params: ChunkParams = {
  strategy: "recursive",
  config: {
    maxSize: 1000,
    overlap: 200,
    separators: ["\n\n", "\n", ". ", " "],
  },
};
await doc.chunk(params);

// Markdown-aware chunking
await doc.chunk({
  strategy: "markdown",
  config: {
    headerLevels: [1, 2, 3],
    preserveCodeBlocks: true,
    includeHeader: true,
  },
});

// Token-based chunking for LLM context windows
await doc.chunk({
  strategy: "token",
  config: {
    maxTokens: 512,
    tokenOverlap: 50,
    tokenizer: "cl100k_base",
  },
});

// Semantic chunking with LLM
await doc.chunk({
  strategy: "semantic",
  config: {
    modelName: "gpt-4o-mini",
    provider: "openai",
    similarityThreshold: 0.8,
  },
});
```
