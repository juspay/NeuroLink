[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / createVectorQueryTool

# Function: createVectorQueryTool()

> **createVectorQueryTool**(`config`, `vectorStore`): `Tool`

Defined in: [rag/retrieval/vectorQueryTool.ts:42](https://github.com/juspay/neurolink/blob/main/src/lib/rag/retrieval/vectorQueryTool.ts#L42)

Creates a vector query tool for semantic search that can be used with NeuroLink's generate() and stream() APIs.

**Since**: v8.44.0

## Signature

```typescript
function createVectorQueryTool(
  config: VectorQueryToolConfig,
  vectorStore: VectorStore | ((context: RequestContext) => VectorStore),
): Tool;
```

## Parameters

| Parameter   | Type                                                        | Description                                                      |
| ----------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| config      | `VectorQueryToolConfig`                                     | Tool configuration options                                       |
| vectorStore | `VectorStore \| ((context: RequestContext) => VectorStore)` | Vector store instance or factory function for dynamic resolution |

## Returns

`Tool`

A tool object with `name`, `description`, `parameters`, and `execute` method compatible with NeuroLink's generate() and stream() APIs.

## Configuration Options

The `VectorQueryToolConfig` type accepts the following properties:

| Property          | Type                                      | Required | Default                          | Description                                  |
| ----------------- | ----------------------------------------- | -------- | -------------------------------- | -------------------------------------------- |
| `id`              | `string`                                  | No       | `vector-query-{uuid}`            | Unique tool identifier                       |
| `description`     | `string`                                  | No       | `"Access the knowledge base..."` | Tool description shown to AI agents          |
| `indexName`       | `string`                                  | **Yes**  | -                                | Index name within the vector store           |
| `embeddingModel`  | `{ provider: string; modelName: string }` | **Yes**  | -                                | Embedding model specification                |
| `enableFilter`    | `boolean`                                 | No       | `false`                          | Enable metadata filtering in tool parameters |
| `includeVectors`  | `boolean`                                 | No       | `false`                          | Include embedding vectors in results         |
| `includeSources`  | `boolean`                                 | No       | `true`                           | Include full source objects in results       |
| `topK`            | `number`                                  | No       | `10`                             | Number of results to return                  |
| `reranker`        | `RerankerConfig`                          | No       | -                                | Reranker configuration for result refinement |
| `providerOptions` | `VectorProviderOptions`                   | No       | -                                | Provider-specific query options              |

### RerankerConfig

| Property  | Type                                                        | Description                       |
| --------- | ----------------------------------------------------------- | --------------------------------- |
| `model`   | `{ provider: string; modelName: string }`                   | Language model for reranking      |
| `weights` | `{ semantic?: number; vector?: number; position?: number }` | Scoring weights                   |
| `topK`    | `number`                                                    | Number of results after reranking |

### VectorProviderOptions

Provider-specific options for Pinecone, pgVector, and Chroma:

```typescript
type VectorProviderOptions = {
  pinecone?: {
    namespace?: string;
    sparseVector?: number[];
  };
  pgVector?: {
    minScore?: number;
    ef?: number;
    probes?: number;
  };
  chroma?: {
    where?: Record<string, unknown>;
    whereDocument?: Record<string, unknown>;
  };
};
```

## Examples

### Basic usage

```typescript
import { createVectorQueryTool, InMemoryVectorStore, generate } from "@juspay/neurolink";

const vectorStore = new InMemoryVectorStore();

// Pre-populate with data
await vectorStore.upsert("knowledge-base", [
  { id: "doc1", vector: [0.1, 0.2, ...], metadata: { text: "Paris is the capital of France." } },
  { id: "doc2", vector: [0.3, 0.4, ...], metadata: { text: "London is the capital of England." } },
]);

const queryTool = createVectorQueryTool(
  {
    indexName: "knowledge-base",
    embeddingModel: {
      provider: "openai",
      modelName: "text-embedding-3-small",
    },
  },
  vectorStore
);

// Use with generate()
const response = await generate({
  model: openai("gpt-4"),
  tools: { knowledgeSearch: queryTool },
  prompt: "What is the capital of France?",
});
```

### With reranking

```typescript
import { createVectorQueryTool } from "@juspay/neurolink";

const queryTool = createVectorQueryTool(
  {
    id: "docs-search",
    description: "Search the documentation for relevant information",
    indexName: "documentation",
    embeddingModel: {
      provider: "openai",
      modelName: "text-embedding-3-large",
    },
    topK: 20, // Fetch more results initially
    reranker: {
      model: {
        provider: "openai",
        modelName: "gpt-4o-mini",
      },
      weights: {
        semantic: 0.6,
        vector: 0.3,
        position: 0.1,
      },
      topK: 5, // Return top 5 after reranking
    },
  },
  vectorStore,
);
```

### With metadata filtering

```typescript
import { createVectorQueryTool, generate } from "@juspay/neurolink";

const queryTool = createVectorQueryTool(
  {
    id: "filtered-search",
    indexName: "products",
    embeddingModel: {
      provider: "openai",
      modelName: "text-embedding-3-small",
    },
    enableFilter: true, // Enable filter parameter for the tool
    topK: 10,
  },
  vectorStore,
);

// The AI can now use filters when calling the tool
const response = await generate({
  model: openai("gpt-4"),
  tools: { productSearch: queryTool },
  prompt: "Find electronics products under $100",
});

// Or call the tool directly with filters
const results = await queryTool.execute({
  query: "wireless headphones",
  filter: {
    category: "electronics",
    price: { $lt: 100 },
    $or: [{ brand: "Sony" }, { brand: "Bose" }],
  },
  topK: 5,
});
```

### Dynamic vector store resolution

```typescript
import { createVectorQueryTool, generate } from "@juspay/neurolink";

// Factory function for multi-tenant scenarios
const vectorStoreFactory = (context: RequestContext) => {
  const tenantId = context.tenantId;
  return getTenantVectorStore(tenantId); // Returns tenant-specific store
};

const queryTool = createVectorQueryTool(
  {
    id: "tenant-search",
    indexName: "documents",
    embeddingModel: {
      provider: "openai",
      modelName: "text-embedding-3-small",
    },
  },
  vectorStoreFactory,
);

// Context is passed during execution
const results = await queryTool.execute(
  { query: "quarterly report" },
  { tenantId: "tenant-123", userId: "user-456" },
);
```

### With provider-specific options

```typescript
import { createVectorQueryTool } from "@juspay/neurolink";

// Pinecone with namespace
const pineconeQueryTool = createVectorQueryTool(
  {
    indexName: "my-index",
    embeddingModel: {
      provider: "openai",
      modelName: "text-embedding-3-small",
    },
    providerOptions: {
      pinecone: {
        namespace: "production",
      },
    },
  },
  pineconeStore,
);

// pgVector with minimum score threshold
const pgVectorQueryTool = createVectorQueryTool(
  {
    indexName: "documents",
    embeddingModel: {
      provider: "openai",
      modelName: "text-embedding-3-small",
    },
    providerOptions: {
      pgVector: {
        minScore: 0.7,
        probes: 10,
      },
    },
  },
  pgVectorStore,
);
```

## Response Format

The tool returns a `VectorQueryResponse` object:

```typescript
type VectorQueryResponse = {
  /** Formatted relevant context string */
  relevantContext: string;
  /** Source query results (if includeSources is true) */
  sources: VectorQueryResult[];
  /** Total results found */
  totalResults: number;
  /** Query metadata */
  metadata: {
    queryTime: number;
    reranked: boolean;
    filtered: boolean;
  };
};
```

## Metadata Filter Syntax

When `enableFilter` is true, the tool accepts MongoDB/Sift-style query syntax:

```typescript
// Comparison operators
{
  field: {
    $eq: value;
  }
} // Equal
{
  field: {
    $ne: value;
  }
} // Not equal
{
  field: {
    $gt: 10;
  }
} // Greater than
{
  field: {
    $gte: 10;
  }
} // Greater than or equal
{
  field: {
    $lt: 10;
  }
} // Less than
{
  field: {
    $lte: 10;
  }
} // Less than or equal
{
  field: {
    $in: [1, 2];
  }
} // In array
{
  field: {
    $nin: [1, 2];
  }
} // Not in array

// Logical operators
{
  $and: [filter1, filter2];
}
{
  $or: [filter1, filter2];
}
{
  $not: filter;
}

// Special operators
{
  field: {
    $exists: true;
  }
}
{
  field: {
    $contains: "text";
  }
}
{
  field: {
    $regex: "pattern";
  }
}

// Direct equality (shorthand)
{
  category: "electronics";
}
```

## Notes

- The tool automatically generates embeddings for the query using the specified embedding model
- Results are formatted as numbered context for easy reference by AI models
- When using reranking, consider fetching more initial results (higher `topK`) and then reducing with the reranker's `topK`
- The dynamic vector store factory is useful for multi-tenant applications or per-request store selection
- Query timing and reranking status are included in the response metadata for observability

## See Also

- [InMemoryVectorStore](../classes/InMemoryVectorStore.md) - Built-in vector store for testing
- [VectorQueryToolConfig](../type-aliases/VectorQueryToolConfig.md) - Configuration type reference
- [generate](./generateText.md) - Using tools with the generate API
- [createReranker](./createReranker.md) - Creating standalone rerankers
- [createHybridSearch](./createHybridSearch.md) - Hybrid vector + BM25 search
