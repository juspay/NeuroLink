[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / MDocument

# Class: MDocument

Defined in: [src/lib/rag/document/MDocument.ts:63](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L63)

Fluent document class for RAG processing with chainable methods for chunking, embedding, and metadata extraction.

## Description

MDocument provides a builder-pattern interface for document processing using the Factory + Registry pattern. It supports multiple document types (text, markdown, HTML, JSON, LaTeX, CSV) and maintains processing history throughout the document lifecycle.

Key features:

- Static factory methods for different document types
- Chainable async methods for processing pipelines
- Multiple chunking strategies via ChunkerRegistry
- LLM-based metadata extraction (title, summary, keywords)
- Embedding generation with configurable providers
- Full serialization/deserialization support
- Processing history tracking

## Examples

### Basic Document Processing

```typescript
import { MDocument } from "@juspay/neurolink";

// Create document from markdown content
const doc = MDocument.fromMarkdown(markdownContent);

// Chunk the document
await doc.chunk({
  strategy: "markdown",
  config: { maxSize: 500, headerLevels: [1, 2, 3] },
});

// Get the resulting chunks
const chunks = doc.getChunks();
console.log(`Generated ${chunks.length} chunks`);
```

### Fluent Processing Chain

```typescript
import { MDocument } from "@juspay/neurolink";

const doc = await MDocument.fromText(content).chunk({
  strategy: "recursive",
  config: { maxSize: 1000, overlap: 200 },
});

await doc.extractMetadata({
  title: true,
  summary: true,
  keywords: true,
});

await doc.embed("openai", "text-embedding-3-small");

// Access results
const chunks = doc.getChunks();
const embeddings = doc.getEmbeddings();
const history = doc.getHistory();
```

### Processing with Custom Metadata

```typescript
const doc = MDocument.fromHTML(htmlContent, {
  source: "https://example.com/page",
  author: "John Doe",
  category: "documentation",
});

await doc.chunk({ strategy: "html" });
doc.setMetadata("processedAt", new Date().toISOString());

console.log(doc.getMetadata());
```

### Serialization and Restoration

```typescript
// Serialize document state
const serialized = doc.toJSON();
const jsonString = JSON.stringify(serialized);

// Restore from serialized state
const restored = MDocument.fromJSON(JSON.parse(jsonString));
console.log(restored.getChunks()); // Chunks are preserved
```

## Constructors

### Constructor

> **new MDocument**(`content`, `config?`): `MDocument`

Defined in: [src/lib/rag/document/MDocument.ts:72](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L72)

Create a new MDocument instance.

#### Parameters

##### content

`string`

Document content

##### config?

[`MDocumentConfig`](../type-aliases/MDocumentConfig.md)

Document configuration including type and metadata

#### Returns

`MDocument`

## Static Factory Methods

### fromText()

> `static` **fromText**(`text`, `metadata?`): `MDocument`

Defined in: [src/lib/rag/document/MDocument.ts:98](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L98)

Create MDocument from plain text.

#### Parameters

##### text

`string`

Plain text content

##### metadata?

`Record<string, unknown>`

Optional metadata to attach

#### Returns

`MDocument`

New MDocument instance with type "text"

#### Example

```typescript
const doc = MDocument.fromText("Hello world", { source: "greeting.txt" });
```

---

### fromMarkdown()

> `static` **fromMarkdown**(`markdown`, `metadata?`): `MDocument`

Defined in: [src/lib/rag/document/MDocument.ts:108](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L108)

Create MDocument from markdown content.

#### Parameters

##### markdown

`string`

Markdown content

##### metadata?

`Record<string, unknown>`

Optional metadata to attach

#### Returns

`MDocument`

New MDocument instance with type "markdown"

#### Example

```typescript
const doc = MDocument.fromMarkdown("# Title\n\nContent here");
await doc.chunk({ strategy: "markdown" });
```

---

### fromHTML()

> `static` **fromHTML**(`html`, `metadata?`): `MDocument`

Defined in: [src/lib/rag/document/MDocument.ts:121](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L121)

Create MDocument from HTML content.

#### Parameters

##### html

`string`

HTML content

##### metadata?

`Record<string, unknown>`

Optional metadata to attach

#### Returns

`MDocument`

New MDocument instance with type "html"

#### Example

```typescript
const doc = MDocument.fromHTML("<div><p>Content</p></div>");
await doc.chunk({ strategy: "html", config: { extractTextOnly: true } });
```

---

### fromJSONContent()

> `static` **fromJSONContent**(`json`, `metadata?`): `MDocument`

Defined in: [src/lib/rag/document/MDocument.ts:131](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L131)

Create MDocument from JSON content.

#### Parameters

##### json

`string | object`

JSON string or object (will be stringified)

##### metadata?

`Record<string, unknown>`

Optional metadata to attach

#### Returns

`MDocument`

New MDocument instance with type "json"

#### Example

```typescript
const doc = MDocument.fromJSONContent({ users: [...], config: {...} });
await doc.chunk({ strategy: "json", config: { splitKeys: ["users"] } });
```

---

### fromLaTeX()

> `static` **fromLaTeX**(`latex`, `metadata?`): `MDocument`

Defined in: [src/lib/rag/document/MDocument.ts:146](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L146)

Create MDocument from LaTeX content.

#### Parameters

##### latex

`string`

LaTeX content

##### metadata?

`Record<string, unknown>`

Optional metadata to attach

#### Returns

`MDocument`

New MDocument instance with type "latex"

#### Example

```typescript
const doc = MDocument.fromLaTeX("\\section{Introduction}\nContent...");
await doc.chunk({ strategy: "latex" });
```

---

### fromCSV()

> `static` **fromCSV**(`csv`, `metadata?`): `MDocument`

Defined in: [src/lib/rag/document/MDocument.ts:159](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L159)

Create MDocument from CSV content.

#### Parameters

##### csv

`string`

CSV content

##### metadata?

`Record<string, unknown>`

Optional metadata to attach

#### Returns

`MDocument`

New MDocument instance with type "csv"

---

### fromJSON()

> `static` **fromJSON**(`json`): `MDocument`

Defined in: [src/lib/rag/document/MDocument.ts:486](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L486)

Create MDocument from serialized JSON (deserialization).

Restores a previously serialized MDocument including its chunks, history, and metadata.

#### Parameters

##### json

Serialized document data

| Property    | Type                                              | Description                 |
| ----------- | ------------------------------------------------- | --------------------------- |
| `id?`       | `string`                                          | Document ID to restore      |
| `content`   | `string`                                          | Document content            |
| `type`      | [`DocumentType`](../type-aliases/DocumentType.md) | Document type               |
| `metadata?` | `Record<string, unknown>`                         | Document metadata           |
| `chunks?`   | [`Chunk`](../type-aliases/Chunk.md)[]             | Previously generated chunks |
| `history?`  | `string[]`                                        | Processing history          |

#### Returns

`MDocument`

Restored MDocument instance

#### Example

```typescript
const serialized = existingDoc.toJSON();
const restored = MDocument.fromJSON(serialized);
```

## Instance Methods

### Core Processing Methods

#### chunk()

> **chunk**(`params?`): `Promise<MDocument>`

Defined in: [src/lib/rag/document/MDocument.ts:172](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L172)

Chunk the document using the specified strategy.

Uses ChunkerRegistry to get the appropriate chunker. If no strategy is specified, automatically selects the best strategy based on document type.

#### Parameters

##### params?

[`ChunkParams`](../type-aliases/ChunkParams.md)

Chunking parameters

| Property    | Type                                                      | Description                                      |
| ----------- | --------------------------------------------------------- | ------------------------------------------------ |
| `strategy?` | [`ChunkingStrategy`](../type-aliases/ChunkingStrategy.md) | Strategy to use (auto-detected if not specified) |
| `config?`   | [`ChunkerConfig`](../type-aliases/ChunkerConfig.md)       | Strategy-specific configuration                  |

#### Returns

`Promise<MDocument>`

This MDocument instance (for chaining)

#### Example

```typescript
await doc.chunk({
  strategy: "recursive",
  config: { maxSize: 1000, overlap: 200, separators: ["\n\n", "\n", " "] },
});
```

---

#### extractMetadata()

> **extractMetadata**(`params`, `options?`): `Promise<MDocument>`

Defined in: [src/lib/rag/document/MDocument.ts:211](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L211)

Extract metadata from chunks using LLM.

Requires `chunk()` to be called first. Uses LLMMetadataExtractor to analyze chunks and extract titles, summaries, keywords, or custom fields.

#### Parameters

##### params

[`ExtractParams`](../type-aliases/ExtractParams.md)

Extraction parameters specifying what to extract

| Property    | Type                                | Description              |
| ----------- | ----------------------------------- | ------------------------ |
| `title?`    | `boolean \| TitleExtractorConfig`   | Extract document title   |
| `summary?`  | `boolean \| SummaryExtractorConfig` | Extract summary          |
| `keywords?` | `boolean \| KeywordExtractorConfig` | Extract keywords         |
| `custom?`   | `CustomSchemaExtractorConfig`       | Custom schema extraction |

##### options?

Extractor options

| Property     | Type     | Description               |
| ------------ | -------- | ------------------------- |
| `provider?`  | `string` | LLM provider name         |
| `modelName?` | `string` | Model name for extraction |

#### Returns

`Promise<MDocument>`

This MDocument instance (for chaining)

#### Example

```typescript
await doc.chunk({ strategy: "recursive" });
await doc.extractMetadata(
  { title: true, summary: true, keywords: { maxKeywords: 10 } },
  { provider: "openai", modelName: "gpt-4" },
);
```

---

#### embed()

> **embed**(`provider?`, `modelName?`): `Promise<MDocument>`

Defined in: [src/lib/rag/document/MDocument.ts:267](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L267)

Generate embeddings for all chunks.

Requires `chunk()` to be called first. Embeddings are stored both in the document state and on each chunk object.

#### Parameters

##### provider?

`string`

Embedding provider name (uses NEUROLINK_PROVIDER env var or "vertex" if not specified)

##### modelName?

`string`

Embedding model name (uses VERTEX_MODEL env var or "gemini-2.5-flash" for Vertex, provider-specific defaults for others)

#### Returns

`Promise<MDocument>`

This MDocument instance (for chaining)

#### Throws

When provider does not support embeddings

#### Example

```typescript
await doc.chunk({ strategy: "recursive" });
await doc.embed("openai", "text-embedding-3-small");

const embeddings = doc.getEmbeddings();
console.log(
  `Generated ${embeddings.length} embeddings of dimension ${embeddings[0].length}`,
);
```

### Accessor Methods

#### getId()

> **getId**(): `string`

Defined in: [src/lib/rag/document/MDocument.ts:330](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L330)

Get the unique document ID.

#### Returns

`string`

UUID assigned at document creation

---

#### getContent()

> **getContent**(): `string`

Defined in: [src/lib/rag/document/MDocument.ts:337](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L337)

Get raw document content.

#### Returns

`string`

Original document content

---

#### getType()

> **getType**(): [`DocumentType`](../type-aliases/DocumentType.md)

Defined in: [src/lib/rag/document/MDocument.ts:344](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L344)

Get document type.

#### Returns

[`DocumentType`](../type-aliases/DocumentType.md)

Document type ("text", "markdown", "html", "json", "latex", "csv")

---

#### getMetadata()

> **getMetadata**(): `Record<string, unknown>`

Defined in: [src/lib/rag/document/MDocument.ts:351](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L351)

Get document metadata.

#### Returns

`Record<string, unknown>`

Copy of document metadata object

---

#### getChunks()

> **getChunks**(): [`Chunk`](../type-aliases/Chunk.md)[]

Defined in: [src/lib/rag/document/MDocument.ts:358](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L358)

Get processed chunks.

#### Returns

[`Chunk`](../type-aliases/Chunk.md)[]

Copy of chunks array (empty if `chunk()` not called)

---

#### getEmbeddings()

> **getEmbeddings**(): `number[][]`

Defined in: [src/lib/rag/document/MDocument.ts:365](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L365)

Get chunk embeddings.

#### Returns

`number[][]`

Copy of embeddings array (empty if `embed()` not called)

---

#### getHistory()

> **getHistory**(): `string[]`

Defined in: [src/lib/rag/document/MDocument.ts:372](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L372)

Get processing history.

#### Returns

`string[]`

Array of processing steps (e.g., ["created", "chunked:recursive", "embedded:openai:text-embedding-3-small"])

---

#### isChunked()

> **isChunked**(): `boolean`

Defined in: [src/lib/rag/document/MDocument.ts:379](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L379)

Check if document has been chunked.

#### Returns

`boolean`

True if chunks have been generated

---

#### hasEmbeddings()

> **hasEmbeddings**(): `boolean`

Defined in: [src/lib/rag/document/MDocument.ts:386](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L386)

Check if document has embeddings.

#### Returns

`boolean`

True if embeddings have been generated

---

#### getChunkCount()

> **getChunkCount**(): `number`

Defined in: [src/lib/rag/document/MDocument.ts:393](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L393)

Get chunk count.

#### Returns

`number`

Number of chunks (0 if not chunked)

### Transformation Methods

#### setMetadata()

> **setMetadata**(`key`, `value`): `MDocument`

Defined in: [src/lib/rag/document/MDocument.ts:407](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L407)

Set a single metadata key-value pair.

#### Parameters

##### key

`string`

Metadata key

##### value

`unknown`

Metadata value

#### Returns

`MDocument`

This MDocument instance (for chaining)

---

#### mergeMetadata()

> **mergeMetadata**(`metadata`): `MDocument`

Defined in: [src/lib/rag/document/MDocument.ts:417](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L417)

Merge metadata into document.

#### Parameters

##### metadata

`Record<string, unknown>`

Metadata object to merge

#### Returns

`MDocument`

This MDocument instance (for chaining)

---

#### filterChunks()

> **filterChunks**(`predicate`): `MDocument`

Defined in: [src/lib/rag/document/MDocument.ts:427](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L427)

Filter chunks based on predicate.

Creates a new MDocument with filtered chunks. Corresponding embeddings are also filtered.

#### Parameters

##### predicate

`(chunk: Chunk) => boolean`

Filter function

#### Returns

`MDocument`

New MDocument with filtered chunks

#### Example

```typescript
const filtered = doc.filterChunks((chunk) => chunk.text.length > 100);
```

---

#### mapChunks()

> **mapChunks**(`transform`): `MDocument`

Defined in: [src/lib/rag/document/MDocument.ts:445](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L445)

Map transformation over chunks.

Creates a new MDocument with transformed chunks.

#### Parameters

##### transform

`(chunk: Chunk) => Chunk`

Transform function

#### Returns

`MDocument`

New MDocument with transformed chunks

#### Example

```typescript
const transformed = doc.mapChunks((chunk) => ({
  ...chunk,
  text: chunk.text.toLowerCase(),
}));
```

### Serialization Methods

#### toJSON()

> **toJSON**(): `object`

Defined in: [src/lib/rag/document/MDocument.ts:463](https://github.com/juspay/neurolink/blob/feat/rag-processing/src/lib/rag/document/MDocument.ts#L463)

Convert to plain object for serialization.

#### Returns

`object`

Serializable object with all document state

| Property   | Type                                              |
| ---------- | ------------------------------------------------- |
| `id`       | `string`                                          |
| `content`  | `string`                                          |
| `type`     | [`DocumentType`](../type-aliases/DocumentType.md) |
| `metadata` | `Record<string, unknown>`                         |
| `chunks`   | [`Chunk`](../type-aliases/Chunk.md)[]             |
| `history`  | `string[]`                                        |

## Properties

| Property           | Type                                              | Description                                            |
| ------------------ | ------------------------------------------------- | ------------------------------------------------------ |
| `documentId`       | `string`                                          | Unique document identifier (UUID)                      |
| `state.content`    | `string`                                          | Raw document content                                   |
| `state.type`       | [`DocumentType`](../type-aliases/DocumentType.md) | Document type (text, markdown, html, json, latex, csv) |
| `state.metadata`   | `Record<string, unknown>`                         | Document metadata including documentId and createdAt   |
| `state.chunks`     | [`Chunk`](../type-aliases/Chunk.md)[]             | Processed chunks (populated after `chunk()`)           |
| `state.embeddings` | `number[][]`                                      | Embedding vectors (populated after `embed()`)          |
| `state.history`    | `string[]`                                        | Processing history log                                 |

## See Also

- [loadDocument](../functions/loadDocument.md) - Load documents from files
- [Chunk](../type-aliases/Chunk.md) - Chunk type definition
- [ChunkingStrategy](../type-aliases/ChunkingStrategy.md) - Available chunking strategies
- [ChunkerConfig](../type-aliases/ChunkerConfig.md) - Chunker configuration options
- [ExtractParams](../type-aliases/ExtractParams.md) - Metadata extraction parameters
- [DocumentType](../type-aliases/DocumentType.md) - Supported document types
