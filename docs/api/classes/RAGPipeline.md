[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / RAGPipeline

# Class: RAGPipeline

Defined in: [src/lib/rag/pipeline/RAGPipeline.ts:183](https://github.com/juspay/neurolink/blob/main/src/lib/rag/pipeline/RAGPipeline.ts#L183)

End-to-end RAG pipeline orchestrator for document ingestion, retrieval, and response generation.

## Description

RAGPipeline coordinates all RAG operations from document loading through LLM response generation. It provides a complete Retrieval-Augmented Generation workflow including:

- Document loading and preprocessing from files, URLs, or MDocument instances
- Configurable chunking strategies (recursive, sentence, paragraph, markdown, etc.)
- Embedding generation with any supported AI provider
- Vector storage and retrieval with optional metadata filtering
- Hybrid search combining vector similarity with BM25 keyword matching
- Graph RAG for relationship-aware retrieval
- Result reranking for improved relevance
- Context assembly for LLM queries
- Response generation with source citations

## Examples

### Basic Pipeline

```typescript
import { RAGPipeline } from "@juspay/neurolink";

const pipeline = new RAGPipeline({
  embeddingModel: { provider: "openai", modelName: "text-embedding-3-small" },
  generationModel: { provider: "openai", modelName: "gpt-4o-mini" },
});

// Ingest documents
await pipeline.ingest(["./docs/guide.md", "./docs/api.md"]);

// Query with RAG
const response = await pipeline.query("What are the key features?");
console.log(response.answer);
console.log(response.sources);
```

### With Hybrid Search and Reranking

```typescript
const pipeline = new RAGPipeline({
  embeddingModel: { provider: "openai", modelName: "text-embedding-3-small" },
  generationModel: { provider: "openai", modelName: "gpt-4o-mini" },
  enableHybridSearch: true,
  enableReranking: true,
  rerankingModel: { provider: "openai", modelName: "text-embedding-3-small" },
});

await pipeline.ingest(["./knowledge-base/**/*.md"]);
const response = await pipeline.query("How do I configure authentication?", {
  hybrid: true,
  rerank: true,
  topK: 10,
});
```

### With Graph RAG

```typescript
const pipeline = new RAGPipeline({
  embeddingModel: { provider: "openai", modelName: "text-embedding-3-small" },
  generationModel: { provider: "anthropic", modelName: "claude-3-sonnet" },
  enableGraphRAG: true,
  graphThreshold: 0.75,
});

await pipeline.ingest(documents);
const response = await pipeline.query("What entities are related to X?", {
  graph: true,
});
```

### Custom Configuration

```typescript
const pipeline = new RAGPipeline({
  embeddingModel: { provider: "vertex", modelName: "textembedding-gecko" },
  generationModel: {
    provider: "vertex",
    modelName: "gemini-1.5-pro",
    temperature: 0.3,
    maxTokens: 2000,
  },
  vectorStore: myCustomVectorStore,
  indexName: "my-knowledge-base",
  defaultChunkingStrategy: "markdown",
  defaultChunkSize: 1500,
  defaultChunkOverlap: 300,
  defaultTopK: 10,
});
```

## See

- [MDocument](./MDocument.md) for document handling
- [RAGPipelineConfig](#configuration) for all configuration options
- [createRAGPipeline](#createragpipeline) for simplified pipeline creation

## Since

8.44.0

## Constructors

### Constructor

> **new RAGPipeline**(`config`): `RAGPipeline`

Defined in: [src/lib/rag/pipeline/RAGPipeline.ts:195](https://github.com/juspay/neurolink/blob/main/src/lib/rag/pipeline/RAGPipeline.ts#L195)

Creates a new RAGPipeline instance with the specified configuration.

#### Parameters

| Parameter | Type                                      | Description                    |
| --------- | ----------------------------------------- | ------------------------------ |
| `config`  | [`RAGPipelineConfig`](#ragpipelineconfig) | Pipeline configuration options |

#### Returns

`RAGPipeline`

#### Example

```typescript
const pipeline = new RAGPipeline({
  embeddingModel: { provider: "openai", modelName: "text-embedding-3-small" },
  generationModel: { provider: "openai", modelName: "gpt-4o-mini" },
});
```

## Methods

### initialize()

> **initialize**(): `Promise<void>`

Defined in: [src/lib/rag/pipeline/RAGPipeline.ts:225](https://github.com/juspay/neurolink/blob/main/src/lib/rag/pipeline/RAGPipeline.ts#L225)

Initialize the pipeline by loading AI providers. Called automatically on first use.

#### Returns

`Promise<void>`

---

### ingest()

> **ingest**(`sources`, `options?`): `Promise<{ documentsProcessed: number; chunksCreated: number }>`

Defined in: [src/lib/rag/pipeline/RAGPipeline.ts:259](https://github.com/juspay/neurolink/blob/main/src/lib/rag/pipeline/RAGPipeline.ts#L259)

Ingests documents into the pipeline. Performs the complete ingestion workflow:

1. Loads documents from file paths, URLs, or MDocument instances
2. Chunks documents using the configured strategy
3. Optionally extracts metadata using LLM
4. Generates embeddings for all chunks
5. Stores chunks in vector store and BM25 index
6. Updates Graph RAG if enabled

#### Parameters

| Parameter  | Type                              | Description                                       |
| ---------- | --------------------------------- | ------------------------------------------------- |
| `sources`  | `Array<string \| MDocument>`      | Array of file paths, URLs, or MDocument instances |
| `options?` | [`IngestOptions`](#ingestoptions) | Optional ingestion configuration                  |

#### Returns

`Promise<{ documentsProcessed: number; chunksCreated: number }>`

Object containing counts of processed documents and created chunks

#### Example

```typescript
// Ingest from file paths
const result = await pipeline.ingest([
  "./docs/guide.md",
  "./docs/api.md",
  "https://example.com/content.html",
]);
console.log(
  `Processed ${result.documentsProcessed} documents, ${result.chunksCreated} chunks`,
);

// Ingest with custom options
await pipeline.ingest(sources, {
  strategy: "markdown",
  chunkSize: 1500,
  chunkOverlap: 200,
  metadata: { source: "documentation", version: "2.0" },
  extractMetadata: true,
});

// Ingest MDocument instances
const doc = new MDocument({ text: "My content", metadata: { type: "manual" } });
await pipeline.ingest([doc]);
```

---

### query()

> **query**(`query`, `options?`): `Promise<RAGResponse>`

Defined in: [src/lib/rag/pipeline/RAGPipeline.ts:384](https://github.com/juspay/neurolink/blob/main/src/lib/rag/pipeline/RAGPipeline.ts#L384)

Queries the pipeline and generates a response with sources. Performs:

1. Generates embedding for the query
2. Retrieves relevant chunks using vector, hybrid, or graph search
3. Optionally reranks results for better relevance
4. Assembles context from retrieved chunks
5. Generates answer using LLM (if configured)

#### Parameters

| Parameter  | Type                            | Description                  |
| ---------- | ------------------------------- | ---------------------------- |
| `query`    | `string`                        | The search query             |
| `options?` | [`QueryOptions`](#queryoptions) | Optional query configuration |

#### Returns

`Promise<RAGResponse>`

RAG response with answer, context, sources, and metadata

#### Example

```typescript
// Basic query
const response = await pipeline.query("What are the main features?");
console.log(response.answer);
console.log(response.sources);

// Query with options
const response = await pipeline.query("How do I configure auth?", {
  topK: 10,
  hybrid: true,
  rerank: true,
  filter: { type: "documentation" },
  systemPrompt: "You are a helpful technical assistant.",
  temperature: 0.5,
});

// Retrieval only (no generation)
const response = await pipeline.query("authentication", {
  generate: false,
  topK: 20,
});
console.log(response.context);
```

---

### getStats()

> **getStats**(): `PipelineStats`

Defined in: [src/lib/rag/pipeline/RAGPipeline.ts:498](https://github.com/juspay/neurolink/blob/main/src/lib/rag/pipeline/RAGPipeline.ts#L498)

Get pipeline statistics including document counts and feature status.

#### Returns

[`PipelineStats`](#pipelinestats)

Statistics about the pipeline state

#### Example

```typescript
const stats = pipeline.getStats();
console.log(`Documents: ${stats.totalDocuments}`);
console.log(`Chunks: ${stats.totalChunks}`);
console.log(`Hybrid search: ${stats.hybridSearchEnabled}`);
console.log(`Graph RAG: ${stats.graphRAGEnabled}`);
```

---

### getId()

> **getId**(): `string`

Defined in: [src/lib/rag/pipeline/RAGPipeline.ts:512](https://github.com/juspay/neurolink/blob/main/src/lib/rag/pipeline/RAGPipeline.ts#L512)

Get the unique pipeline identifier.

#### Returns

`string`

Pipeline ID

---

### clear()

> **clear**(): `Promise<void>`

Defined in: [src/lib/rag/pipeline/RAGPipeline.ts:519](https://github.com/juspay/neurolink/blob/main/src/lib/rag/pipeline/RAGPipeline.ts#L519)

Clear all indexed data from the pipeline. Removes all documents, chunks, and graph data.

#### Returns

`Promise<void>`

#### Example

```typescript
await pipeline.clear();
console.log(pipeline.getStats().totalDocuments); // 0
```

## Configuration

### RAGPipelineConfig

Configuration options for RAGPipeline constructor.

| Option                    | Type                    | Default               | Description                               |
| ------------------------- | ----------------------- | --------------------- | ----------------------------------------- |
| `id`                      | `string`                | auto-generated        | Unique pipeline identifier                |
| `vectorStore`             | `VectorStore`           | `InMemoryVectorStore` | Vector storage backend for embeddings     |
| `bm25Index`               | `BM25Index`             | `InMemoryBM25Index`   | BM25 index for keyword search             |
| `indexName`               | `string`                | `"default"`           | Name of the index in the vector store     |
| `embeddingModel`          | `EmbeddingModelConfig`  | **required**          | Embedding model configuration             |
| `generationModel`         | `GenerationModelConfig` | -                     | LLM configuration for response generation |
| `defaultChunkingStrategy` | `ChunkingStrategy`      | `"recursive"`         | Default chunking strategy                 |
| `defaultChunkSize`        | `number`                | `1000`                | Default maximum chunk size in characters  |
| `defaultChunkOverlap`     | `number`                | `200`                 | Default overlap between chunks            |
| `enableHybridSearch`      | `boolean`               | `false`               | Enable BM25 + vector hybrid search        |
| `enableGraphRAG`          | `boolean`               | `false`               | Enable knowledge graph retrieval          |
| `graphThreshold`          | `number`                | `0.7`                 | Similarity threshold for graph edges      |
| `defaultTopK`             | `number`                | `5`                   | Default number of results to retrieve     |
| `enableReranking`         | `boolean`               | `false`               | Enable result reranking                   |
| `rerankingModel`          | `EmbeddingModelConfig`  | -                     | Model configuration for reranking         |

### EmbeddingModelConfig

| Option      | Type     | Description                                              |
| ----------- | -------- | -------------------------------------------------------- |
| `provider`  | `string` | AI provider name (e.g., "openai", "vertex", "anthropic") |
| `modelName` | `string` | Model identifier (e.g., "text-embedding-3-small")        |

### GenerationModelConfig

| Option        | Type     | Default | Description                |
| ------------- | -------- | ------- | -------------------------- |
| `provider`    | `string` | -       | AI provider name           |
| `modelName`   | `string` | -       | Model identifier           |
| `temperature` | `number` | `0.7`   | Generation temperature     |
| `maxTokens`   | `number` | `1000`  | Maximum tokens in response |

### IngestOptions

| Option            | Type                      | Description                                |
| ----------------- | ------------------------- | ------------------------------------------ |
| `strategy`        | `ChunkingStrategy`        | Override default chunking strategy         |
| `chunkSize`       | `number`                  | Override default chunk size                |
| `chunkOverlap`    | `number`                  | Override default chunk overlap             |
| `metadata`        | `Record<string, unknown>` | Custom metadata to add to chunks           |
| `extractMetadata` | `boolean`                 | Extract title, summary, keywords using LLM |

### QueryOptions

| Option           | Type                      | Default            | Description                   |
| ---------------- | ------------------------- | ------------------ | ----------------------------- |
| `topK`           | `number`                  | config default     | Number of chunks to retrieve  |
| `hybrid`         | `boolean`                 | config default     | Use hybrid search             |
| `graph`          | `boolean`                 | config default     | Use Graph RAG                 |
| `rerank`         | `boolean`                 | config default     | Enable reranking              |
| `filter`         | `Record<string, unknown>` | -                  | Metadata filter for retrieval |
| `includeSources` | `boolean`                 | `true`             | Include sources in response   |
| `generate`       | `boolean`                 | `true`             | Generate LLM response         |
| `systemPrompt`   | `string`                  | default RAG prompt | Custom system prompt          |
| `temperature`    | `number`                  | config default     | Generation temperature        |

## Response Types

### RAGResponse

| Property   | Type                  | Description                             |
| ---------- | --------------------- | --------------------------------------- |
| `answer`   | `string \| undefined` | Generated answer (if generate=true)     |
| `context`  | `string`              | Assembled context from retrieved chunks |
| `sources`  | `Array<Source>`       | Retrieved source chunks with scores     |
| `metadata` | `ResponseMetadata`    | Query execution metadata                |

### Source

| Property   | Type                      | Description        |
| ---------- | ------------------------- | ------------------ |
| `id`       | `string`                  | Chunk identifier   |
| `text`     | `string`                  | Chunk text content |
| `score`    | `number`                  | Relevance score    |
| `metadata` | `Record<string, unknown>` | Chunk metadata     |

### ResponseMetadata

| Property          | Type      | Description                               |
| ----------------- | --------- | ----------------------------------------- |
| `queryTime`       | `number`  | Total query time in milliseconds          |
| `retrievalMethod` | `string`  | Method used ("vector", "hybrid", "graph") |
| `chunksRetrieved` | `number`  | Number of chunks retrieved                |
| `reranked`        | `boolean` | Whether results were reranked             |

### PipelineStats

| Property              | Type                  | Description                  |
| --------------------- | --------------------- | ---------------------------- |
| `totalDocuments`      | `number`              | Number of ingested documents |
| `totalChunks`         | `number`              | Total number of chunks       |
| `indexName`           | `string`              | Vector store index name      |
| `embeddingDimension`  | `number \| undefined` | Embedding vector dimension   |
| `hybridSearchEnabled` | `boolean`             | Hybrid search status         |
| `graphRAGEnabled`     | `boolean`             | Graph RAG status             |

## Factory Function

### createRAGPipeline()

> **createRAGPipeline**(`options`): `RAGPipeline`

Defined in: [src/lib/rag/pipeline/RAGPipeline.ts:622](https://github.com/juspay/neurolink/blob/main/src/lib/rag/pipeline/RAGPipeline.ts#L622)

Create a simple RAG pipeline with sensible defaults.

#### Parameters

| Parameter                 | Type      | Default                    | Description                              |
| ------------------------- | --------- | -------------------------- | ---------------------------------------- |
| `options.provider`        | `string`  | `"openai"`                 | AI provider for embedding and generation |
| `options.embeddingModel`  | `string`  | `"text-embedding-3-small"` | Embedding model name                     |
| `options.generationModel` | `string`  | -                          | Generation model name                    |
| `options.enableHybrid`    | `boolean` | `false`                    | Enable hybrid search                     |
| `options.enableGraph`     | `boolean` | `false`                    | Enable Graph RAG                         |

#### Returns

`RAGPipeline`

Configured RAGPipeline instance

#### Example

```typescript
import { createRAGPipeline } from "@juspay/neurolink";

// Simple pipeline
const pipeline = createRAGPipeline({
  generationModel: "gpt-4o-mini",
});

// With hybrid search
const pipeline = createRAGPipeline({
  provider: "openai",
  embeddingModel: "text-embedding-3-large",
  generationModel: "gpt-4o",
  enableHybrid: true,
});
```

## See Also

- [MDocument](./MDocument.md) - Document representation and operations
- [InMemoryVectorStore](./InMemoryVectorStore.md) - Default vector storage
- [InMemoryBM25Index](./InMemoryBM25Index.md) - BM25 keyword index
- [GraphRAG](./GraphRAG.md) - Knowledge graph retrieval
- [ChunkingStrategy](../type-aliases/ChunkingStrategy.md) - Available chunking strategies
