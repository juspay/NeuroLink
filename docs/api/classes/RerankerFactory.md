[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / RerankerFactory

# Class: RerankerFactory

Defined in: [lib/rag/reranker/RerankerFactory.ts:150](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L150)

Factory for creating reranker instances with support for multiple types and model provider injection.

## Description

RerankerFactory is a singleton factory that creates and manages reranker instances for improving RAG retrieval quality. It extends `BaseFactory` and supports multiple reranking strategies ranging from simple position-based reranking to sophisticated LLM-powered semantic reranking.

The factory uses lazy loading via dynamic imports to avoid circular dependencies and provides rich metadata for discovery and configuration of rerankers. It supports aliases for convenient type lookup and offers utility methods to find rerankers suitable for specific use cases.

### Key Features

- **Singleton Pattern**: Single factory instance manages all reranker creation
- **Lazy Registration**: Rerankers are registered on first use
- **Model Provider Injection**: LLM-based rerankers receive model provider at runtime
- **Rich Metadata**: Each reranker includes description, use cases, and configuration options
- **Alias Support**: Multiple names can reference the same reranker type
- **Use Case Discovery**: Find rerankers suitable for specific requirements

## Constructors

### Constructor

> `private` **new RerankerFactory**(): `RerankerFactory`

Private constructor enforces singleton pattern. Use `getInstance()` to access the factory.

#### Returns

`RerankerFactory`

## Methods

### getInstance()

> `static` **getInstance**(): `RerankerFactory`

Defined in: [lib/rag/reranker/RerankerFactory.ts:162](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L162)

Get the singleton factory instance. Creates the instance on first call.

#### Returns

`RerankerFactory`

The singleton RerankerFactory instance

---

### resetInstance()

> `static` **resetInstance**(): `void`

Defined in: [lib/rag/reranker/RerankerFactory.ts:172](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L172)

Reset the singleton instance. Primarily used for testing to ensure clean state between tests.

#### Returns

`void`

---

### setModelProvider()

> **setModelProvider**(`provider`): `void`

Defined in: [lib/rag/reranker/RerankerFactory.ts:182](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L182)

Set the AI provider for LLM-based rerankers. Must be called before using `llm` or `batch` reranker types.

#### Parameters

##### provider

[`AIProvider`](../type-aliases/AIProvider.md)

The AI provider instance to use for semantic scoring

#### Returns

`void`

---

### createReranker()

> **createReranker**(`typeOrAlias`, `config?`): `Promise`\<[`Reranker`](../interfaces/Reranker.md)\>

Defined in: [lib/rag/reranker/RerankerFactory.ts:391](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L391)

Create a reranker by type or alias. This is the primary method for obtaining reranker instances.

#### Parameters

##### typeOrAlias

`string`

The reranker type ('llm', 'simple', 'batch', 'cross-encoder', 'cohere') or an alias ('semantic', 'fast', etc.)

##### config?

[`RerankerConfig`](../type-aliases/RerankerConfig.md)

Optional configuration for the reranker

#### Returns

`Promise`\<[`Reranker`](../interfaces/Reranker.md)\>

A configured Reranker instance

#### Throws

`RerankerError` if the type is unknown or creation fails

---

### getAvailableTypes()

> **getAvailableTypes**(): `Promise`\<[`RerankerType`](../type-aliases/RerankerType.md)[]\>

Defined in: [lib/rag/reranker/RerankerFactory.ts:447](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L447)

Get all available reranker types (not including aliases).

#### Returns

`Promise`\<[`RerankerType`](../type-aliases/RerankerType.md)[]\>

Array of available reranker type identifiers

---

### getRerankerMetadata()

> **getRerankerMetadata**(`typeOrAlias`): [`RerankerMetadata`](../interfaces/RerankerMetadata.md) | `undefined`

Defined in: [lib/rag/reranker/RerankerFactory.ts:431](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L431)

Get metadata for a reranker type, including description, use cases, and configuration options.

#### Parameters

##### typeOrAlias

`string`

The reranker type or alias

#### Returns

[`RerankerMetadata`](../interfaces/RerankerMetadata.md) | `undefined`

Metadata object or undefined if not found

---

### getDefaultConfig()

> **getDefaultConfig**(`typeOrAlias`): `Partial`\<[`RerankerConfig`](../type-aliases/RerankerConfig.md)\> | `undefined`

Defined in: [lib/rag/reranker/RerankerFactory.ts:439](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L439)

Get the default configuration for a reranker type.

#### Parameters

##### typeOrAlias

`string`

The reranker type or alias

#### Returns

`Partial`\<[`RerankerConfig`](../type-aliases/RerankerConfig.md)\> | `undefined`

Default config or undefined if not found

---

### getRerankersForUseCase()

> **getRerankersForUseCase**(`useCase`): [`RerankerType`](../type-aliases/RerankerType.md)[]

Defined in: [lib/rag/reranker/RerankerFactory.ts:470](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L470)

Find rerankers suitable for a specific use case by searching metadata.

#### Parameters

##### useCase

`string`

Description of the use case (e.g., "fast", "semantic", "production")

#### Returns

[`RerankerType`](../type-aliases/RerankerType.md)[]

Array of matching reranker types

---

### getLocalRerankers()

> **getLocalRerankers**(): [`RerankerType`](../type-aliases/RerankerType.md)[]

Defined in: [lib/rag/reranker/RerankerFactory.ts:487](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L487)

Get rerankers that don't require external APIs (can run locally).

#### Returns

[`RerankerType`](../type-aliases/RerankerType.md)[]

Array of local reranker types: `['llm', 'cross-encoder', 'simple', 'batch']`

---

### getModelFreeRerankers()

> **getModelFreeRerankers**(): [`RerankerType`](../type-aliases/RerankerType.md)[]

Defined in: [lib/rag/reranker/RerankerFactory.ts:502](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L502)

Get rerankers that don't require AI models (fastest options).

#### Returns

[`RerankerType`](../type-aliases/RerankerType.md)[]

Array of model-free reranker types: `['simple']`

---

### getTypeAliases()

> **getTypeAliases**(): `Map`\<`string`, `string`\>

Defined in: [lib/rag/reranker/RerankerFactory.ts:455](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L455)

Get all aliases mapped to their canonical reranker types.

#### Returns

`Map`\<`string`, `string`\>

Map of alias → type mappings

---

### hasType()

> **hasType**(`typeOrAlias`): `boolean`

Defined in: [lib/rag/reranker/RerankerFactory.ts:462](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L462)

Check if a reranker type or alias exists.

#### Parameters

##### typeOrAlias

`string`

The reranker type or alias to check

#### Returns

`boolean`

True if the type exists

---

### getAllMetadata()

> **getAllMetadata**(): `Map`\<[`RerankerType`](../type-aliases/RerankerType.md), [`RerankerMetadata`](../interfaces/RerankerMetadata.md)\>

Defined in: [lib/rag/reranker/RerankerFactory.ts:517](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L517)

Get metadata for all registered rerankers.

#### Returns

`Map`\<[`RerankerType`](../type-aliases/RerankerType.md), [`RerankerMetadata`](../interfaces/RerankerMetadata.md)\>

Map of type → metadata for all rerankers

---

### clear()

> **clear**(): `void`

Defined in: [lib/rag/reranker/RerankerFactory.ts:524](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L524)

Clear the factory, removing all registered rerankers and resetting the model provider.

#### Returns

`void`

## Reranker Types

| Type            | Requires Model | Requires API | Description                                                  |
| --------------- | -------------- | ------------ | ------------------------------------------------------------ |
| `simple`        | No             | No           | Fast, position and vector score-based reranking              |
| `llm`           | Yes            | No           | LLM-powered semantic reranking with multi-factor scoring     |
| `batch`         | Yes            | No           | Batch LLM reranking for efficient multi-document scoring     |
| `cross-encoder` | Yes            | No           | Cross-encoder model reranking (placeholder)                  |
| `cohere`        | No             | Yes          | Cohere Rerank API for production-grade scoring (placeholder) |

### Type Aliases

Each reranker type supports multiple aliases for convenience:

| Type            | Aliases                           |
| --------------- | --------------------------------- |
| `llm`           | `semantic`, `ai`, `model-based`   |
| `simple`        | `fast`, `basic`, `position-based` |
| `batch`         | `batch-llm`, `efficient`, `bulk`  |
| `cross-encoder` | `cross`, `encoder`, `bi-encoder`  |
| `cohere`        | `cohere-rerank`, `cohere-api`     |

## Examples

### Simple Reranking (No LLM Required)

```typescript
import { rerankerFactory, simpleRerank } from "@juspay/neurolink";

// Option 1: Use simpleRerank function directly
const results = await vectorStore.query("machine learning", 10);
const reranked = simpleRerank(results, { topK: 5 });

// Option 2: Use factory
const reranker = await rerankerFactory.createReranker("simple", { topK: 5 });
const reranked = await reranker.rerank(results, "machine learning");

// Using alias
const fastReranker = await rerankerFactory.createReranker("fast");
```

### LLM-Powered Semantic Reranking

```typescript
import { rerankerFactory, AIProviderFactory } from "@juspay/neurolink";

// Set up model provider first
const provider = await AIProviderFactory.createProvider("vertex");
rerankerFactory.setModelProvider(provider);

// Create LLM reranker
const reranker = await rerankerFactory.createReranker("llm", {
  topK: 5,
  weights: {
    semantic: 0.5, // LLM relevance score
    vector: 0.3, // Original similarity score
    position: 0.2, // Position in original results
  },
});

// Rerank results
const results = await vectorStore.query("explain transformers", 20);
const reranked = await reranker.rerank(results, "explain transformers");

console.log(
  reranked.map((r) => ({
    text: r.result.text?.slice(0, 100),
    score: r.score,
    details: r.details,
  })),
);
```

### Batch Reranking for Efficiency

```typescript
import { rerankerFactory } from "@juspay/neurolink";

// Batch reranker scores multiple documents in a single LLM call
const batchReranker = await rerankerFactory.createReranker("batch", {
  topK: 10,
});

// More efficient for large result sets
const largeResults = await vectorStore.query("neural networks", 50);
const reranked = await batchReranker.rerank(largeResults, "neural networks");
```

### Discovering Rerankers by Use Case

```typescript
import { rerankerFactory } from "@juspay/neurolink";

// Find fast rerankers
const fastRerankers = rerankerFactory.getRerankersForUseCase("fast");
// Returns: ['simple']

// Find rerankers for semantic understanding
const semanticRerankers = rerankerFactory.getRerankersForUseCase("semantic");
// Returns: ['llm']

// Get rerankers that don't need models
const modelFree = rerankerFactory.getModelFreeRerankers();
// Returns: ['simple']

// Get all metadata for documentation
const allMetadata = rerankerFactory.getAllMetadata();
for (const [type, meta] of allMetadata) {
  console.log(`${type}: ${meta.description}`);
  console.log(`  Use cases: ${meta.useCases.join(", ")}`);
}
```

### Custom Configuration

```typescript
import { rerankerFactory } from "@juspay/neurolink";

// Get default config for a type
const defaultConfig = rerankerFactory.getDefaultConfig("llm");
console.log(defaultConfig);
// { topK: 3, weights: { semantic: 0.4, vector: 0.4, position: 0.2 } }

// Override with custom config
const reranker = await rerankerFactory.createReranker("llm", {
  topK: 10,
  weights: {
    semantic: 0.6, // Emphasize semantic relevance
    vector: 0.3,
    position: 0.1,
  },
});
```

## Global Singleton

A pre-configured singleton instance is exported for convenience:

```typescript
import { rerankerFactory } from "@juspay/neurolink";

// Use directly without calling getInstance()
rerankerFactory.setModelProvider(provider);
const reranker = await rerankerFactory.createReranker("llm");
```

## Convenience Functions

The module also exports convenience functions that use the global singleton:

```typescript
import {
  createReranker,
  getAvailableRerankerTypes,
  getRerankerMetadata,
  getRerankerDefaultConfig,
} from "@juspay/neurolink";

// Create reranker
const reranker = await createReranker("simple", { topK: 5 });

// Get available types
const types = await getAvailableRerankerTypes();
// ['llm', 'cross-encoder', 'cohere', 'simple', 'batch']

// Get metadata
const meta = getRerankerMetadata("llm");
console.log(meta?.description);
// "LLM-powered semantic reranking with multi-factor scoring"

// Get default config
const config = getRerankerDefaultConfig("simple");
// { topK: 3, weights: { vector: 0.8, position: 0.2 } }
```

## See Also

- [RerankerType](../type-aliases/RerankerType.md) - Available reranker type identifiers
- [RerankerConfig](../type-aliases/RerankerConfig.md) - Configuration options for rerankers
- [Reranker](../interfaces/Reranker.md) - Reranker interface
- [rerank](../functions/rerank.md) - LLM rerank function
- [batchRerank](../functions/batchRerank.md) - Batch rerank function
- [simpleRerank](../functions/simpleRerank.md) - Simple rerank function
- [RAGPipeline](./RAGPipeline.md) - Full RAG pipeline with reranking support
