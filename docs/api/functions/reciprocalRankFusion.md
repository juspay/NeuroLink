[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / reciprocalRankFusion

# Function: reciprocalRankFusion()

> **reciprocalRankFusion**(`rankings`, `k?`): `Map<string, number>`

Defined in: [lib/rag/retrieval/hybridSearch.ts:169](https://github.com/juspay/neurolink/blob/main/src/lib/rag/retrieval/hybridSearch.ts#L169)

Reciprocal Rank Fusion (RRF) combines rankings from multiple retrieval methods into a single unified ranking.

RRF is particularly effective for hybrid search scenarios where you want to combine
results from different retrieval strategies (e.g., vector search and BM25) without
requiring score normalization.

## Parameters

### rankings

`Array<Array<{ id: string; rank: number }>>`

Array of ranking lists from different retrieval methods. Each ranking is an array of objects containing document `id` and `rank` (1-indexed position).

### k?

`number`

RRF constant that controls the impact of lower-ranked documents. Default is `60`. Higher values give more weight to lower-ranked results.

## Returns

`Map<string, number>`

Map of document IDs to their fused RRF scores. Higher scores indicate more relevant documents.

## Examples

### Basic rank fusion

```typescript
import { reciprocalRankFusion } from "@juspay/neurolink";

// Rankings from two different retrieval methods
const vectorRanking = [
  { id: "doc-1", rank: 1 },
  { id: "doc-2", rank: 2 },
  { id: "doc-3", rank: 3 },
];

const bm25Ranking = [
  { id: "doc-2", rank: 1 },
  { id: "doc-1", rank: 2 },
  { id: "doc-4", rank: 3 },
];

const fusedScores = reciprocalRankFusion([vectorRanking, bm25Ranking]);

// Get sorted results
const sortedResults = [...fusedScores.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([id, score]) => ({ id, score }));

console.log(sortedResults);
// doc-1 and doc-2 will have highest scores (appear in both rankings)
```

### Custom k parameter

```typescript
import { reciprocalRankFusion } from "@juspay/neurolink";

// Use lower k for more emphasis on top-ranked results
const fusedScores = reciprocalRankFusion(rankings, 20);

// Use higher k for smoother score distribution
const smootherScores = reciprocalRankFusion(rankings, 100);
```

### Combining multiple retrieval methods

```typescript
import { reciprocalRankFusion } from "@juspay/neurolink";

// Combine three retrieval methods
const semanticRanking = results.semantic.map((r, i) => ({
  id: r.id,
  rank: i + 1,
}));
const keywordRanking = results.keyword.map((r, i) => ({
  id: r.id,
  rank: i + 1,
}));
const recentRanking = results.recent.map((r, i) => ({ id: r.id, rank: i + 1 }));

const fusedScores = reciprocalRankFusion([
  semanticRanking,
  keywordRanking,
  recentRanking,
]);
```

## Notes

- RRF score is calculated as: `sum(1 / (k + rank))` across all rankings
- Documents appearing in multiple rankings will have higher fused scores
- The k parameter prevents high-ranked documents from dominating (k=60 is a common default)
- RRF does not require score normalization, making it robust for combining heterogeneous retrieval methods

## Since

v8.44.0

## See Also

- [linearCombination](./linearCombination.md) - Alternative fusion method using weighted score combination
- [createHybridSearch](./createHybridSearch.md) - Create a hybrid search function using RRF or linear combination
