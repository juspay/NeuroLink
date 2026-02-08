[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / VectorQueryToolConfig

# Type Alias: VectorQueryToolConfig

> **VectorQueryToolConfig** = `object`

Defined in: [lib/rag/types.ts:520](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L520)

Configuration for vector query tools used by AI agents to perform semantic search over document collections.

## Since

v8.44.0

## Properties

### id?

> `optional` **id**: `string`

Tool identifier for agent registration

---

### description?

> `optional` **description**: `string`

Tool description for AI agents to understand when to use this tool

---

### indexName

> **indexName**: `string`

Index name within the vector store to query against

---

### embeddingModel

> **embeddingModel**: `object`

Embedding model specification for query vectorization

#### embeddingModel.provider

> **provider**: `string`

Provider name (e.g., "openai", "cohere")

#### embeddingModel.modelName

> **modelName**: `string`

Model name (e.g., "text-embedding-3-small")

---

### enableFilter?

> `optional` **enableFilter**: `boolean`

Enable metadata filtering on query results

---

### includeVectors?

> `optional` **includeVectors**: `boolean`

Include embedding vectors in query results

---

### includeSources?

> `optional` **includeSources**: `boolean`

Include full source objects in query results

---

### topK?

> `optional` **topK**: `number`

Number of results to return from vector search

---

### reranker?

> `optional` **reranker**: [`RerankerConfig`](RerankerConfig.md)

Reranker configuration for result refinement

---

### providerOptions?

> `optional` **providerOptions**: `VectorProviderOptions`

Provider-specific query options (Pinecone, pgVector, Chroma)

## Example

```typescript
import { createVectorQueryTool } from "@juspay/neurolink";

const vectorTool = createVectorQueryTool({
  indexName: "documents",
  embeddingModel: {
    provider: "openai",
    modelName: "text-embedding-3-small",
  },
  topK: 10,
  enableFilter: true,
  reranker: {
    model: {
      provider: "openai",
      modelName: "gpt-4o-mini",
    },
    topK: 5,
  },
});
```
