[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / HybridSearchConfig

# Type Alias: HybridSearchConfig

> **HybridSearchConfig** = `object`

Defined in: [lib/rag/types.ts:585](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L585)

Hybrid search configuration. Combines vector similarity search with BM25 keyword search for improved retrieval quality.

## Properties

### vectorWeight?

> `optional` **vectorWeight**: `number`

Defined in: [lib/rag/types.ts:587](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L587)

Weight for vector search results (0-1). Higher values prioritize semantic similarity.

---

### bm25Weight?

> `optional` **bm25Weight**: `number`

Defined in: [lib/rag/types.ts:589](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L589)

Weight for BM25 keyword search results (0-1). Higher values prioritize exact keyword matches.

---

### fusionMethod?

> `optional` **fusionMethod**: `"rrf"` | `"linear"`

Defined in: [lib/rag/types.ts:591](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L591)

Method for combining search results:

- `"rrf"`: Reciprocal Rank Fusion - combines rankings using reciprocal of positions
- `"linear"`: Linear combination of normalized scores

---

### rrfK?

> `optional` **rrfK**: `number`

Defined in: [lib/rag/types.ts:593](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L593)

RRF k parameter. Controls the impact of lower-ranked results in Reciprocal Rank Fusion. Typical values: 20-60.

---

### topK?

> `optional` **topK**: `number`

Defined in: [lib/rag/types.ts:595](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L595)

Number of results to return after fusion

---

### enableReranking?

> `optional` **enableReranking**: `boolean`

Defined in: [lib/rag/types.ts:597](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L597)

Enable reranking of fused results for additional relevance improvement

---

### reranker?

> `optional` **reranker**: [`RerankerConfig`](RerankerConfig.md)

Defined in: [lib/rag/types.ts:599](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L599)

Reranker configuration (used when `enableReranking` is true)

## Example

```typescript
import { HybridSearchConfig, RerankerConfig } from "@juspay/neurolink";

// Basic hybrid search with equal weights
const basicConfig: HybridSearchConfig = {
  vectorWeight: 0.5,
  bm25Weight: 0.5,
  fusionMethod: "rrf",
  topK: 10,
};

// Advanced hybrid search favoring semantic similarity
const semanticFocusedConfig: HybridSearchConfig = {
  vectorWeight: 0.7,
  bm25Weight: 0.3,
  fusionMethod: "linear",
  topK: 20,
};

// Hybrid search with RRF and reranking
const rerankedConfig: HybridSearchConfig = {
  vectorWeight: 0.6,
  bm25Weight: 0.4,
  fusionMethod: "rrf",
  rrfK: 60,
  topK: 50,
  enableReranking: true,
  reranker: {
    model: {
      provider: "cohere",
      modelName: "rerank-english-v3.0",
    },
    topK: 10,
  },
};

// Use in search
const results = await searchIndex.hybridSearch({
  query: "machine learning best practices",
  config: rerankedConfig,
});
```

## Since

v8.44.0
