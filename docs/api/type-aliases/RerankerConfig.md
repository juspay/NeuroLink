[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / RerankerConfig

# Type Alias: RerankerConfig

> **RerankerConfig** = `object`

Defined in: [lib/rag/types.ts:479](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L479)

Reranker configuration. Defines the model, scoring weights, and result limits for reranking search results to improve relevance.

## Properties

### model

> **model**: `object`

Defined in: [lib/rag/types.ts:481](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L481)

Language model for reranking

#### model.provider

> **provider**: `string`

The model provider (e.g., "openai", "cohere", "anthropic")

#### model.modelName

> **modelName**: `string`

The model name (e.g., "gpt-4o-mini", "rerank-english-v3.0")

---

### weights?

> `optional` **weights**: `object`

Defined in: [lib/rag/types.ts:486](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L486)

Scoring weights for combining different relevance signals

#### weights.semantic?

> `optional` **semantic**: `number`

Weight for semantic similarity score (0-1)

#### weights.vector?

> `optional` **vector**: `number`

Weight for vector similarity score (0-1)

#### weights.position?

> `optional` **position**: `number`

Weight for original position score (0-1)

---

### topK?

> `optional` **topK**: `number`

Defined in: [lib/rag/types.ts:492](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L492)

Number of results to return after reranking

## Example

```typescript
import { RerankerConfig, VectorQueryToolConfig } from "@juspay/neurolink";

// Basic reranker configuration
const rerankerConfig: RerankerConfig = {
  model: {
    provider: "openai",
    modelName: "gpt-4o-mini",
  },
  topK: 10,
};

// Advanced configuration with custom weights
const advancedRerankerConfig: RerankerConfig = {
  model: {
    provider: "cohere",
    modelName: "rerank-english-v3.0",
  },
  weights: {
    semantic: 0.5, // 50% weight on semantic relevance
    vector: 0.3, // 30% weight on vector similarity
    position: 0.2, // 20% weight on original ranking
  },
  topK: 5,
};

// Use reranker in vector query configuration
const queryConfig: VectorQueryToolConfig = {
  indexName: "knowledge-base",
  embeddingModel: {
    provider: "openai",
    modelName: "text-embedding-3-small",
  },
  topK: 50, // Fetch more results initially
  reranker: advancedRerankerConfig, // Rerank to top 5
};
```

## Since

v8.44.0
