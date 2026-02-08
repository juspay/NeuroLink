[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / ChunkerMetadata

# Type Alias: ChunkerMetadata

> **ChunkerMetadata** = `object`

Defined in: [lib/rag/types.ts:283](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L283)

Metadata for chunker registration in the ChunkerRegistry. Provides descriptive information about chunker capabilities, supported document types, and configuration options.

## Since

v8.44.0

## Properties

### description

> **description**: `string`

Human-readable description of the chunker's purpose and behavior

---

### supportedTypes?

> `optional` **supportedTypes**: [`DocumentType`](DocumentType.md)[]

Document types this chunker is optimized for

---

### requiresExternalDeps?

> `optional` **requiresExternalDeps**: `boolean`

Whether the chunker requires external dependencies (e.g., tokenizers, LLM providers)

---

### defaultConfig?

> `optional` **defaultConfig**: `Record<string, unknown>`

Default configuration values for this chunker

---

### supportedOptions?

> `optional` **supportedOptions**: `string[]`

List of supported configuration option names

---

### useCases?

> `optional` **useCases**: `string[]`

Use cases where this chunker excels

---

### aliases?

> `optional` **aliases**: `string[]`

Alternative names or aliases for this chunker

## Example

```typescript
import { ChunkerRegistry, type ChunkerMetadata } from "@juspay/neurolink";

// Registering a custom chunker with metadata
const metadata: ChunkerMetadata = {
  description: "Splits documents by paragraph boundaries",
  supportedTypes: ["text", "markdown"],
  requiresExternalDeps: false,
  defaultConfig: {
    maxSize: 1000,
    overlap: 100,
  },
  supportedOptions: ["maxSize", "minSize", "overlap", "trimWhitespace"],
  useCases: ["Blog posts", "Articles", "Documentation"],
  aliases: ["paragraph", "para"],
};

ChunkerRegistry.register("paragraph", paragraphChunker, metadata);

// Querying chunker metadata
const allChunkers = ChunkerRegistry.list();
const markdownChunkers = ChunkerRegistry.listForType("markdown");
```
