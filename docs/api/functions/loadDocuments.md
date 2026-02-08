[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / loadDocuments

# Function: loadDocuments()

> **loadDocuments**(`sources`, `options?`): `Promise<MDocument[]>`

Defined in: [lib/rag/document/loaders.ts:648](https://github.com/juspay/neurolink/blob/main/src/lib/rag/document/loaders.ts#L648)

Load multiple documents in parallel with error handling.

Processes an array of sources concurrently using `Promise.allSettled`,
ensuring that failures in individual documents don't prevent others from loading.
Failed documents are logged as warnings but don't throw errors.

## Parameters

### sources

`string[]`

Array of file paths, URLs, or raw content strings to load

### options?

`LoaderOptions`

Optional loader configuration applied to all documents

#### options.metadata?

`Record<string, unknown>`

Custom metadata to add to all documents

#### options.encoding?

`BufferEncoding`

Text encoding for file reading (default: `"utf-8"`)

#### options.type?

`DocumentType`

Override auto-detected document type for all sources

## Returns

`Promise<MDocument[]>`

Promise resolving to array of successfully loaded MDocument instances

## Examples

### Load multiple files

```typescript
import { loadDocuments } from "@juspay/neurolink";

const docs = await loadDocuments([
  "/path/to/doc1.md",
  "/path/to/doc2.md",
  "/path/to/doc3.md",
]);

console.log(`Loaded ${docs.length} documents`);
```

### Load mixed sources

```typescript
import { loadDocuments } from "@juspay/neurolink";

const docs = await loadDocuments([
  "./README.md",
  "./config.json",
  "https://example.com/article",
  "./data.csv",
]);

// Each document is loaded with the appropriate loader
for (const doc of docs) {
  console.log(`${doc.getMetadata().source}: ${doc.getType()}`);
}
```

### Load with shared metadata

```typescript
import { loadDocuments } from "@juspay/neurolink";

const docs = await loadDocuments(
  ["./chapter1.md", "./chapter2.md", "./chapter3.md"],
  {
    metadata: {
      book: "User Guide",
      version: "2.0",
      loadedAt: new Date().toISOString(),
    },
  },
);
```

### Process loaded documents

```typescript
import { loadDocuments } from "@juspay/neurolink";

const docs = await loadDocuments(filePaths);

// Process all documents
const allChunks = [];
for (const doc of docs) {
  await doc.chunk({ strategy: "recursive", config: { maxSize: 1000 } });
  allChunks.push(...doc.getChunks());
}

console.log(
  `Created ${allChunks.length} total chunks from ${docs.length} documents`,
);
```

### Handle partial failures gracefully

```typescript
import { loadDocuments } from "@juspay/neurolink";

// Some files may not exist or fail to load
const sources = [
  "./valid-file.md",
  "./missing-file.md", // Will fail but not throw
  "./another-valid.md",
];

const docs = await loadDocuments(sources);
// docs will contain only successfully loaded documents
// Failed loads are logged as warnings

console.log(
  `Successfully loaded ${docs.length} of ${sources.length} documents`,
);
```

### Batch processing pipeline

```typescript
import { loadDocuments } from "@juspay/neurolink";
import { glob } from "glob";

// Load all markdown files in a directory
const files = await glob("./docs/**/*.md");
const docs = await loadDocuments(files);

// Chunk all documents
await Promise.all(
  docs.map((doc) =>
    doc.chunk({ strategy: "markdown", config: { maxSize: 1000 } }),
  ),
);

// Collect all chunks for indexing
const allChunks = docs.flatMap((doc) => doc.getChunks());
```

## Notes

- Uses `Promise.allSettled` for resilient parallel loading
- Failed documents are logged but don't cause the function to throw
- The returned array may be smaller than the input if some sources fail
- All successfully loaded documents maintain their original order
- Options are applied uniformly to all documents

## Since

v8.44.0

## See Also

- [loadDocument](./loadDocument.md) - Load a single document
- [MDocument](../classes/MDocument.md) - Document processing class
