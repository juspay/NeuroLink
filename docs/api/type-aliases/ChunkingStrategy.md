[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / ChunkingStrategy

# Type Alias: ChunkingStrategy

> **ChunkingStrategy** = `"character"` | `"recursive"` | `"sentence"` | `"token"` | `"markdown"` | `"html"` | `"json"` | `"latex"` | `"semantic"` | `"semantic-markdown"`

Defined in: [lib/rag/types.ts:82](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L82)

Available chunking strategy types. Determines how documents are split into chunks for processing and embedding.

## Values

### "character"

Simple character-based splitting. Splits text at a fixed character count with optional separator.

---

### "recursive"

Smart splitting based on content structure. Tries multiple separators in order (paragraphs, then lines, then words, then characters).

---

### "sentence"

Sentence-aware splitting. Respects sentence boundaries to maintain semantic coherence.

---

### "token"

Token-aware splitting using a tokenizer. Ensures chunks fit within model token limits.

---

### "markdown"

Structure-aware markdown splitting. Splits on headers while preserving code blocks and formatting.

---

### "html"

HTML structure-aware splitting. Splits on HTML tags while maintaining document structure.

---

### "json"

JSON structure-aware splitting. Splits on array elements and object keys while preserving valid JSON.

---

### "latex"

LaTeX structure-aware splitting. Splits on LaTeX environments and commands.

---

### "semantic"

LLM-based semantic splitting. Uses language models to identify natural topic boundaries.

---

### "semantic-markdown"

Semantic splitting optimized for markdown documents. Combines markdown structure awareness with semantic analysis.

## Example

```typescript
import { MDocument, ChunkingStrategy } from "@juspay/neurolink";

// Using different chunking strategies
const strategies: ChunkingStrategy[] = [
  "recursive", // Best for general text
  "markdown", // Best for markdown files
  "token", // Best for LLM token limits
  "semantic", // Best for topic-based splitting
];

const doc = MDocument.fromText(content);

// Chunk with recursive strategy (recommended default)
const chunks = await doc.chunk({
  strategy: "recursive",
  config: {
    maxSize: 512,
    overlap: 50,
  },
});

// Chunk markdown with structure awareness
const mdChunks = await doc.chunk({
  strategy: "markdown",
  config: {
    headerLevels: [1, 2, 3],
    preserveCodeBlocks: true,
  },
});
```

## Since

v8.44.0
