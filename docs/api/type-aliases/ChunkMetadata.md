[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / ChunkMetadata

# Type Alias: ChunkMetadata

> **ChunkMetadata** = `object`

Defined in: [lib/rag/types.ts:28](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L28)

Chunk metadata for tracking source and position. Contains comprehensive information about a chunk's origin, position within the source document, and any extracted metadata.

## Properties

### documentId

> **documentId**: `string`

Defined in: [lib/rag/types.ts:30](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L30)

Source document identifier

---

### source?

> `optional` **source**: `string`

Defined in: [lib/rag/types.ts:32](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L32)

Original document filename or URL

---

### chunkIndex

> **chunkIndex**: `number`

Defined in: [lib/rag/types.ts:34](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L34)

Position in the original document (0-indexed)

---

### totalChunks?

> `optional` **totalChunks**: `number`

Defined in: [lib/rag/types.ts:36](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L36)

Total number of chunks from the document

---

### startPosition?

> `optional` **startPosition**: `number`

Defined in: [lib/rag/types.ts:38](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L38)

Start character position in original text

---

### endPosition?

> `optional` **endPosition**: `number`

Defined in: [lib/rag/types.ts:40](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L40)

End character position in original text

---

### documentType?

> `optional` **documentType**: [`DocumentType`](DocumentType.md)

Defined in: [lib/rag/types.ts:42](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L42)

Document type (markdown, html, json, etc.)

---

### custom?

> `optional` **custom**: `Record<string, unknown>`

Defined in: [lib/rag/types.ts:44](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L44)

Custom metadata from extraction

---

### title?

> `optional` **title**: `string`

Defined in: [lib/rag/types.ts:46](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L46)

Extracted title (from metadata extraction)

---

### summary?

> `optional` **summary**: `string`

Defined in: [lib/rag/types.ts:48](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L48)

Extracted summary (from metadata extraction)

---

### keywords?

> `optional` **keywords**: `string[]`

Defined in: [lib/rag/types.ts:50](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L50)

Extracted keywords (from metadata extraction)

---

### headerLevel?

> `optional` **headerLevel**: `number`

Defined in: [lib/rag/types.ts:52](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L52)

Header level for markdown/html chunks

---

### header?

> `optional` **header**: `string`

Defined in: [lib/rag/types.ts:54](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L54)

Header text for structured documents

---

### jsonPath?

> `optional` **jsonPath**: `string`

Defined in: [lib/rag/types.ts:56](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L56)

JSON path for JSON chunks

---

### latexEnvironment?

> `optional` **latexEnvironment**: `string`

Defined in: [lib/rag/types.ts:58](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L58)

LaTeX environment name

## Example

```typescript
import { ChunkMetadata } from "@juspay/neurolink";

const metadata: ChunkMetadata = {
  documentId: "doc-001",
  source: "technical-docs/api-guide.md",
  chunkIndex: 2,
  totalChunks: 15,
  startPosition: 1024,
  endPosition: 2048,
  documentType: "markdown",
  title: "API Authentication",
  summary: "Guide for implementing OAuth2 authentication",
  keywords: ["authentication", "OAuth2", "API", "security"],
  headerLevel: 2,
  header: "## Authentication Methods",
  custom: {
    author: "Engineering Team",
    lastUpdated: "2024-01-15",
  },
};
```

## Since

v8.44.0
