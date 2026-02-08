[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / InMemoryBM25Index

# Class: InMemoryBM25Index

In-memory BM25 index for sparse keyword-based retrieval.

**Since**: v8.44.0

Defined in: [rag/retrieval/hybridSearch.ts:47](https://github.com/juspay/neurolink/blob/main/src/lib/rag/retrieval/hybridSearch.ts#L47)

## Description

InMemoryBM25Index provides an in-memory implementation of the **BM25 (Best Matching 25)** algorithm
for sparse keyword-based document retrieval. It implements the `BM25Index` interface and is designed
for testing, development, and small-to-medium scale applications.

**Key Features:**

- **BM25 scoring algorithm** with configurable k1 and b parameters
- **TF-IDF weighting** with inverse document frequency calculations
- **Simple tokenization** (lowercase, punctuation removal, whitespace splitting)
- **Zero dependencies** - pure TypeScript implementation
- **Async interface** for compatibility with production implementations

The BM25 algorithm is particularly effective for:

- Keyword-based search where exact term matching matters
- Hybrid search systems (combined with vector/semantic search)
- Use cases requiring explainable retrieval (term frequency based)
- Scenarios where semantic similarity alone may miss exact matches

## Implements

- [`BM25Index`](../interfaces/BM25Index.md)

## Constructors

### Constructor

> **new InMemoryBM25Index**(): `InMemoryBM25Index`

Creates a new in-memory BM25 index with default parameters.

**Default BM25 Parameters:**

- `k1 = 1.5` - Term frequency saturation parameter
- `b = 0.75` - Document length normalization parameter

#### Returns

`InMemoryBM25Index`

## Methods

### search()

> **search**(`query`, `topK?`): `Promise`\<[`BM25Result`](../type-aliases/BM25Result.md)[]\>

Defined in: [rag/retrieval/hybridSearch.ts:56](https://github.com/juspay/neurolink/blob/main/src/lib/rag/retrieval/hybridSearch.ts#L56)

Search documents using the BM25 algorithm.

The search process:

1. Tokenizes the query into terms
2. Calculates IDF (Inverse Document Frequency) for each query term
3. Computes BM25 score for each document using the formula:
   ```
   score = SUM(IDF(qi) * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / avgdl))))
   ```
4. Returns top-K results sorted by score descending

#### Parameters

##### query

`string`

Search query string

##### topK?

`number`

Number of results to return (default: 10)

#### Returns

`Promise`\<[`BM25Result`](../type-aliases/BM25Result.md)[]\>

Array of BM25 results sorted by relevance score

---

### addDocuments()

> **addDocuments**(`documents`): `Promise`\<`void`\>

Defined in: [rag/retrieval/hybridSearch.ts:114](https://github.com/juspay/neurolink/blob/main/src/lib/rag/retrieval/hybridSearch.ts#L114)

Add documents to the BM25 index.

Each document is:

1. Tokenized (lowercase, punctuation removed, whitespace split)
2. Stored with its tokens and metadata
3. Used to recalculate the average document length for BM25 scoring

#### Parameters

##### documents

`Array<{ id: string; text: string; metadata?: Record<string, unknown> }>`

Array of documents to index

| Property    | Type                      | Description                                  |
| ----------- | ------------------------- | -------------------------------------------- |
| `id`        | `string`                  | Unique document identifier                   |
| `text`      | `string`                  | Document text content to index               |
| `metadata?` | `Record<string, unknown>` | Optional metadata to store with the document |

#### Returns

`Promise`\<`void`\>

## Examples

### Basic Usage

```typescript
import { InMemoryBM25Index } from "@juspay/neurolink";

// Create a new BM25 index
const bm25Index = new InMemoryBM25Index();

// Add documents to the index
await bm25Index.addDocuments([
  {
    id: "doc1",
    text: "Machine learning is a subset of artificial intelligence",
    metadata: { category: "AI" },
  },
  {
    id: "doc2",
    text: "Deep learning uses neural networks with multiple layers",
    metadata: { category: "AI" },
  },
  {
    id: "doc3",
    text: "Natural language processing enables text understanding",
    metadata: { category: "NLP" },
  },
]);

// Search the index
const results = await bm25Index.search("machine learning", 5);

console.log(results);
// [
//   { id: "doc1", score: 1.234, text: "Machine learning is...", metadata: {...} },
//   { id: "doc2", score: 0.567, text: "Deep learning uses...", metadata: {...} },
// ]
```

### Hybrid Search with Vector Store

```typescript
import {
  InMemoryBM25Index,
  createHybridSearch,
  PgVectorStore,
} from "@juspay/neurolink";

// Create BM25 index
const bm25Index = new InMemoryBM25Index();

// Add documents to BM25 index
await bm25Index.addDocuments(documents);

// Create hybrid search function
const hybridSearch = createHybridSearch({
  vectorStore: pgVectorStore,
  bm25Index,
  indexName: "my_embeddings",
  embeddingModel: {
    provider: "OPEN_AI",
    modelName: "text-embedding-3-small",
  },
  defaultConfig: {
    vectorWeight: 0.5,
    bm25Weight: 0.5,
    fusionMethod: "rrf", // Reciprocal Rank Fusion
  },
});

// Execute hybrid search
const results = await hybridSearch("What is machine learning?", {
  topK: 10,
  enableReranking: true,
});
```

### Using with RAG Pipeline

```typescript
import { RAGPipeline, InMemoryBM25Index } from "@juspay/neurolink";

// Create pipeline with custom BM25 index
const pipeline = new RAGPipeline({
  vectorStore: myVectorStore,
  bm25Index: new InMemoryBM25Index(),
  embeddingModel: {
    provider: "OPEN_AI",
    modelName: "text-embedding-3-small",
  },
  enableHybridSearch: true,
});

// Documents are automatically indexed in both vector and BM25 stores
await pipeline.ingest(documents);

// Query uses hybrid search
const results = await pipeline.query("search query");
```

### Batch Document Indexing

```typescript
import { InMemoryBM25Index } from "@juspay/neurolink";

const bm25Index = new InMemoryBM25Index();

// Index documents in batches
const batchSize = 100;
for (let i = 0; i < documents.length; i += batchSize) {
  const batch = documents.slice(i, i + batchSize);
  await bm25Index.addDocuments(
    batch.map((doc, idx) => ({
      id: `doc-${i + idx}`,
      text: doc.content,
      metadata: { source: doc.source, page: doc.page },
    })),
  );
}

// Search with metadata preserved
const results = await bm25Index.search("specific keywords", 20);
results.forEach((r) => {
  console.log(`[${r.metadata?.source}] Score: ${r.score.toFixed(3)}`);
});
```

## BM25 Algorithm Details

The BM25 scoring formula used:

```
score(D, Q) = SUM[i=1..n]( IDF(qi) * (f(qi, D) * (k1 + 1)) / (f(qi, D) + k1 * (1 - b + b * |D| / avgdl)) )
```

Where:

- `f(qi, D)` = frequency of term qi in document D
- `|D|` = length of document D (in tokens)
- `avgdl` = average document length across the collection
- `k1` = term frequency saturation parameter (default: 1.5)
- `b` = length normalization parameter (default: 0.75)
- `IDF(qi)` = log((N - n(qi) + 0.5) / (n(qi) + 0.5) + 1)
- `N` = total number of documents
- `n(qi)` = number of documents containing term qi

## Notes

- **Tokenization**: Uses simple whitespace tokenization with lowercase conversion and punctuation removal. For production use cases requiring stemming, stop word removal, or language-specific tokenization, consider implementing a custom `BM25Index`.

- **Memory Usage**: All documents and their tokens are stored in memory. For large collections (100K+ documents), consider using a persistent BM25 implementation like Elasticsearch or a specialized library.

- **Thread Safety**: The index is not thread-safe. In concurrent environments, synchronize access or use separate instances.

- **Incremental Updates**: Documents can be added incrementally; the average document length is recalculated on each `addDocuments` call.

## See Also

- [BM25Index](../interfaces/BM25Index.md) - Interface for BM25 implementations
- [BM25Result](../type-aliases/BM25Result.md) - Result type returned by search
- [HybridSearchConfig](../type-aliases/HybridSearchConfig.md) - Configuration for hybrid search
- [createHybridSearch](../functions/createHybridSearch.md) - Create hybrid search function
- [RAGPipeline](./RAGPipeline.md) - Pipeline with integrated hybrid search
- [reciprocalRankFusion](../functions/reciprocalRankFusion.md) - RRF fusion method
- [linearCombination](../functions/linearCombination.md) - Linear combination fusion method
