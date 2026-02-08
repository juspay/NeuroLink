[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / MDocumentConfig

# Type Alias: MDocumentConfig

> **MDocumentConfig** = `object`

Defined in: [lib/rag/types.ts:770](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L770)

Configuration options for MDocument initialization. Specifies the document type and optional custom metadata.

## Since

v8.44.0

## Properties

### type

> **type**: [`DocumentType`](DocumentType.md)

Document type for processing strategy selection

---

### metadata?

> `optional` **metadata**: `Record<string, unknown>`

Custom metadata to attach to the document and propagate to chunks

## Example

```typescript
import { MDocument, type MDocumentConfig } from "@juspay/neurolink";

// Basic configuration
const config: MDocumentConfig = {
  type: "markdown",
};

const doc = new MDocument(markdownContent, config);

// With custom metadata
const configWithMetadata: MDocumentConfig = {
  type: "html",
  metadata: {
    source: "https://example.com/article",
    author: "Jane Doe",
    publishedAt: "2024-01-15",
    tags: ["ai", "machine-learning"],
  },
};

const docWithMeta = new MDocument(htmlContent, configWithMetadata);

// Metadata is preserved through processing
await docWithMeta.chunk({ strategy: "html" });
const chunks = docWithMeta.getChunks();
// Each chunk inherits document metadata
```
