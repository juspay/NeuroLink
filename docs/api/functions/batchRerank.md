[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / batchRerank

# Function: batchRerank()

> **batchRerank**(`results`, `query`, `model`, `options?`): `Promise<RerankResult[]>`

Defined in: [lib/rag/reranker/reranker.ts:184](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/reranker.ts#L184)

Batch rerank with optimized LLM calls

Scores multiple documents in a single LLM prompt for improved efficiency
compared to individual scoring. This is ideal for large result sets where
reducing API calls is important for cost and latency.

## Parameters

### results

`VectorQueryResult[]`

Vector search results to rerank. Each result should have:

- `id` - Unique identifier
- `text` - Text content (or `metadata.text`)
- `score` - Original vector similarity score
- `metadata` - Additional metadata

### query

`string`

Original search query for relevance scoring

### model

`AIProvider`

Language model provider for batch semantic scoring

### options?

`RerankerOptions`

Optional reranking configuration:

- `topK` - Number of results to return (default: 3)
- `weights` - Scoring weights (must sum to 1.0)
  - `semantic` - Weight for LLM-based score (default: 0.4)
  - `vector` - Weight for vector similarity score (default: 0.4)
  - `position` - Weight for position score (default: 0.2)

## Returns

`Promise<RerankResult[]>`

Array of reranked results sorted by combined score, each containing:

- `result` - Original VectorQueryResult
- `score` - Combined relevance score (0-1)
- `details` - Score breakdown with `semantic`, `vector`, and `position`

## Examples

### Basic batch reranking

```typescript
import { batchRerank } from "@juspay/neurolink";
import { ProviderFactory } from "@juspay/neurolink";

const model = await ProviderFactory.createProvider("openai", "gpt-4o-mini");

// Efficiently score all results in one LLM call
const rerankedResults = await batchRerank(
  vectorSearchResults,
  "What is the return policy?",
  model,
  { topK: 5 },
);
```

### Cost-efficient reranking for large result sets

```typescript
import { batchRerank } from "@juspay/neurolink";

async function efficientSearch(query: string, results: VectorQueryResult[]) {
  // Batch reranking uses a single prompt to score all documents
  // Much more efficient than individual scoring for 20+ results
  const reranked = await batchRerank(results, query, model, {
    topK: 10,
    weights: { semantic: 0.5, vector: 0.35, position: 0.15 },
  });

  return reranked;
}
```

### With fallback handling

```typescript
import { batchRerank, rerank } from "@juspay/neurolink";

async function robustRerank(results: VectorQueryResult[], query: string) {
  try {
    // Try batch reranking first for efficiency
    return await batchRerank(results, query, model, { topK: 5 });
  } catch (error) {
    console.warn("Batch reranking failed, falling back to individual scoring");
    // batchRerank automatically falls back to individual rerank on failure
    return await rerank(results, query, model, { topK: 5 });
  }
}
```

### Pipeline integration

```typescript
import { batchRerank, createHybridSearch } from "@juspay/neurolink";

async function hybridSearchWithReranking(query: string) {
  const hybridSearch = createHybridSearch(hybridConfig);

  // Get initial hybrid search results
  const initialResults = await hybridSearch(query, { topK: 50 });

  // Efficiently rerank the top results
  const reranked = await batchRerank(
    initialResults.map((r) => ({
      id: r.id,
      text: r.text,
      score: r.score,
      metadata: r.metadata,
    })),
    query,
    model,
    { topK: 10 },
  );

  return reranked;
}
```

## Notes

- Uses a single LLM prompt to score all documents simultaneously
- Falls back to individual `rerank()` if batch scoring fails
- Documents are truncated to 300 characters in the batch prompt
- Scores are parsed from the LLM response; unparseable scores default to 0.5

## Since

v8.44.0

## See Also

- [rerank](./rerank.md) - Individual document reranking
- [simpleRerank](./simpleRerank.md) - Reranking without LLM
- [createReranker](./createReranker.md) - Factory for reranker instances
- [RerankResult](../type-aliases/RerankResult.md) - Result type definition
