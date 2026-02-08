[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / Chunk

# Type Alias: Chunk

> **Chunk** = `object`

Defined in: [lib/rag/types.ts:64](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L64)

Base chunk result with text and metadata. Represents a segment of a document after chunking, containing the text content, unique identifier, associated metadata, and optionally an embedding vector.

## Properties

### id

> **id**: `string`

Defined in: [lib/rag/types.ts:66](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L66)

Unique identifier for the chunk

---

### text

> **text**: `string`

Defined in: [lib/rag/types.ts:68](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L68)

The text content of the chunk

---

### metadata

> **metadata**: [`ChunkMetadata`](ChunkMetadata.md)

Defined in: [lib/rag/types.ts:70](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L70)

Metadata associated with the chunk, including source document information and position

---

### embedding?

> `optional` **embedding**: `number[]`

Defined in: [lib/rag/types.ts:72](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L72)

Optional embedding vector (populated after embedding generation)

## Example

```typescript
import { Chunk } from "@juspay/neurolink";

const chunk: Chunk = {
  id: "doc-001-chunk-0",
  text: "RAG (Retrieval-Augmented Generation) enhances LLM responses by incorporating relevant context from external knowledge bases.",
  metadata: {
    documentId: "doc-001",
    source: "rag-overview.md",
    chunkIndex: 0,
    totalChunks: 5,
    startPosition: 0,
    endPosition: 125,
    documentType: "markdown"
  },
  embedding: [0.023, -0.156, 0.089, ...] // 1536-dimensional vector
};
```

## Since

v8.44.0
