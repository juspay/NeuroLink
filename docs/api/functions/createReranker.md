[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / createReranker

# Function: createReranker()

> **createReranker**(`typeOrAlias`, `config?`): `Promise<Reranker>`

Defined in: [lib/rag/reranker/RerankerFactory.ts:539](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L539)

Create a reranker instance by type or alias

This factory function provides a convenient way to instantiate rerankers
for improving retrieval quality by re-scoring and re-ordering search results
based on relevance to the query.

## Parameters

### typeOrAlias

`string`

Reranker type or alias. Supported types:

- `llm` (aliases: `semantic`, `ai`, `model-based`) - LLM-powered semantic reranking
- `cross-encoder` (aliases: `cross`, `encoder`, `bi-encoder`) - Cross-encoder model reranking
- `cohere` (aliases: `cohere-rerank`, `cohere-api`) - Cohere Rerank API
- `simple` (aliases: `fast`, `basic`, `position-based`) - Position and vector score-based (no LLM)
- `batch` (aliases: `batch-llm`, `efficient`, `bulk`) - Batch LLM reranking for efficiency

### config?

`RerankerConfig`

Reranker configuration options:

- `type` - Reranker type
- `model` - Model name for LLM-based rerankers
- `provider` - Provider for the model
- `topK` - Number of results to return after reranking
- `weights` - Scoring weights for multi-factor reranking
- `apiKey` - API key for external services (e.g., Cohere)

## Returns

`Promise<Reranker>`

A Reranker instance configured with the specified type

## Throws

`RerankerError` - If the type is unknown or creation fails

## Examples

### Basic LLM reranking

```typescript
import { createReranker, rerankerFactory } from "@juspay/neurolink";

// Set up the model provider first
rerankerFactory.setModelProvider(myAIProvider);

const reranker = await createReranker("llm", {
  topK: 5,
  weights: { semantic: 0.5, vector: 0.3, position: 0.2 },
});

const rerankedResults = await reranker.rerank(searchResults, "user query");
```

### Simple reranking without LLM

```typescript
import { createReranker } from "@juspay/neurolink";

// Fast reranking using vector scores and position
const reranker = await createReranker("simple", {
  topK: 10,
  weights: { vector: 0.8, position: 0.2 },
});

const results = await reranker.rerank(vectorSearchResults, query);
```

### Batch reranking for efficiency

```typescript
import { createReranker, rerankerFactory } from "@juspay/neurolink";

rerankerFactory.setModelProvider(aiProvider);

// Efficient batch scoring for large result sets
const reranker = await createReranker("batch", {
  topK: 20,
  weights: { semantic: 0.4, vector: 0.4, position: 0.2 },
});

const rerankedResults = await reranker.rerank(largeResultSet, query);
```

### Using Cohere Rerank API

```typescript
import { createReranker } from "@juspay/neurolink";

const reranker = await createReranker("cohere", {
  model: "rerank-v3.5",
  topK: 10,
  apiKey: process.env.COHERE_API_KEY,
});

const results = await reranker.rerank(searchResults, query);
```

## Since

v8.44.0

## See Also

- [rerank](./rerank.md) - Direct LLM-based reranking function
- [simpleRerank](./simpleRerank.md) - Simple position-based reranking
- [batchRerank](./batchRerank.md) - Batch reranking for efficiency
- [RerankerConfig](../type-aliases/RerankerConfig.md) - Configuration options
- [Reranker](../interfaces/Reranker.md) - Reranker interface
