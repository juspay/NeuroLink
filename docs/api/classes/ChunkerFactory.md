[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / ChunkerFactory

# Class: ChunkerFactory

Defined in: [rag/ChunkerFactory.ts:99](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L99)

Factory for creating document chunker instances with support for multiple strategies and aliases.

## Description

ChunkerFactory implements the **Factory + Registry pattern** to provide a centralized way to create
document chunkers for RAG (Retrieval-Augmented Generation) pipelines. It supports:

- **10 built-in chunking strategies** for different content types
- **Strategy aliases** for convenient naming (e.g., "md" for "markdown")
- **Lazy loading** via dynamic imports to avoid circular dependencies
- **Singleton pattern** for consistent factory access across the application
- **Metadata-driven configuration** with default configs and use case recommendations

The factory extends `BaseFactory` and automatically registers all default chunkers on first use.

## Constructors

### Constructor

> **private new ChunkerFactory**(): `ChunkerFactory`

Private constructor - use `getInstance()` to get the singleton.

#### Returns

`ChunkerFactory`

## Methods

### getInstance()

> `static` **getInstance**(): `ChunkerFactory`

Defined in: [rag/ChunkerFactory.ts:110](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L110)

Returns the singleton instance of ChunkerFactory.

#### Returns

`ChunkerFactory`

The singleton factory instance

---

### resetInstance()

> `static` **resetInstance**(): `void`

Defined in: [rag/ChunkerFactory.ts:119](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L119)

Reset the singleton instance (primarily for testing).

#### Returns

`void`

---

### createChunker()

> **createChunker**(`strategyOrAlias`, `config?`): `Promise`\<[`Chunker`](../interfaces/Chunker.md)\>

Defined in: [rag/ChunkerFactory.ts:258](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L258)

Creates a new chunker instance for the specified strategy.

#### Parameters

##### strategyOrAlias

`string`

Chunking strategy name or alias (e.g., "markdown", "md", "recursive")

##### config?

[`ChunkerConfig`](../type-aliases/ChunkerConfig.md)

Optional configuration to override defaults

#### Returns

`Promise`\<[`Chunker`](../interfaces/Chunker.md)\>

Configured chunker instance

#### Throws

`ChunkingError` - If strategy is not found or creation fails

---

### registerChunker()

> **registerChunker**(`strategy`, `factory`, `metadata`): `void`

Defined in: [rag/ChunkerFactory.ts:239](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L239)

Register a custom chunker with metadata and aliases.

#### Parameters

##### strategy

[`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md) | `string`

Strategy name to register

##### factory

(`config?`: [`ChunkerConfig`](../type-aliases/ChunkerConfig.md)) => `Promise`\<[`Chunker`](../interfaces/Chunker.md)\>

Async factory function that creates the chunker

##### metadata

[`ChunkerMetadata`](../type-aliases/ChunkerMetadata.md)

Metadata including description, defaults, and aliases

#### Returns

`void`

---

### getAvailableStrategies()

> **getAvailableStrategies**(): `Promise`\<[`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)[]\>

Defined in: [rag/ChunkerFactory.ts:312](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L312)

Get all available chunking strategies (not including aliases).

#### Returns

`Promise`\<[`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)[]\>

Array of strategy names

---

### getChunkerMetadata()

> **getChunkerMetadata**(`strategyOrAlias`): [`ChunkerMetadata`](../type-aliases/ChunkerMetadata.md) | `undefined`

Defined in: [rag/ChunkerFactory.ts:296](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L296)

Get metadata for a chunker strategy.

#### Parameters

##### strategyOrAlias

`string`

Strategy name or alias

#### Returns

[`ChunkerMetadata`](../type-aliases/ChunkerMetadata.md) | `undefined`

Chunker metadata or undefined if not found

---

### getDefaultConfig()

> **getDefaultConfig**(`strategyOrAlias`): [`ChunkerConfig`](../type-aliases/ChunkerConfig.md) | `undefined`

Defined in: [rag/ChunkerFactory.ts:304](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L304)

Get the default configuration for a chunker strategy.

#### Parameters

##### strategyOrAlias

`string`

Strategy name or alias

#### Returns

[`ChunkerConfig`](../type-aliases/ChunkerConfig.md) | `undefined`

Default configuration or undefined if not found

---

### getStrategyAliases()

> **getStrategyAliases**(): `Map`\<`string`, `string`\>

Defined in: [rag/ChunkerFactory.ts:320](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L320)

Get all aliases mapped to their canonical strategy names.

#### Returns

`Map`\<`string`, `string`\>

Map of alias to strategy name

---

### hasStrategy()

> **hasStrategy**(`strategyOrAlias`): `boolean`

Defined in: [rag/ChunkerFactory.ts:327](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L327)

Check if a strategy or alias exists.

#### Parameters

##### strategyOrAlias

`string`

Strategy name or alias to check

#### Returns

`boolean`

True if the strategy exists

---

### getChunkersForUseCase()

> **getChunkersForUseCase**(`useCase`): [`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)[]

Defined in: [rag/ChunkerFactory.ts:335](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L335)

Get chunkers suitable for a specific use case.

#### Parameters

##### useCase

`string`

Use case description (e.g., "documentation", "Q&A")

#### Returns

[`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md)[]

Array of matching strategy names

---

### getAllMetadata()

> **getAllMetadata**(): `Map`\<`string`, [`ChunkerMetadata`](../type-aliases/ChunkerMetadata.md)\>

Defined in: [rag/ChunkerFactory.ts:352](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L352)

Get metadata for all registered chunkers.

#### Returns

`Map`\<`string`, [`ChunkerMetadata`](../type-aliases/ChunkerMetadata.md)\>

Map of strategy names to their metadata

---

### clear()

> **clear**(): `void`

Defined in: [rag/ChunkerFactory.ts:359](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L359)

Clear the factory registry and metadata.

#### Returns

`void`

## Examples

### Basic Usage

```typescript
import { chunkerFactory } from "@juspay/neurolink";

// Create a markdown chunker with custom config
const chunker = await chunkerFactory.createChunker("markdown", {
  maxSize: 500,
  headerLevels: [1, 2],
});

// Chunk a document
const chunks = await chunker.chunk(markdownContent);
console.log(`Created ${chunks.length} chunks`);
```

### Using Aliases

```typescript
import { chunkerFactory } from "@juspay/neurolink";

// "md" is an alias for "markdown"
const chunker = await chunkerFactory.createChunker("md");

// "char" is an alias for "character"
const charChunker = await chunkerFactory.createChunker("char", {
  maxSize: 1000,
  overlap: 100,
});
```

### Using Convenience Functions

```typescript
import {
  createChunker,
  getAvailableStrategies,
  getChunkerMetadata,
  getDefaultConfig,
} from "@juspay/neurolink";

// Create chunker directly
const chunker = await createChunker("recursive", {
  separators: ["\n\n", "\n", ". ", " "],
});

// List available strategies
const strategies = await getAvailableStrategies();
console.log("Available:", strategies);
// ["character", "recursive", "sentence", "token", "markdown", "html", "json", "latex", "semantic", "semantic-markdown"]

// Get metadata for a strategy
const metadata = getChunkerMetadata("markdown");
console.log(metadata?.description);
// "Splits markdown content by headers and structural elements"

// Get default config
const defaults = getDefaultConfig("token");
console.log(defaults);
// { maxSize: 512, overlap: 50 }
```

### Finding Chunkers by Use Case

```typescript
import { chunkerFactory } from "@juspay/neurolink";

// Find chunkers for documentation processing
const docChunkers = chunkerFactory.getChunkersForUseCase("documentation");
console.log(docChunkers); // ["markdown"]

// Find chunkers for Q&A applications
const qaChunkers = chunkerFactory.getChunkersForUseCase("Q&A");
console.log(qaChunkers); // ["sentence"]
```

### Registering Custom Chunkers

```typescript
import { chunkerFactory } from "@juspay/neurolink";

// Register a custom chunker
chunkerFactory.registerChunker(
  "custom-xml",
  async (config) => {
    return new MyXMLChunker(config);
  },
  {
    description: "Custom XML-aware chunker",
    defaultConfig: { maxSize: 1000 },
    supportedOptions: ["maxSize", "splitTags"],
    useCases: ["XML documents", "SOAP responses"],
    aliases: ["xml"],
  },
);

// Now usable via factory
const xmlChunker = await chunkerFactory.createChunker("xml");
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

- The factory uses **lazy initialization** - chunkers are registered on first access
- All chunker creation is **async** due to dynamic imports
- The **singleton pattern** ensures consistent behavior across the application
- Use `resetInstance()` in tests to get a fresh factory state

## See Also

- [ChunkerRegistry](./ChunkerRegistry.md) - Alternative registry-based chunker access
- [ChunkingStrategy](../type-aliases/ChunkingStrategy.md) - Strategy type definition
- [ChunkerConfig](../type-aliases/ChunkerConfig.md) - Configuration type union
- [ChunkerMetadata](../type-aliases/ChunkerMetadata.md) - Metadata type definition
- [MDocument](./MDocument.md) - Document class with integrated chunking
- [createChunker](../functions/createChunker.md) - Convenience function
- [getAvailableStrategies](../functions/getAvailableStrategies.md) - List strategies function
