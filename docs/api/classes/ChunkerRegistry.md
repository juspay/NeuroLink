[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / ChunkerRegistry

# Class: ChunkerRegistry

Registry for chunking strategy implementations.

**Since**: v8.44.0

Defined in: [rag/ChunkerRegistry.ts:126](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L126)

## Description

ChunkerRegistry provides a centralized registry for managing and discovering chunking strategies
used in RAG (Retrieval-Augmented Generation) pipelines. It implements the **Registry pattern** with:

- **10 built-in chunking strategies** for different content types
- **Strategy aliases** for convenient naming (e.g., "md" for "markdown")
- **Lazy loading** via dynamic imports for efficient resource usage
- **Singleton pattern** for consistent access across the application
- **Metadata-driven discovery** with use case recommendations and default configurations

The registry extends `BaseRegistry` and automatically registers all default chunkers on first use.

## Constructors

### Constructor

> **private new ChunkerRegistry**(): `ChunkerRegistry`

Private constructor - use `getInstance()` to get the singleton.

#### Returns

`ChunkerRegistry`

## Methods

### getInstance()

> `static` **getInstance**(): `ChunkerRegistry`

Defined in: [rag/ChunkerRegistry.ts:137](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L137)

Returns the singleton instance of ChunkerRegistry.

#### Returns

`ChunkerRegistry`

The singleton registry instance

---

### resetInstance()

> `static` **resetInstance**(): `void`

Defined in: [rag/ChunkerRegistry.ts:147](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L147)

Reset the singleton instance (primarily for testing). Clears all registered chunkers and aliases.

#### Returns

`void`

---

### registerChunker()

> **registerChunker**(`strategy`, `factory`, `metadata`): `void`

Defined in: [rag/ChunkerRegistry.ts:254](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L254)

Register a chunker with metadata and aliases.

#### Parameters

##### strategy

[`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md) | `string`

Strategy name to register

##### factory

() => `Promise`\<[`Chunker`](../interfaces/Chunker.md)\>

Async factory function that creates the chunker instance

##### metadata

[`ChunkerMetadata`](../type-aliases/ChunkerMetadata.md)

Metadata including description, defaults, use cases, and aliases

#### Returns

`void`

---

### resolveStrategy()

> **resolveStrategy**(`nameOrAlias`): [`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)

Defined in: [rag/ChunkerRegistry.ts:273](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L273)

Resolve a strategy name from an alias or verify a direct strategy name exists.

#### Parameters

##### nameOrAlias

`string`

Strategy name or alias to resolve

#### Returns

[`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)

The canonical strategy name

#### Throws

`ChunkingError` - If the strategy or alias is not found

---

### getChunker()

> **getChunker**(`strategyOrAlias`): `Promise`\<[`Chunker`](../interfaces/Chunker.md)\>

Defined in: [rag/ChunkerRegistry.ts:304](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L304)

Get a chunker instance by strategy name or alias.

#### Parameters

##### strategyOrAlias

`string`

Chunking strategy name or alias (e.g., "markdown", "md", "recursive")

#### Returns

`Promise`\<[`Chunker`](../interfaces/Chunker.md)\>

The chunker instance

#### Throws

`ChunkingError` - If strategy is not found

---

### getAvailableChunkers()

> **getAvailableChunkers**(): `Promise`\<[`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)[]\>

Defined in: [rag/ChunkerRegistry.ts:322](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L322)

Get list of all available chunker strategies (not including aliases).

#### Returns

`Promise`\<[`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)[]\>

Array of strategy names

---

### getChunkerMetadata()

> **getChunkerMetadata**(`strategyOrAlias`): [`ChunkerMetadata`](../type-aliases/ChunkerMetadata.md) | `undefined`

Defined in: [rag/ChunkerRegistry.ts:330](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L330)

Get metadata for a specific chunker strategy.

#### Parameters

##### strategyOrAlias

`string`

Strategy name or alias

#### Returns

[`ChunkerMetadata`](../type-aliases/ChunkerMetadata.md) | `undefined`

Chunker metadata or undefined if not found

---

### getAliasesForStrategy()

> **getAliasesForStrategy**(`strategy`): `string`[]

Defined in: [rag/ChunkerRegistry.ts:339](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L339)

Get all aliases for a specific strategy.

#### Parameters

##### strategy

[`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)

The canonical strategy name

#### Returns

`string`[]

Array of alias strings for the strategy

---

### getAllAliases()

> **getAllAliases**(): `Map`\<`string`, [`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)\>

Defined in: [rag/ChunkerRegistry.ts:347](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L347)

Get all registered aliases mapped to their canonical strategy names.

#### Returns

`Map`\<`string`, [`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)\>

Map of alias to strategy name

---

### hasChunker()

> **hasChunker**(`strategyOrAlias`): `boolean`

Defined in: [rag/ChunkerRegistry.ts:354](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L354)

Check if a strategy or alias exists in the registry.

#### Parameters

##### strategyOrAlias

`string`

Strategy name or alias to check

#### Returns

`boolean`

True if the strategy or alias exists

---

### getChunkersByUseCase()

> **getChunkersByUseCase**(`useCase`): [`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)[]

Defined in: [rag/ChunkerRegistry.ts:366](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L366)

Get chunkers suitable for a specific use case.

#### Parameters

##### useCase

`string`

Use case description (e.g., "documentation", "Q&A", "web scraping")

#### Returns

[`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)[]

Array of matching strategy names

---

### getDefaultConfig()

> **getDefaultConfig**(`strategyOrAlias`): [`ChunkerConfig`](../type-aliases/ChunkerConfig.md) | `undefined`

Defined in: [rag/ChunkerRegistry.ts:383](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L383)

Get the default configuration for a chunker strategy.

#### Parameters

##### strategyOrAlias

`string`

Strategy name or alias

#### Returns

[`ChunkerConfig`](../type-aliases/ChunkerConfig.md) | `undefined`

Default configuration or undefined if not found

---

### clear()

> **clear**(): `void`

Defined in: [rag/ChunkerRegistry.ts:391](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L391)

Clear the registry, removing all registered chunkers and aliases.

#### Returns

`void`

## Exported Functions

The module also exports convenience functions for common operations:

### getAvailableChunkers()

> **getAvailableChunkers**(): `Promise`\<[`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)[]\>

Defined in: [rag/ChunkerRegistry.ts:405](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L405)

Convenience function to get all available chunker strategies.

#### Returns

`Promise`\<[`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)[]\>

---

### getChunker()

> **getChunker**(`strategyOrAlias`): `Promise`\<[`Chunker`](../interfaces/Chunker.md)\>

Defined in: [rag/ChunkerRegistry.ts:412](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L412)

Convenience function to get a chunker by strategy name or alias.

#### Parameters

##### strategyOrAlias

`string`

Strategy name or alias

#### Returns

`Promise`\<[`Chunker`](../interfaces/Chunker.md)\>

---

### getChunkerMetadata()

> **getChunkerMetadata**(`strategyOrAlias`): [`ChunkerMetadata`](../type-aliases/ChunkerMetadata.md) | `undefined`

Defined in: [rag/ChunkerRegistry.ts:419](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerRegistry.ts#L419)

Convenience function to get chunker metadata.

#### Parameters

##### strategyOrAlias

`string`

Strategy name or alias

#### Returns

[`ChunkerMetadata`](../type-aliases/ChunkerMetadata.md) | `undefined`

## Examples

### Basic Usage

```typescript
import { chunkerRegistry } from "@juspay/neurolink";

// Get a chunker by strategy name
const chunker = await chunkerRegistry.getChunker("markdown");

// Chunk a document
const chunks = await chunker.chunk(markdownContent);
console.log(`Created ${chunks.length} chunks`);
```

### Using Aliases

```typescript
import { chunkerRegistry } from "@juspay/neurolink";

// "md" is an alias for "markdown"
const mdChunker = await chunkerRegistry.getChunker("md");

// "char" is an alias for "character"
const charChunker = await chunkerRegistry.getChunker("char");

// "tok" is an alias for "token"
const tokenChunker = await chunkerRegistry.getChunker("tok");
```

### Using Convenience Functions

```typescript
import {
  getChunker,
  getAvailableChunkers,
  getChunkerMetadata,
} from "@juspay/neurolink";

// Get chunker directly
const chunker = await getChunker("recursive");

// List all available strategies
const strategies = await getAvailableChunkers();
console.log("Available:", strategies);
// ["character", "recursive", "sentence", "token", "markdown", "html", "json", "latex", "semantic-markdown"]

// Get metadata for a strategy
const metadata = getChunkerMetadata("sentence");
console.log(metadata?.description);
// "Splits text by sentence boundaries for semantically meaningful chunks"
console.log(metadata?.useCases);
// ["Q&A applications", "Sentence-level analysis", "Preserving complete thoughts"]
```

### Finding Chunkers by Use Case

```typescript
import { chunkerRegistry } from "@juspay/neurolink";

// Find chunkers for documentation processing
const docChunkers = chunkerRegistry.getChunkersByUseCase("documentation");
console.log(docChunkers); // ["markdown"]

// Find chunkers for Q&A applications
const qaChunkers = chunkerRegistry.getChunkersByUseCase("Q&A");
console.log(qaChunkers); // ["sentence"]

// Find chunkers for web content
const webChunkers = chunkerRegistry.getChunkersByUseCase("web");
console.log(webChunkers); // ["html"]
```

### Resolving Aliases

```typescript
import { chunkerRegistry } from "@juspay/neurolink";

// Resolve an alias to its canonical strategy name
const strategy = chunkerRegistry.resolveStrategy("md");
console.log(strategy); // "markdown"

// Get all aliases for a strategy
const aliases = chunkerRegistry.getAliasesForStrategy("character");
console.log(aliases); // ["char", "fixed-size", "fixed"]

// Get all registered aliases
const allAliases = chunkerRegistry.getAllAliases();
allAliases.forEach((strategy, alias) => {
  console.log(`${alias} -> ${strategy}`);
});
```

### Checking Strategy Availability

```typescript
import { chunkerRegistry } from "@juspay/neurolink";

// Check if a strategy or alias exists
console.log(chunkerRegistry.hasChunker("markdown")); // true
console.log(chunkerRegistry.hasChunker("md")); // true
console.log(chunkerRegistry.hasChunker("unknown")); // false

// Get default configuration
const defaultConfig = chunkerRegistry.getDefaultConfig("token");
console.log(defaultConfig);
// { maxSize: 512, overlap: 50 }
```

### Registering Custom Chunkers

```typescript
import { chunkerRegistry } from "@juspay/neurolink";

// Register a custom chunker
chunkerRegistry.registerChunker(
  "custom-xml",
  async () => {
    return new MyXMLChunker();
  },
  {
    description: "Custom XML-aware chunker for structured documents",
    defaultConfig: { maxSize: 1000, overlap: 0 },
    supportedOptions: ["maxSize", "overlap", "splitTags", "preserveAttributes"],
    useCases: ["XML documents", "SOAP responses", "Configuration files"],
    aliases: ["xml", "xml-tag"],
  },
);

// Now usable via registry
const xmlChunker = await chunkerRegistry.getChunker("xml");
```

## Supported Strategies

| Strategy            | Aliases                                    | Description                                   | Best For                                |
| ------------------- | ------------------------------------------ | --------------------------------------------- | --------------------------------------- |
| `character`         | `char`, `fixed-size`, `fixed`              | Fixed-size character splitting with overlap   | Simple text, fixed-size requirements    |
| `recursive`         | `recursive-character`, `langchain-default` | Hierarchical separator-based splitting        | General text documents (default choice) |
| `sentence`          | `sent`, `sentence-based`                   | Sentence boundary splitting                   | Q&A applications, NLP tasks             |
| `token`             | `tok`, `tokenized`                         | Token-count based splitting                   | LLM context management, model-specific  |
| `markdown`          | `md`, `markdown-header`                    | Header and structure-aware markdown splitting | Documentation, README files             |
| `html`              | `html-tag`, `web`                          | Semantic HTML tag splitting                   | Web content, HTML documents             |
| `json`              | `json-object`, `structured`                | JSON object boundary splitting                | API responses, structured data          |
| `latex`             | `tex`, `latex-section`                     | Section and environment-aware LaTeX splitting | Academic papers, scientific docs        |
| `semantic`          | `llm`, `ai-semantic`                       | LLM-powered semantic split points             | Advanced semantic understanding         |
| `semantic-markdown` | `semantic-md`, `smart-markdown`            | Markdown + semantic similarity                | Knowledge bases, context-aware docs     |

## Notes

- The registry uses **lazy initialization** - chunkers are registered on first access via `ensureInitialized()`
- All chunker retrieval is **async** due to dynamic imports for lazy loading
- The **singleton pattern** ensures consistent behavior across the application
- Use `resetInstance()` in tests to get a fresh registry state
- The registry extends `BaseRegistry` for consistent lifecycle management

## See Also

- [ChunkerFactory](./ChunkerFactory.md) - Factory for creating configured chunker instances
- [ChunkingStrategy](../type-aliases/ChunkingStrategy.md) - Strategy type definition
- [ChunkerConfig](../type-aliases/ChunkerConfig.md) - Configuration type union
- [ChunkerMetadata](../type-aliases/ChunkerMetadata.md) - Metadata type definition
- [Chunker](../interfaces/Chunker.md) - Chunker interface definition
- [MDocument](./MDocument.md) - Document class with integrated chunking
