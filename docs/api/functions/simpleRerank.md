[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / simpleRerank

# Function: simpleRerank()

> **simpleRerank**(`results`, `options?`): `RerankResult[]`

Defined in: [lib/rag/reranker/reranker.ts:295](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/reranker.ts#L295)

Simple position-based reranker (no LLM required)

A fast, synchronous reranking function that combines vector similarity scores
with position-based scoring. Ideal for scenarios where LLM-based semantic
scoring is not available or when low latency is critical.

## Parameters

### results

`VectorQueryResult[]`

Vector search results to rerank. Each result should have:

- `id` - Unique identifier
- `text` - Text content
- `score` - Original vector similarity score
- `metadata` - Additional metadata

### options?

`object`

Optional configuration:

- `topK` - Number of results to return (default: 3)
- `vectorWeight` - Weight for vector score (default: 0.8)
- `positionWeight` - Weight for position score (default: 0.2)

## Returns

`RerankResult[]`

Array of reranked results sorted by combined score, each containing:

- `result` - Original VectorQueryResult
- `score` - Combined score (0-1)
- `details` - Score breakdown with `semantic: 0`, `vector`, and `position`

## Examples

### Basic simple reranking

```typescript
import { simpleRerank } from "@juspay/neurolink";

const rerankedResults = simpleRerank(vectorSearchResults, {
  topK: 5,
});

console.log("Top result:", rerankedResults[0].result.text);
```

### Adjusting weight distribution

```typescript
import { simpleRerank } from "@juspay/neurolink";

// Emphasize vector similarity over position
const results = simpleRerank(searchResults, {
  topK: 10,
  vectorWeight: 0.9,
  positionWeight: 0.1,
});
```

### Low-latency search pipeline

```typescript
import { simpleRerank } from "@juspay/neurolink";

async function fastSearch(query: string) {
  // Get vector search results
  const vectorResults = await vectorStore.query({
    queryVector: await embed(query),
    topK: 50,
  });

  // Fast synchronous reranking (no LLM calls)
  const reranked = simpleRerank(vectorResults, {
    topK: 10,
    vectorWeight: 0.85,
    positionWeight: 0.15,
  });

  return reranked.map((r) => r.result);
}
```

### Fallback when LLM is unavailable

```typescript
import { rerank, simpleRerank } from "@juspay/neurolink";

async function rerankWithFallback(
  results: VectorQueryResult[],
  query: string,
  model?: AIProvider,
) {
  if (model) {
    // Use LLM-based reranking when available
    return await rerank(results, query, model, { topK: 5 });
  }

  // Fall back to simple reranking
  return simpleRerank(results, { topK: 5 });
}
```

### Comparing reranking methods

```typescript
import { rerank, simpleRerank } from "@juspay/neurolink";

async function compareReranking(results: VectorQueryResult[], query: string) {
  // Simple reranking (fast, no API calls)
  const simpleResults = simpleRerank(results, { topK: 5 });

  // LLM reranking (slower, more accurate)
  const llmResults = await rerank(results, query, model, { topK: 5 });

  console.log(
    "Simple ranking:",
    simpleResults.map((r) => r.result.id),
  );
  console.log(
    "LLM ranking:",
    llmResults.map((r) => r.result.id),
  );
}
```

## Notes

- This is a synchronous function (returns immediately, no async)
- Semantic score is always 0 in the details (no LLM scoring)
- Weights are automatically normalized to sum to 1.0
- Position score is calculated as `1 - (index / total)`, giving earlier results higher scores

## Since

v8.44.0

## See Also

- [rerank](./rerank.md) - LLM-based reranking with semantic scoring
- [batchRerank](./batchRerank.md) - Efficient batch LLM reranking
- [createReranker](./createReranker.md) - Factory for reranker instances
- [RerankResult](../type-aliases/RerankResult.md) - Result type definition
