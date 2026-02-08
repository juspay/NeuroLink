[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / chunkText

# Function: chunkText()

> **chunkText**(`text`, `strategy?`, `config?`): `Promise<Chunk[]>`

Defined in: [lib/rag/chunking/chunkerRegistry.ts:207](https://github.com/juspay/neurolink/blob/main/src/lib/rag/chunking/chunkerRegistry.ts#L207)

Convenience function to chunk text with a given strategy

This is a simple wrapper around the ChunkerRegistry that handles
chunker instantiation automatically. Ideal for one-off chunking operations
where you don't need to reuse the chunker instance.

## Parameters

### text

`string`

The text content to chunk

### strategy?

`ChunkingStrategy`

Chunking strategy to use (default: `"recursive"`)

Available strategies:

- `character` - Simple character-based splitting
- `recursive` - Smart splitting with ordered separators (recommended default)
- `sentence` - Sentence-boundary aware splitting
- `token` - Token-count based splitting for LLM compatibility
- `markdown` - Markdown structure-aware splitting
- `html` - HTML tag-aware splitting
- `json` - JSON structure-aware splitting
- `latex` - LaTeX environment-aware splitting
- `semantic` - LLM-powered semantic splitting

### config?

`Record<string, unknown>`

Strategy-specific configuration options

## Returns

`Promise<Chunk[]>`

Array of Chunk objects, each containing:

- `id` - Unique chunk identifier
- `text` - The chunk text content
- `metadata` - Chunk metadata including position and source info

## Examples

### Basic text chunking

```typescript
import { chunkText } from "@juspay/neurolink";

const text = "Your long document text here...";
const chunks = await chunkText(text);

console.log(`Created ${chunks.length} chunks`);
chunks.forEach((chunk, i) => {
  console.log(`Chunk ${i + 1}: ${chunk.text.slice(0, 50)}...`);
});
```

### Chunking with specific strategy

```typescript
import { chunkText } from "@juspay/neurolink";

// Use sentence chunking for Q&A applications
const chunks = await chunkText(articleText, "sentence", {
  maxSize: 500,
  minSentences: 2,
});
```

### Processing markdown documentation

```typescript
import { chunkText } from "@juspay/neurolink";

const readmeContent = fs.readFileSync("README.md", "utf-8");

const chunks = await chunkText(readmeContent, "markdown", {
  maxSize: 1000,
  headerLevels: [1, 2, 3],
  preserveCodeBlocks: true,
  includeHeader: true,
});

// Each chunk will be a logical section from the markdown
for (const chunk of chunks) {
  console.log(`Section: ${chunk.metadata.header || "Introduction"}`);
  console.log(`Content: ${chunk.text.slice(0, 100)}...`);
}
```

### Token-aware chunking for embeddings

```typescript
import { chunkText } from "@juspay/neurolink";

// Ensure chunks fit within embedding model limits
const chunks = await chunkText(document, "token", {
  maxTokens: 512,
  tokenOverlap: 50,
  tokenizer: "cl100k_base", // GPT-4 tokenizer
});
```

### Processing JSON data

```typescript
import { chunkText } from "@juspay/neurolink";

const jsonData = JSON.stringify(apiResponse);

const chunks = await chunkText(jsonData, "json", {
  maxSize: 800,
  maxDepth: 5,
  includeJsonPath: true,
});

// Each chunk includes its JSON path in metadata
chunks.forEach((chunk) => {
  console.log(`Path: ${chunk.metadata.jsonPath}`);
});
```

## Since

v8.44.0

## See Also

- [createChunker](./createChunker.md) - Create reusable chunker instances
- [getAvailableStrategies](./getAvailableStrategies.md) - List available strategies
- [Chunk](../type-aliases/Chunk.md) - Chunk type definition
- [ChunkingStrategy](../type-aliases/ChunkingStrategy.md) - Strategy type definition
