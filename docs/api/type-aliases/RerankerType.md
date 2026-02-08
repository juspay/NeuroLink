[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / RerankerType

# Type Alias: RerankerType

> **RerankerType** = `"cross-encoder"` | `"colbert"` | `"cohere"` | `"llm"`

Defined in: [lib/rag/types.ts:728](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L728)

Reranker type options. Specifies the algorithm or service used to rerank search results for improved relevance.

## Values

### "cross-encoder"

Cross-encoder reranking. Uses a transformer model that jointly encodes the query and document for accurate relevance scoring. Slower but more accurate than bi-encoders.

---

### "colbert"

ColBERT (Contextualized Late Interaction over BERT) reranking. Uses late interaction between query and document token embeddings for efficient and accurate reranking.

---

### "cohere"

Cohere Rerank API. Uses Cohere's hosted reranking service for high-quality relevance scoring without managing infrastructure.

---

### "llm"

LLM-based reranking. Uses a large language model to evaluate and score the relevance of each result to the query. Most flexible but potentially slower.

## Example

```typescript
import { RerankerType, RerankerConfig } from "@juspay/neurolink";

// Using different reranker types
const rerankerTypes: RerankerType[] = [
  "cross-encoder", // Best accuracy, moderate speed
  "colbert", // Good balance of speed and accuracy
  "cohere", // Managed service, easy to use
  "llm", // Most flexible, custom prompting
];

// Configure reranker with specific type
const config: RerankerConfig = {
  model: {
    provider: "openai",
    modelName: "gpt-4o-mini",
  },
  weights: {
    semantic: 0.5,
    vector: 0.3,
    position: 0.2,
  },
  topK: 10,
};

// Use with vector query
const results = await vectorStore.query({
  query: "How to implement authentication?",
  topK: 50,
  reranker: config,
});
```

## Since

v8.44.0
