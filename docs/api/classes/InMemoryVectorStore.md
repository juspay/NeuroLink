[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / InMemoryVectorStore

# Class: InMemoryVectorStore

In-memory vector store for development and testing.

**Since**: v8.44.0

Defined in: [rag/retrieval/vectorQueryTool.ts:198](https://github.com/juspay/neurolink/blob/main/src/lib/rag/retrieval/vectorQueryTool.ts#L198)

## Description

InMemoryVectorStore provides a lightweight, in-memory implementation of the `VectorStore` interface
for development, testing, and prototyping RAG pipelines. It supports:

- **Vector storage and retrieval** with cosine similarity search
- **Metadata filtering** with a rich query language supporting logical and comparison operators
- **CRUD operations** for managing vectors (upsert, query, delete)
- **Multiple indexes** for organizing vectors into separate collections
- **No external dependencies** - runs entirely in memory without database setup

This implementation is ideal for:

- Unit and integration testing of RAG pipelines
- Local development without vector database infrastructure
- Prototyping and proof-of-concept applications
- Small-scale applications with limited data

**Note**: For production workloads with large datasets, consider using a dedicated vector database
like Pinecone, Weaviate, Qdrant, or pgvector.

## Implements

- [`VectorStore`](../interfaces/VectorStore.md)

## Constructors

### Constructor

> **new InMemoryVectorStore**(): `InMemoryVectorStore`

Creates a new InMemoryVectorStore instance with empty indexes.

#### Returns

`InMemoryVectorStore`

## Methods

### upsert()

> **upsert**(`indexName`, `items`): `Promise`\<`void`\>

Defined in: [rag/retrieval/vectorQueryTool.ts:207](https://github.com/juspay/neurolink/blob/main/src/lib/rag/retrieval/vectorQueryTool.ts#L207)

Add or update vectors in an index. Creates the index if it doesn't exist.

#### Parameters

##### indexName

`string`

Name of the index to store vectors in

##### items

`Array<{ id: string; vector: number[]; metadata?: Record<string, unknown> }>`

Array of items to upsert, each containing:

- `id` - Unique identifier for the vector
- `vector` - The embedding vector (array of numbers)
- `metadata` - Optional metadata object (can include `text` field for retrieval)

#### Returns

`Promise`\<`void`\>

---

### query()

> **query**(`params`): `Promise`\<[`VectorQueryResult`](../interfaces/VectorQueryResult.md)[]\>

Defined in: [rag/retrieval/vectorQueryTool.ts:231](https://github.com/juspay/neurolink/blob/main/src/lib/rag/retrieval/vectorQueryTool.ts#L231)

Query vectors by similarity using cosine distance.

#### Parameters

##### params

`object`

Query parameters object

##### params.indexName

`string`

Name of the index to search

##### params.queryVector

`number[]`

The query embedding vector to search for

##### params.topK?

`number`

Maximum number of results to return (default: 10)

##### params.filter?

[`MetadataFilter`](../type-aliases/MetadataFilter.md)

Optional metadata filter to narrow results

##### params.includeVectors?

`boolean`

Whether to include vectors in results (default: false)

#### Returns

`Promise`\<[`VectorQueryResult`](../interfaces/VectorQueryResult.md)[]\>

Array of matching results sorted by similarity score (descending)

---

### delete()

> **delete**(`indexName`, `ids`): `Promise`\<`void`\>

Defined in: [rag/retrieval/vectorQueryTool.ts:288](https://github.com/juspay/neurolink/blob/main/src/lib/rag/retrieval/vectorQueryTool.ts#L288)

Delete vectors from an index by their IDs.

#### Parameters

##### indexName

`string`

Name of the index to delete from

##### ids

`string[]`

Array of vector IDs to delete

#### Returns

`Promise`\<`void`\>

## Metadata Filtering

InMemoryVectorStore supports a rich query language for filtering results by metadata.

### Comparison Operators

| Operator    | Description               | Example                             |
| ----------- | ------------------------- | ----------------------------------- |
| `$eq`       | Equal to                  | `{ status: { $eq: "published" } }`  |
| `$ne`       | Not equal to              | `{ status: { $ne: "draft" } }`      |
| `$gt`       | Greater than              | `{ score: { $gt: 0.8 } }`           |
| `$gte`      | Greater than or equal     | `{ count: { $gte: 10 } }`           |
| `$lt`       | Less than                 | `{ price: { $lt: 100 } }`           |
| `$lte`      | Less than or equal        | `{ age: { $lte: 30 } }`             |
| `$in`       | Value in array            | `{ category: { $in: ["a", "b"] } }` |
| `$nin`      | Value not in array        | `{ type: { $nin: ["x", "y"] } }`    |
| `$exists`   | Field exists (or not)     | `{ author: { $exists: true } }`     |
| `$contains` | String contains substring | `{ title: { $contains: "AI" } }`    |
| `$regex`    | String matches regex      | `{ name: { $regex: "^test" } }`     |

### Logical Operators

| Operator | Description                       | Example                                               |
| -------- | --------------------------------- | ----------------------------------------------------- |
| `$and`   | All conditions must match         | `{ $and: [{ a: 1 }, { b: 2 }] }`                      |
| `$or`    | At least one condition must match | `{ $or: [{ status: "active" }, { featured: true }] }` |
| `$not`   | Negates a condition               | `{ $not: { status: "deleted" } }`                     |

### Direct Equality

For simple equality checks, you can use direct field values:

```typescript
const filter = { category: "documentation", version: "2.0" };
```

## Examples

### Basic Usage

```typescript
import { InMemoryVectorStore } from "@juspay/neurolink";

// Create a new store
const store = new InMemoryVectorStore();

// Add vectors with metadata
await store.upsert("documents", [
  {
    id: "doc-1",
    vector: [0.1, 0.2, 0.3, 0.4],
    metadata: {
      text: "Introduction to machine learning",
      category: "tutorial",
      author: "John Doe",
    },
  },
  {
    id: "doc-2",
    vector: [0.2, 0.3, 0.4, 0.5],
    metadata: {
      text: "Advanced neural network architectures",
      category: "research",
      author: "Jane Smith",
    },
  },
]);

// Query for similar vectors
const results = await store.query({
  indexName: "documents",
  queryVector: [0.15, 0.25, 0.35, 0.45],
  topK: 5,
});

console.log(results);
// [
//   { id: "doc-1", score: 0.998, text: "Introduction to...", metadata: {...} },
//   { id: "doc-2", score: 0.995, text: "Advanced neural...", metadata: {...} }
// ]
```

### Using with Embeddings

```typescript
import { InMemoryVectorStore, embed } from "@juspay/neurolink";

const store = new InMemoryVectorStore();

// Generate embeddings for documents
const documents = [
  "The quick brown fox jumps over the lazy dog",
  "Machine learning is a subset of artificial intelligence",
  "Vector databases enable semantic search",
];

for (let i = 0; i < documents.length; i++) {
  const embedding = await embed(documents[i], {
    provider: "OPEN_AI",
    model: "text-embedding-3-small",
  });

  await store.upsert("my-index", [
    {
      id: `doc-${i}`,
      vector: embedding,
      metadata: { text: documents[i] },
    },
  ]);
}

// Search with a query
const queryEmbedding = await embed("What is ML?", {
  provider: "OPEN_AI",
  model: "text-embedding-3-small",
});

const results = await store.query({
  indexName: "my-index",
  queryVector: queryEmbedding,
  topK: 2,
});
```

### Filtering Results

```typescript
import { InMemoryVectorStore } from "@juspay/neurolink";

const store = new InMemoryVectorStore();

// Add documents with rich metadata
await store.upsert("articles", [
  {
    id: "1",
    vector: [0.1, 0.2, 0.3],
    metadata: {
      text: "Getting started with React",
      category: "frontend",
      difficulty: "beginner",
      views: 1500,
    },
  },
  {
    id: "2",
    vector: [0.2, 0.3, 0.4],
    metadata: {
      text: "Advanced TypeScript patterns",
      category: "frontend",
      difficulty: "advanced",
      views: 3200,
    },
  },
  {
    id: "3",
    vector: [0.3, 0.4, 0.5],
    metadata: {
      text: "Building REST APIs with Node.js",
      category: "backend",
      difficulty: "intermediate",
      views: 2100,
    },
  },
]);

// Filter by category
const frontendDocs = await store.query({
  indexName: "articles",
  queryVector: [0.15, 0.25, 0.35],
  filter: { category: "frontend" },
});

// Filter with comparison operators
const popularDocs = await store.query({
  indexName: "articles",
  queryVector: [0.15, 0.25, 0.35],
  filter: { views: { $gte: 2000 } },
});

// Complex filter with logical operators
const advancedOrPopular = await store.query({
  indexName: "articles",
  queryVector: [0.15, 0.25, 0.35],
  filter: {
    $or: [{ difficulty: "advanced" }, { views: { $gt: 3000 } }],
  },
});

// Combine multiple conditions
const specificDocs = await store.query({
  indexName: "articles",
  queryVector: [0.15, 0.25, 0.35],
  filter: {
    $and: [
      { category: "frontend" },
      { difficulty: { $in: ["beginner", "intermediate"] } },
    ],
  },
});
```

### Using with Vector Query Tool

```typescript
import { createVectorQueryTool, InMemoryVectorStore } from "@juspay/neurolink";

// Create and populate the store
const store = new InMemoryVectorStore();
await store.upsert("knowledge-base", vectors);

// Create a query tool
const queryTool = createVectorQueryTool(
  {
    id: "search-docs",
    description: "Search the documentation for relevant information",
    indexName: "knowledge-base",
    embeddingModel: {
      provider: "OPEN_AI",
      modelName: "text-embedding-3-small",
    },
    topK: 5,
    enableFilter: true,
  },
  store,
);

// Use in an agent
const result = await queryTool.execute({
  query: "How do I configure authentication?",
  filter: { category: "security" },
});

console.log(result.relevantContext);
```

### Deleting Vectors

```typescript
import { InMemoryVectorStore } from "@juspay/neurolink";

const store = new InMemoryVectorStore();

// Add some vectors
await store.upsert("temp-index", [
  { id: "a", vector: [1, 2, 3], metadata: {} },
  { id: "b", vector: [4, 5, 6], metadata: {} },
  { id: "c", vector: [7, 8, 9], metadata: {} },
]);

// Delete specific vectors
await store.delete("temp-index", ["a", "c"]);

// Only "b" remains
const results = await store.query({
  indexName: "temp-index",
  queryVector: [4, 5, 6],
});
console.log(results.length); // 1
```

### Testing RAG Pipelines

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryVectorStore, RAGPipeline } from "@juspay/neurolink";

describe("RAG Pipeline", () => {
  let store: InMemoryVectorStore;

  beforeEach(() => {
    // Fresh store for each test
    store = new InMemoryVectorStore();
  });

  it("should retrieve relevant documents", async () => {
    // Seed test data
    await store.upsert("test-index", [
      {
        id: "1",
        vector: [1, 0, 0],
        metadata: { text: "Document about cats" },
      },
      {
        id: "2",
        vector: [0, 1, 0],
        metadata: { text: "Document about dogs" },
      },
    ]);

    // Query for cat-related content
    const results = await store.query({
      indexName: "test-index",
      queryVector: [0.9, 0.1, 0],
      topK: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0].metadata.text).toContain("cats");
  });
});
```

## Notes

- **Similarity metric**: Uses cosine similarity for vector comparison
- **Thread safety**: Not thread-safe; use separate instances for concurrent access in multi-threaded environments
- **Memory usage**: All vectors are stored in memory; consider dataset size accordingly
- **Persistence**: Data is not persisted; all vectors are lost when the process ends
- **Vector dimensions**: Query and stored vectors must have matching dimensions

## See Also

- [VectorStore](../interfaces/VectorStore.md) - Interface implemented by this class
- [VectorQueryResult](../interfaces/VectorQueryResult.md) - Result type returned by query
- [MetadataFilter](../type-aliases/MetadataFilter.md) - Filter type definition
- [createVectorQueryTool](../functions/createVectorQueryTool.md) - Create a vector query tool
- [RAGPipeline](./RAGPipeline.md) - Full RAG pipeline implementation
- [embed](../functions/embed.md) - Generate embeddings for text
