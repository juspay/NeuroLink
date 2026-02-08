[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / rerank

# Function: rerank()

> **rerank**(`results`, `query`, `model`, `options?`): `Promise<RerankResult[]>`

Defined in: [lib/rag/reranker/reranker.ts:39](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/reranker.ts#L39)

Rerank vector search results using multi-factor scoring

Combines three scoring factors to produce a comprehensive relevance score:

1. **Semantic score**: LLM-based relevance assessment (0-1)
2. **Vector score**: Original similarity score from vector search
3. **Position score**: Inverse of original ranking position

Results are processed in parallel batches for efficiency.

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

Original search query used for semantic relevance scoring

### model

`AIProvider`

Language model provider for semantic scoring. Must implement the `generate()` method.

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
- `details` - Score breakdown with `semantic`, `vector`, `position`, and optional `queryAnalysis`

## Examples

### Basic reranking

```typescript
import { rerank } from "@juspay/neurolink";
import { ProviderFactory } from "@juspay/neurolink";

const model = await ProviderFactory.createProvider("openai", "gpt-4o-mini");

const rerankedResults = await rerank(
  vectorSearchResults,
  "What are the key features?",
  model,
);

console.log("Top result:", rerankedResults[0].result.text);
console.log("Score breakdown:", rerankedResults[0].details);
```

### Custom weights emphasizing semantic relevance

```typescript
import { rerank } from "@juspay/neurolink";

const results = await rerank(searchResults, query, model, {
  topK: 5,
  weights: {
    semantic: 0.6, // Emphasize LLM-based scoring
    vector: 0.3,
    position: 0.1,
  },
});
```

### Integration with RAG pipeline

```typescript
import { rerank, createVectorQueryTool } from "@juspay/neurolink";

async function enhancedSearch(query: string) {
  // Initial vector search
  const vectorTool = createVectorQueryTool(vectorStore, config);
  const initialResults = await vectorTool.query(query);

  // Rerank for better relevance
  const rerankedResults = await rerank(
    initialResults.sources,
    query,
    llmProvider,
    { topK: 3 },
  );

  // Use top reranked results for generation
  return rerankedResults.map((r) => r.result.text).join("\n\n");
}
```

### Analyzing score distribution

```typescript
import { rerank } from "@juspay/neurolink";

const results = await rerank(searchResults, query, model, { topK: 10 });

results.forEach((r, i) => {
  console.log(`Rank ${i + 1}:`);
  console.log(`  Combined: ${r.score.toFixed(3)}`);
  console.log(`  Semantic: ${r.details.semantic.toFixed(3)}`);
  console.log(`  Vector:   ${r.details.vector.toFixed(3)}`);
  console.log(`  Position: ${r.details.position.toFixed(3)}`);
});
```

## Notes

- Weights are automatically normalized if they don't sum to 1.0
- Semantic scoring uses LLM to rate relevance on a 0-1 scale
- If semantic scoring fails, a default score of 0.5 is used
- Results are processed in batches of 5 for parallel efficiency

## Since

v8.44.0

## See Also

- [batchRerank](./batchRerank.md) - Optimized batch reranking
- [simpleRerank](./simpleRerank.md) - Reranking without LLM
- [createReranker](./createReranker.md) - Factory for reranker instances
- [RerankResult](../type-aliases/RerankResult.md) - Result type definition
