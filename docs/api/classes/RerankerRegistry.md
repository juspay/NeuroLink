[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / RerankerRegistry

# Class: RerankerRegistry

Registry for reranker type implementations.

**Since**: v8.44.0

Defined in: [lib/rag/reranker/RerankerRegistry.ts:85](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L85)

## Description

RerankerRegistry is a centralized registry for all reranker implementations with metadata and discovery capabilities. It extends `BaseRegistry` and follows the singleton pattern to provide a consistent point of access for reranker discovery and retrieval.

The registry manages reranker types, their aliases, and associated metadata, making it easy to discover available rerankers, look up rerankers by alias, and find rerankers suitable for specific use cases.

### Key Features

- **Singleton Pattern**: Single registry instance for consistent state management
- **Alias Support**: Multiple aliases can reference the same reranker type
- **Rich Metadata**: Each reranker includes description, use cases, configuration options, and requirements
- **Use Case Discovery**: Find rerankers suitable for specific requirements
- **Lazy Initialization**: Rerankers are registered on first access
- **Filtering Capabilities**: Filter by model requirements, API requirements, and use cases

## Extends

- `BaseRegistry`\<[`Reranker`](../interfaces/Reranker.md), [`RerankerMetadata`](../interfaces/RerankerMetadata.md)\>

## Constructors

### Constructor

> `private` **new RerankerRegistry**(): `RerankerRegistry`

Private constructor enforces singleton pattern. Use `getInstance()` to access the registry.

#### Returns

`RerankerRegistry`

## Methods

### getInstance()

> `static` **getInstance**(): `RerankerRegistry`

Defined in: [lib/rag/reranker/RerankerRegistry.ts:96](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L96)

Get the singleton registry instance. Creates the instance on first call.

#### Returns

`RerankerRegistry`

The singleton RerankerRegistry instance

---

### resetInstance()

> `static` **resetInstance**(): `void`

Defined in: [lib/rag/reranker/RerankerRegistry.ts:106](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L106)

Reset the singleton instance. Primarily used for testing to ensure clean state between tests. Clears all registered rerankers and aliases.

#### Returns

`void`

---

### registerReranker()

> **registerReranker**(`type`, `factory`, `metadata`): `void`

Defined in: [lib/rag/reranker/RerankerRegistry.ts:264](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L264)

Register a reranker with its factory function and metadata. Also registers all aliases defined in the metadata.

#### Parameters

##### type

[`RerankerType`](../type-aliases/RerankerType.md)

The canonical reranker type identifier

##### factory

`() => Promise<Reranker>`

Async factory function that creates the reranker instance

##### metadata

[`RerankerMetadata`](../interfaces/RerankerMetadata.md)

Metadata including description, use cases, aliases, and configuration

#### Returns

`void`

---

### resolveType()

> **resolveType**(`nameOrAlias`): [`RerankerType`](../type-aliases/RerankerType.md)

Defined in: [lib/rag/reranker/RerankerRegistry.ts:277](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L277)

Resolve a type name or alias to its canonical reranker type.

#### Parameters

##### nameOrAlias

`string`

The reranker type or alias to resolve

#### Returns

[`RerankerType`](../type-aliases/RerankerType.md)

The canonical reranker type

#### Throws

`RerankerError` if the type or alias is not found

---

### getReranker()

> **getReranker**(`typeOrAlias`): `Promise`\<[`Reranker`](../interfaces/Reranker.md)\>

Defined in: [lib/rag/reranker/RerankerRegistry.ts:309](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L309)

Get a reranker instance by type or alias. Ensures the registry is initialized before lookup.

#### Parameters

##### typeOrAlias

`string`

The reranker type ('llm', 'simple', 'batch', 'cross-encoder', 'cohere') or an alias ('semantic', 'fast', etc.)

#### Returns

`Promise`\<[`Reranker`](../interfaces/Reranker.md)\>

The reranker instance

#### Throws

`RerankerError` if the reranker type is not found

---

### getAvailableRerankers()

> **getAvailableRerankers**(): `Promise`\<[`RerankerType`](../type-aliases/RerankerType.md)[]\>

Defined in: [lib/rag/reranker/RerankerRegistry.ts:328](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L328)

Get a list of all available reranker types (not including aliases).

#### Returns

`Promise`\<[`RerankerType`](../type-aliases/RerankerType.md)[]\>

Array of available reranker type identifiers

---

### getRerankerMetadata()

> **getRerankerMetadata**(`typeOrAlias`): [`RerankerMetadata`](../interfaces/RerankerMetadata.md) | `undefined`

Defined in: [lib/rag/reranker/RerankerRegistry.ts:336](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L336)

Get metadata for a specific reranker type, including description, use cases, and configuration options.

#### Parameters

##### typeOrAlias

`string`

The reranker type or alias

#### Returns

[`RerankerMetadata`](../interfaces/RerankerMetadata.md) | `undefined`

Metadata object or undefined if not found

---

### getAliasesForType()

> **getAliasesForType**(`type`): `string`[]

Defined in: [lib/rag/reranker/RerankerRegistry.ts:345](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L345)

Get all aliases registered for a specific reranker type.

#### Parameters

##### type

[`RerankerType`](../type-aliases/RerankerType.md)

The canonical reranker type

#### Returns

`string`[]

Array of alias strings for the type

---

### getAllAliases()

> **getAllAliases**(): `Map`\<`string`, [`RerankerType`](../type-aliases/RerankerType.md)\>

Defined in: [lib/rag/reranker/RerankerRegistry.ts:353](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L353)

Get all registered aliases mapped to their canonical reranker types.

#### Returns

`Map`\<`string`, [`RerankerType`](../type-aliases/RerankerType.md)\>

Map of alias → type mappings

---

### hasReranker()

> **hasReranker**(`typeOrAlias`): `boolean`

Defined in: [lib/rag/reranker/RerankerRegistry.ts:360](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L360)

Check if a reranker type or alias exists in the registry.

#### Parameters

##### typeOrAlias

`string`

The reranker type or alias to check

#### Returns

`boolean`

True if the type or alias exists

---

### getRerankersByUseCase()

> **getRerankersByUseCase**(`useCase`): [`RerankerType`](../type-aliases/RerankerType.md)[]

Defined in: [lib/rag/reranker/RerankerRegistry.ts:372](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L372)

Find rerankers suitable for a specific use case by searching metadata. Performs case-insensitive partial matching against use case descriptions.

#### Parameters

##### useCase

`string`

Description of the use case (e.g., "fast", "semantic", "production")

#### Returns

[`RerankerType`](../type-aliases/RerankerType.md)[]

Array of matching reranker types

---

### getDefaultConfig()

> **getDefaultConfig**(`typeOrAlias`): `Partial`\<[`RerankerConfig`](../type-aliases/RerankerConfig.md)\> | `undefined`

Defined in: [lib/rag/reranker/RerankerRegistry.ts:389](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L389)

Get the default configuration for a reranker type.

#### Parameters

##### typeOrAlias

`string`

The reranker type or alias

#### Returns

`Partial`\<[`RerankerConfig`](../type-aliases/RerankerConfig.md)\> | `undefined`

Default config or undefined if not found

---

### getLocalRerankers()

> **getLocalRerankers**(): [`RerankerType`](../type-aliases/RerankerType.md)[]

Defined in: [lib/rag/reranker/RerankerRegistry.ts:397](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L397)

Get rerankers that don't require external APIs (can run locally).

#### Returns

[`RerankerType`](../type-aliases/RerankerType.md)[]

Array of local reranker types: `['llm', 'cross-encoder', 'simple', 'batch']`

---

### getModelFreeRerankers()

> **getModelFreeRerankers**(): [`RerankerType`](../type-aliases/RerankerType.md)[]

Defined in: [lib/rag/reranker/RerankerRegistry.ts:412](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L412)

Get rerankers that don't require AI models (fastest options).

#### Returns

[`RerankerType`](../type-aliases/RerankerType.md)[]

Array of model-free reranker types: `['cohere', 'simple']`

---

### clear()

> **clear**(): `void`

Defined in: [lib/rag/reranker/RerankerRegistry.ts:427](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerRegistry.ts#L427)

Clear the registry, removing all registered rerankers and aliases.

#### Returns

`void`

## Registered Reranker Types

| Type            | Requires Model | Requires API | Description                                                 |
| --------------- | -------------- | ------------ | ----------------------------------------------------------- |
| `simple`        | No             | No           | Position and vector score-based reranking (no LLM required) |
| `llm`           | Yes            | No           | LLM-powered semantic reranking with multi-factor scoring    |
| `batch`         | Yes            | No           | Batch LLM reranking for efficient multi-document scoring    |
| `cross-encoder` | Yes            | No           | Cross-encoder model for query-document relevance scoring    |
| `cohere`        | No             | Yes          | Cohere Rerank API for production-grade relevance scoring    |

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

### Basic Registry Usage

```typescript
import { rerankerRegistry } from "@juspay/neurolink";

// Get available reranker types
const types = await rerankerRegistry.getAvailableRerankers();
console.log(types);
// ['llm', 'cross-encoder', 'cohere', 'simple', 'batch']

// Check if a reranker exists
if (rerankerRegistry.hasReranker("semantic")) {
  console.log("Semantic reranker is available");
}

// Resolve an alias to its canonical type
const type = rerankerRegistry.resolveType("fast");
console.log(type); // 'simple'
```

### Getting Reranker Instances

```typescript
import { rerankerRegistry } from "@juspay/neurolink";

// Get a reranker by type
const simpleReranker = await rerankerRegistry.getReranker("simple");

// Get a reranker by alias
const fastReranker = await rerankerRegistry.getReranker("fast");

// Both return the same reranker type
console.log(simpleReranker.type); // 'simple'
console.log(fastReranker.type); // 'simple'
```

### Discovering Rerankers by Use Case

```typescript
import { rerankerRegistry } from "@juspay/neurolink";

// Find rerankers for fast processing
const fastRerankers = rerankerRegistry.getRerankersByUseCase("fast");
console.log(fastRerankers); // ['simple']

// Find rerankers for semantic understanding
const semanticRerankers = rerankerRegistry.getRerankersByUseCase("semantic");
console.log(semanticRerankers); // ['llm']

// Find rerankers for production use
const productionRerankers =
  rerankerRegistry.getRerankersByUseCase("production");
console.log(productionRerankers); // ['cohere']

// Find rerankers for batch processing
const batchRerankers = rerankerRegistry.getRerankersByUseCase("batch");
console.log(batchRerankers); // ['batch']
```

### Working with Metadata

```typescript
import { rerankerRegistry } from "@juspay/neurolink";

// Get metadata for a reranker type
const metadata = rerankerRegistry.getRerankerMetadata("llm");
console.log(metadata?.description);
// "LLM-powered semantic reranking with multi-factor scoring"

console.log(metadata?.useCases);
// ["High-quality semantic reranking", "Complex query understanding", "Context-aware scoring"]

console.log(metadata?.supportedOptions);
// ["model", "provider", "topK", "weights"]

// Get default configuration
const defaultConfig = rerankerRegistry.getDefaultConfig("simple");
console.log(defaultConfig);
// { topK: 3, weights: { vector: 0.8, position: 0.2 } }
```

### Filtering Rerankers by Requirements

```typescript
import { rerankerRegistry } from "@juspay/neurolink";

// Get rerankers that work without external APIs
const localRerankers = rerankerRegistry.getLocalRerankers();
console.log(localRerankers);
// ['llm', 'cross-encoder', 'simple', 'batch']

// Get rerankers that don't need AI models (fastest)
const modelFreeRerankers = rerankerRegistry.getModelFreeRerankers();
console.log(modelFreeRerankers);
// ['cohere', 'simple']
```

### Working with Aliases

```typescript
import { rerankerRegistry } from "@juspay/neurolink";

// Get all aliases for a specific type
const llmAliases = rerankerRegistry.getAliasesForType("llm");
console.log(llmAliases);
// ['semantic', 'ai', 'model-based']

// Get all registered aliases
const allAliases = rerankerRegistry.getAllAliases();
for (const [alias, type] of allAliases) {
  console.log(`'${alias}' -> '${type}'`);
}
// 'semantic' -> 'llm'
// 'ai' -> 'llm'
// 'model-based' -> 'llm'
// 'fast' -> 'simple'
// ...
```

### Custom Reranker Registration

```typescript
import { RerankerRegistry } from "@juspay/neurolink";

const registry = RerankerRegistry.getInstance();

// Register a custom reranker
registry.registerReranker(
  "custom" as RerankerType,
  async () => ({
    type: "custom" as RerankerType,
    async rerank(results, query, options) {
      // Custom reranking logic
      return results.slice(0, options?.topK ?? 3).map((result, index) => ({
        result,
        score: 1 - index * 0.1,
        details: { custom: true },
      }));
    },
  }),
  {
    description: "Custom reranking implementation",
    defaultConfig: { topK: 5 },
    supportedOptions: ["topK"],
    useCases: ["Custom use case"],
    aliases: ["my-reranker"],
    requiresModel: false,
    requiresExternalAPI: false,
  },
);

// Use the custom reranker
const customReranker = await registry.getReranker("my-reranker");
```

## Global Singleton

A pre-configured singleton instance is exported for convenience:

```typescript
import { rerankerRegistry } from "@juspay/neurolink";

// Use directly without calling getInstance()
const types = await rerankerRegistry.getAvailableRerankers();
const reranker = await rerankerRegistry.getReranker("simple");
```

## Convenience Functions

The module also exports convenience functions that use the global singleton:

```typescript
import {
  getAvailableRerankers,
  getReranker,
  getRegisteredRerankerMetadata,
} from "@juspay/neurolink";

// Get available reranker types
const types = await getAvailableRerankers();
// ['llm', 'cross-encoder', 'cohere', 'simple', 'batch']

// Get a reranker instance
const reranker = await getReranker("simple");

// Get metadata
const metadata = getRegisteredRerankerMetadata("llm");
console.log(metadata?.description);
```

## See Also

- [RerankerFactory](./RerankerFactory.md) - Factory for creating configured reranker instances
- [RerankerType](../type-aliases/RerankerType.md) - Available reranker type identifiers
- [RerankerConfig](../type-aliases/RerankerConfig.md) - Configuration options for rerankers
