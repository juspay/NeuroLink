[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / linearCombination

# Function: linearCombination()

> **linearCombination**(`vectorScores`, `bm25Scores`, `alpha?`): `Map<string, number>`

Defined in: [lib/rag/retrieval/hybridSearch.ts:193](https://github.com/juspay/neurolink/blob/main/src/lib/rag/retrieval/hybridSearch.ts#L193)

Linear Combination of normalized scores from vector and BM25 search results.

This fusion method normalizes scores from each retrieval method to a 0-1 range,
then combines them using a weighted average. Useful when you want precise control
over the contribution of each retrieval method.

## Parameters

### vectorScores

`Map<string, number>`

Map of document IDs to vector search scores

### bm25Scores

`Map<string, number>`

Map of document IDs to BM25 search scores

### alpha?

`number`

Weight for vector scores (0-1). BM25 scores receive weight `(1 - alpha)`. Default is `0.5` for equal weighting.

## Returns

`Map<string, number>`

Map of document IDs to combined normalized scores

## Examples

### Basic linear combination

```typescript
import { linearCombination } from "@juspay/neurolink";

// Scores from vector search
const vectorScores = new Map([
  ["doc-1", 0.95],
  ["doc-2", 0.82],
  ["doc-3", 0.71],
]);

// Scores from BM25 search
const bm25Scores = new Map([
  ["doc-2", 12.5],
  ["doc-1", 8.3],
  ["doc-4", 15.2],
]);

// Equal weighting (default)
const combinedScores = linearCombination(vectorScores, bm25Scores);

// Get sorted results
const results = [...combinedScores.entries()].sort((a, b) => b[1] - a[1]);
```

### Favor semantic similarity

```typescript
import { linearCombination } from "@juspay/neurolink";

// Give 70% weight to vector search, 30% to BM25
const combinedScores = linearCombination(vectorScores, bm25Scores, 0.7);
```

### Favor keyword matching

```typescript
import { linearCombination } from "@juspay/neurolink";

// Give 30% weight to vector search, 70% to BM25
const combinedScores = linearCombination(vectorScores, bm25Scores, 0.3);
```

### Integration with hybrid search results

```typescript
import { linearCombination } from "@juspay/neurolink";

async function hybridSearch(query: string) {
  // Get results from both methods
  const [vectorResults, bm25Results] = await Promise.all([
    vectorStore.query({ query, topK: 20 }),
    bm25Index.search(query, 20),
  ]);

  // Convert to score maps
  const vectorScores = new Map(vectorResults.map((r) => [r.id, r.score]));
  const bm25Scores = new Map(bm25Results.map((r) => [r.id, r.score]));

  // Combine with custom weighting
  const combined = linearCombination(vectorScores, bm25Scores, 0.6);

  // Merge with original data and return top results
  return [...combined.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, score]) => ({
      id,
      score,
      data:
        vectorResults.find((r) => r.id === id) ||
        bm25Results.find((r) => r.id === id),
    }));
}
```

## Notes

- Scores are normalized to 0-1 range using min-max normalization before combination
- Documents appearing in only one set receive 0 for the missing score
- Alpha controls the semantic vs. keyword trade-off:
  - `alpha = 1.0`: Pure vector search
  - `alpha = 0.5`: Equal weighting (default)
  - `alpha = 0.0`: Pure BM25 search
- Unlike RRF, this method considers actual score magnitudes (after normalization)

## Since

v8.44.0

## See Also

- [reciprocalRankFusion](./reciprocalRankFusion.md) - Alternative fusion method using rank positions
- [createHybridSearch](./createHybridSearch.md) - Create a hybrid search function using RRF or linear combination
