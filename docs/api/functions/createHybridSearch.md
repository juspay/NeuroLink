[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / createHybridSearch

# Function: createHybridSearch()

> **createHybridSearch**(`options`): (`query`: `string`, `config?`: `HybridSearchConfig`) => `Promise<HybridSearchResult[]>`

Defined in: [lib/rag/retrieval/hybridSearch.ts:262](https://github.com/juspay/neurolink/blob/main/src/lib/rag/retrieval/hybridSearch.ts#L262)

Create a hybrid search function combining vector and BM25 retrieval

Hybrid search improves retrieval quality by combining dense (vector) and
sparse (BM25) search methods. This addresses limitations of pure vector
search for keyword-heavy queries and lexical matching.

## Parameters

### options

`HybridSearchOptions`

Configuration for the hybrid search function:

- `vectorStore` - Vector store instance for dense retrieval
- `bm25Index` - BM25 index instance for sparse retrieval
- `indexName` - Index name within the vector store
- `embeddingModel` - Configuration for query embedding
  - `provider` - Embedding provider name
  - `modelName` - Embedding model name
- `defaultConfig` - Optional default search configuration

## Returns

`Function`

A hybrid search function that accepts:

- `query` - Search query string
- `config` - Optional search configuration (HybridSearchConfig)

Returns `Promise<HybridSearchResult[]>` - Array of search results with combined scores

### HybridSearchConfig options

- `vectorWeight` - Weight for vector scores (default: 0.5)
- `bm25Weight` - Weight for BM25 scores (default: 0.5)
- `fusionMethod` - Score fusion method: `"rrf"` or `"linear"` (default: `"rrf"`)
- `rrfK` - RRF constant parameter (default: 60)
- `topK` - Number of results to return (default: 10)
- `enableReranking` - Enable post-retrieval reranking (default: false)
- `reranker` - Reranker configuration if reranking is enabled

## Examples

### Basic hybrid search setup

```typescript
import {
  createHybridSearch,
  InMemoryBM25Index,
  InMemoryVectorStore,
} from "@juspay/neurolink";

// Create stores
const vectorStore = new InMemoryVectorStore({ dimension: 1536 });
const bm25Index = new InMemoryBM25Index();

// Add documents to both stores
await vectorStore.upsert({
  indexName: "docs",
  vectors: documents.map((d) => ({
    id: d.id,
    vector: d.embedding,
    metadata: { text: d.text },
  })),
});
await bm25Index.addDocuments(documents);

// Create hybrid search function
const hybridSearch = createHybridSearch({
  vectorStore,
  bm25Index,
  indexName: "docs",
  embeddingModel: {
    provider: "openai",
    modelName: "text-embedding-3-small",
  },
});

// Execute search
const results = await hybridSearch("machine learning algorithms");
```

### Using Reciprocal Rank Fusion (RRF)

```typescript
import { createHybridSearch } from "@juspay/neurolink";

const hybridSearch = createHybridSearch({
  vectorStore,
  bm25Index,
  indexName: "knowledge-base",
  embeddingModel: { provider: "openai", modelName: "text-embedding-3-small" },
  defaultConfig: {
    fusionMethod: "rrf",
    rrfK: 60,
    topK: 10,
  },
});

const results = await hybridSearch("API authentication methods");
```

### Using Linear Combination fusion

```typescript
import { createHybridSearch } from "@juspay/neurolink";

const hybridSearch = createHybridSearch({
  vectorStore,
  bm25Index,
  indexName: "docs",
  embeddingModel: { provider: "openai", modelName: "text-embedding-3-small" },
});

// Linear combination allows fine-tuning the balance
const results = await hybridSearch("error handling best practices", {
  fusionMethod: "linear",
  vectorWeight: 0.7, // Emphasize semantic similarity
  bm25Weight: 0.3, // Lower weight for keyword matching
  topK: 15,
});
```

### With reranking enabled

```typescript
import { createHybridSearch } from "@juspay/neurolink";

const hybridSearch = createHybridSearch({
  vectorStore,
  bm25Index,
  indexName: "docs",
  embeddingModel: { provider: "openai", modelName: "text-embedding-3-small" },
});

const results = await hybridSearch("how to configure SSL certificates", {
  topK: 20,
  enableReranking: true,
  reranker: {
    model: { provider: "openai", modelName: "gpt-4o-mini" },
    weights: { semantic: 0.5, vector: 0.3, position: 0.2 },
    topK: 5,
  },
});

// Results include reranking scores
results.forEach((r) => {
  console.log(`ID: ${r.id}, Score: ${r.score}`);
  console.log(`  Vector: ${r.scores?.vector}, BM25: ${r.scores?.bm25}`);
  console.log(`  Reranked: ${r.scores?.reranked}`);
});
```

### RAG pipeline integration

```typescript
import { createHybridSearch, RAGPipeline } from "@juspay/neurolink";

async function buildRAGPipeline() {
  const hybridSearch = createHybridSearch({
    vectorStore,
    bm25Index,
    indexName: "knowledge",
    embeddingModel: { provider: "openai", modelName: "text-embedding-3-small" },
  });

  async function retrieveContext(query: string) {
    const results = await hybridSearch(query, {
      fusionMethod: "rrf",
      topK: 5,
    });

    return results.map((r) => r.text).join("\n\n");
  }

  // Use in generation
  const context = await retrieveContext("What is the refund policy?");
  const response = await llm.generate({
    prompt: `Context:\n${context}\n\nQuestion: What is the refund policy?`,
  });
}
```

## Notes

- BM25 excels at keyword/lexical matching while vectors capture semantic similarity
- RRF is generally more robust and doesn't require score normalization
- Linear combination allows fine-grained control over the balance
- Both retrieval methods run in parallel for optimal latency
- When reranking is enabled, more candidates are retrieved then filtered

## Since

v8.44.0

## See Also

- [reciprocalRankFusion](./reciprocalRankFusion.md) - RRF fusion algorithm
- [linearCombination](./linearCombination.md) - Linear score combination
- [rerank](./rerank.md) - Post-retrieval reranking
- [InMemoryBM25Index](../classes/InMemoryBM25Index.md) - In-memory BM25 implementation
- [HybridSearchConfig](../type-aliases/HybridSearchConfig.md) - Configuration type
- [HybridSearchResult](../type-aliases/HybridSearchResult.md) - Result type
