[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / GraphRAG

# Class: GraphRAG

Graph-based Retrieval-Augmented Generation using Random Walk with Restart algorithm.

**Since**: v8.44.0

Defined in: [src/lib/rag/graphRag/graphRAG.ts:29](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L29)

## Description

GraphRAG creates a knowledge graph from document chunks where nodes represent documents and edges represent semantic relationships based on embedding similarity. It uses the Random Walk with Restart (RWR) algorithm to find contextually relevant documents that may not be directly similar to the query but are semantically connected through the graph structure.

Key features:

- **Knowledge Graph Construction**: Automatically builds a graph from document chunks and their embeddings
- **Semantic Edge Creation**: Creates edges between nodes based on cosine similarity above a configurable threshold
- **Random Walk with Restart**: Uses RWR algorithm for context-aware retrieval that considers graph topology
- **Incremental Updates**: Supports adding and removing individual nodes without rebuilding the entire graph
- **Graph Analysis**: Provides statistics and connected component analysis
- **Serialization**: Full support for saving and loading graphs via JSON

## Examples

### Basic Graph Creation and Querying

```typescript
import { GraphRAG } from "@juspay/neurolink";

// Create a new graph with default configuration
const graph = new GraphRAG();

// Prepare document chunks and their embeddings
const chunks = [
  {
    text: "Neural networks are computational models...",
    metadata: { source: "ml-guide.md" },
  },
  {
    text: "Deep learning extends neural networks...",
    metadata: { source: "ml-guide.md" },
  },
  {
    text: "Transformers use attention mechanisms...",
    metadata: { source: "transformers.md" },
  },
];

const embeddings = await embeddingModel.embedMany(chunks.map((c) => c.text));
const graphEmbeddings = embeddings.map((vector) => ({ vector }));

// Build the knowledge graph
graph.createGraph(chunks, graphEmbeddings);

// Query the graph with an embedding vector
const queryEmbedding = await embeddingModel.embed(
  "How do neural networks work?",
);
const results = graph.query({
  query: queryEmbedding,
  topK: 5,
});

results.forEach((result) => {
  console.log(
    `Score: ${result.score.toFixed(3)} - ${result.content.substring(0, 50)}...`,
  );
});
```

### Custom Configuration

```typescript
const graph = new GraphRAG({
  dimension: 1536, // OpenAI embedding dimension
  threshold: 0.75, // Higher threshold = fewer, stronger edges
});

graph.createGraph(chunks, embeddings);

// Query with custom random walk parameters
const results = graph.query({
  query: queryEmbedding,
  topK: 10,
  randomWalkSteps: 200, // More steps for larger graphs
  restartProb: 0.2, // Higher restart = more weight on initial similarity
});
```

### Incremental Graph Updates

```typescript
const graph = new GraphRAG({ threshold: 0.7 });
graph.createGraph(initialChunks, initialEmbeddings);

// Add a new document chunk
const newChunk = {
  text: "BERT is a transformer-based model...",
  metadata: { source: "bert.md" },
};
const newEmbedding = await embeddingModel.embed(newChunk.text);
const nodeId = graph.addNode(newChunk, { vector: newEmbedding });

console.log(`Added node: ${nodeId}`);

// Later, remove the node if needed
const removed = graph.removeNode(nodeId);
console.log(`Node removed: ${removed}`);
```

### Graph Persistence

```typescript
// Save graph to JSON
const graphData = graph.toJSON();
await fs.writeFile("knowledge-graph.json", JSON.stringify(graphData));

// Load graph from JSON
const loadedData = JSON.parse(
  await fs.readFile("knowledge-graph.json", "utf-8"),
);
const restoredGraph = GraphRAG.fromJSON(loadedData);

// Continue querying
const results = restoredGraph.query({ query: queryEmbedding, topK: 5 });
```

### Graph Analysis

```typescript
// Get graph statistics
const stats = graph.getStats();
console.log(`Nodes: ${stats.nodeCount}`);
console.log(`Edges: ${stats.edgeCount}`);
console.log(`Average degree: ${stats.avgDegree.toFixed(2)}`);
console.log(`Similarity threshold: ${stats.threshold}`);

// Find disconnected components (useful for understanding graph structure)
const components = graph.findConnectedComponents();
console.log(`Connected components: ${components.length}`);
components.forEach((component, i) => {
  console.log(`  Component ${i + 1}: ${component.length} nodes`);
});

// Adjust threshold and rebuild edges
graph.updateThreshold(0.8); // Increase threshold for sparser graph
```

## Constructors

### Constructor

> **new GraphRAG**(`config?`): `GraphRAG`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:35](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L35)

Creates a new GraphRAG instance with the specified configuration.

#### Parameters

| Parameter | Type                                | Description                    |
| --------- | ----------------------------------- | ------------------------------ |
| `config?` | [`GraphRAGConfig`](#graphragconfig) | Optional configuration options |

#### Returns

`GraphRAG`

#### Example

```typescript
// Default configuration (dimension: 1536, threshold: 0.7)
const graph = new GraphRAG();

// Custom configuration
const graph = new GraphRAG({
  dimension: 768, // For smaller embedding models
  threshold: 0.8, // Stricter similarity threshold
});
```

## Methods

### createGraph()

> **createGraph**(`chunks`, `embeddings`): `void`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:46](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L46)

Create a knowledge graph from document chunks and their embeddings. This clears any existing graph data and builds a new graph from scratch.

#### Parameters

| Parameter    | Type               | Description                     |
| ------------ | ------------------ | ------------------------------- |
| `chunks`     | `GraphChunk[]`     | Array of document chunks        |
| `embeddings` | `GraphEmbedding[]` | Corresponding embedding vectors |

#### Returns

`void`

#### Throws

`Error` - If chunks and embeddings arrays have different lengths

#### Example

```typescript
const chunks = documents.map((doc) => ({
  text: doc.content,
  metadata: doc.meta,
}));
const embeddings = await embedder.embedMany(chunks.map((c) => c.text));

graph.createGraph(
  chunks,
  embeddings.map((v) => ({ vector: v })),
);
```

---

### query()

> **query**(`params`): `RankedNode[]`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:116](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L116)

Query the graph using Random Walk with Restart algorithm. Combines initial similarity scores with graph traversal to find contextually relevant nodes.

#### Parameters

| Parameter | Type                                    | Description      |
| --------- | --------------------------------------- | ---------------- |
| `params`  | [`GraphQueryParams`](#graphqueryparams) | Query parameters |

#### Returns

`RankedNode[]`

Array of ranked nodes sorted by relevance score

#### Example

```typescript
const queryEmbedding = await embedder.embed("What is machine learning?");

const results = graph.query({
  query: queryEmbedding,
  topK: 10,
  randomWalkSteps: 100,
  restartProb: 0.15,
});

results.forEach((node) => {
  console.log(`[${node.score.toFixed(3)}] ${node.content}`);
});
```

---

### addNode()

> **addNode**(`chunk`, `embedding`): `string`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:213](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L213)

Add a single node to the graph. Automatically creates edges to existing nodes based on similarity threshold.

#### Parameters

| Parameter   | Type             | Description      |
| ----------- | ---------------- | ---------------- |
| `chunk`     | `GraphChunk`     | Document chunk   |
| `embedding` | `GraphEmbedding` | Embedding vector |

#### Returns

`string`

The unique ID of the newly created node

#### Example

```typescript
const newDoc = {
  text: "Attention mechanisms allow models to focus...",
  metadata: { topic: "transformers" },
};
const embedding = await embedder.embed(newDoc.text);

const nodeId = graph.addNode(newDoc, { vector: embedding });
console.log(`Created node: ${nodeId}`);
```

---

### removeNode()

> **removeNode**(`id`): `boolean`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:266](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L266)

Remove a node and all its edges from the graph.

#### Parameters

| Parameter | Type     | Description       |
| --------- | -------- | ----------------- |
| `id`      | `string` | Node ID to remove |

#### Returns

`boolean`

`true` if node was removed, `false` if node was not found

#### Example

```typescript
const removed = graph.removeNode("node-uuid-123");
if (removed) {
  console.log("Node successfully removed");
}
```

---

### getNode()

> **getNode**(`id`): `GraphNode | undefined`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:306](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L306)

Get a node by its ID.

#### Parameters

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| `id`      | `string` | Node ID     |

#### Returns

`GraphNode | undefined`

The node if found, undefined otherwise

---

### getAllNodes()

> **getAllNodes**(): `GraphNode[]`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:313](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L313)

Get all nodes in the graph.

#### Returns

`GraphNode[]`

Array of all graph nodes

---

### getEdges()

> **getEdges**(`nodeId`): `GraphEdge[]`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:320](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L320)

Get all edges for a specific node.

#### Parameters

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| `nodeId`  | `string` | Node ID     |

#### Returns

`GraphEdge[]`

Array of edges originating from the node

---

### getStats()

> **getStats**(): `GraphStats`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:289](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L289)

Get graph statistics including node count, edge count, and average degree.

#### Returns

[`GraphStats`](#graphstats)

Graph statistics object

#### Example

```typescript
const stats = graph.getStats();
console.log(`Graph has ${stats.nodeCount} nodes and ${stats.edgeCount} edges`);
console.log(`Average connections per node: ${stats.avgDegree.toFixed(2)}`);
```

---

### findConnectedComponents()

> **findConnectedComponents**(): `string[][]`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:327](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L327)

Find connected components in the graph using BFS traversal. Useful for identifying clusters of related documents.

#### Returns

`string[][]`

Array of components, where each component is an array of node IDs

#### Example

```typescript
const components = graph.findConnectedComponents();

if (components.length > 1) {
  console.log(`Graph has ${components.length} disconnected clusters`);
  components.forEach((comp, i) => {
    console.log(`Cluster ${i + 1}: ${comp.length} documents`);
  });
}
```

---

### updateThreshold()

> **updateThreshold**(`threshold`): `void`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:414](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L414)

Update the similarity threshold and rebuild all edges. Useful for tuning graph density without re-creating nodes.

#### Parameters

| Parameter   | Type     | Description                           |
| ----------- | -------- | ------------------------------------- |
| `threshold` | `number` | New similarity threshold (0.0 to 1.0) |

#### Returns

`void`

#### Example

```typescript
// Start with a lower threshold
const graph = new GraphRAG({ threshold: 0.6 });
graph.createGraph(chunks, embeddings);

console.log(`Edges with 0.6 threshold: ${graph.getStats().edgeCount}`);

// Increase threshold for sparser graph
graph.updateThreshold(0.8);
console.log(`Edges with 0.8 threshold: ${graph.getStats().edgeCount}`);
```

---

### toJSON()

> **toJSON**(): `{ nodes: GraphNode[]; edges: Array<{ source: string; edges: GraphEdge[] }>; config: { dimension: number; threshold: number } }`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:459](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L459)

Serialize the graph to a JSON-compatible object. Includes all nodes, edges, and configuration.

#### Returns

`object`

JSON-serializable graph representation

| Property | Type                                            | Description                     |
| -------- | ----------------------------------------------- | ------------------------------- |
| `nodes`  | `GraphNode[]`                                   | All graph nodes with embeddings |
| `edges`  | `Array<{ source: string; edges: GraphEdge[] }>` | Edge lists keyed by source node |
| `config` | `{ dimension: number; threshold: number }`      | Graph configuration             |

#### Example

```typescript
const data = graph.toJSON();
const json = JSON.stringify(data);
await fs.writeFile("graph.json", json);
```

---

### fromJSON() (static)

> **static fromJSON**(`json`): `GraphRAG`

Defined in: [src/lib/rag/graphRag/graphRAG.ts:480](https://github.com/juspay/neurolink/blob/main/src/lib/rag/graphRag/graphRAG.ts#L480)

Create a GraphRAG instance from serialized JSON data.

#### Parameters

| Parameter | Type                                                                                                                             | Description           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `json`    | `{ nodes: GraphNode[]; edges: Array<{ source: string; edges: GraphEdge[] }>; config: { dimension: number; threshold: number } }` | Serialized graph data |

#### Returns

`GraphRAG`

Restored GraphRAG instance

#### Example

```typescript
const json = JSON.parse(await fs.readFile("graph.json", "utf-8"));
const graph = GraphRAG.fromJSON(json);

// Graph is ready for querying
const results = graph.query({ query: embedding, topK: 5 });
```

## Configuration

### GraphRAGConfig

Configuration options for GraphRAG constructor.

| Option      | Type     | Default | Description                                             |
| ----------- | -------- | ------- | ------------------------------------------------------- |
| `dimension` | `number` | `1536`  | Embedding vector dimension (must match your embeddings) |
| `threshold` | `number` | `0.7`   | Similarity threshold for edge creation (0.0 to 1.0)     |

### GraphQueryParams

Parameters for the `query()` method.

| Option            | Type       | Default      | Description                                          |
| ----------------- | ---------- | ------------ | ---------------------------------------------------- |
| `query`           | `number[]` | **required** | Query embedding vector                               |
| `topK`            | `number`   | `10`         | Number of results to return                          |
| `randomWalkSteps` | `number`   | `100`        | Number of random walk iterations                     |
| `restartProb`     | `number`   | `0.15`       | Probability of restarting walk at query-similar node |

## Types

### GraphNode

Represents a node in the knowledge graph.

| Property    | Type                      | Description              |
| ----------- | ------------------------- | ------------------------ |
| `id`        | `string`                  | Unique node identifier   |
| `content`   | `string`                  | Text content of the node |
| `metadata`  | `Record<string, unknown>` | Associated metadata      |
| `embedding` | `number[] \| undefined`   | Embedding vector         |

### GraphEdge

Represents an edge (relationship) between nodes.

| Property | Type                  | Description                     |
| -------- | --------------------- | ------------------------------- |
| `source` | `string`              | Source node ID                  |
| `target` | `string`              | Target node ID                  |
| `weight` | `number`              | Edge weight (similarity)        |
| `type`   | `string \| undefined` | Edge type (default: "semantic") |

### GraphChunk

Input format for document chunks.

| Property   | Type                                   | Description        |
| ---------- | -------------------------------------- | ------------------ |
| `text`     | `string`                               | Chunk text content |
| `metadata` | `Record<string, unknown> \| undefined` | Optional metadata  |

### GraphEmbedding

Input format for embedding vectors.

| Property | Type       | Description      |
| -------- | ---------- | ---------------- |
| `vector` | `number[]` | Embedding vector |

### RankedNode

Result format from graph queries.

| Property   | Type                      | Description           |
| ---------- | ------------------------- | --------------------- |
| `id`       | `string`                  | Node ID               |
| `content`  | `string`                  | Node text content     |
| `metadata` | `Record<string, unknown>` | Node metadata         |
| `score`    | `number`                  | Relevance score (0-1) |

### GraphStats

Graph statistics from `getStats()`.

| Property    | Type     | Description                  |
| ----------- | -------- | ---------------------------- |
| `nodeCount` | `number` | Total number of nodes        |
| `edgeCount` | `number` | Total number of edges        |
| `avgDegree` | `number` | Average edges per node       |
| `threshold` | `number` | Current similarity threshold |

## Algorithm Details

### Random Walk with Restart (RWR)

The query algorithm combines direct similarity with graph structure:

1. **Initial Ranking**: Compute cosine similarity between query embedding and all nodes
2. **Starting Nodes**: Select top-5 most similar nodes as walk starting points
3. **Random Walk**: Perform random walk iterations:
   - With probability `restartProb`: Jump to a query-similar node
   - Otherwise: Follow an edge weighted by similarity
4. **Visit Counting**: Track how often each node is visited during walks
5. **Score Combination**: Final score = 0.6 × similarity + 0.4 × visit frequency
6. **Return**: Top-K nodes by combined score

This approach finds documents that are both directly relevant and contextually connected to relevant documents.

## See Also

- [RAGPipeline](./RAGPipeline.md) - High-level RAG orchestration with Graph RAG support
- [InMemoryVectorStore](./InMemoryVectorStore.md) - Vector storage for embeddings
- [MDocument](./MDocument.md) - Document processing and chunking
