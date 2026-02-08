[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / loadDocument

# Function: loadDocument()

> **loadDocument**(`source`, `options?`): `Promise<MDocument>`

Defined in: [lib/rag/document/loaders.ts:621](https://github.com/juspay/neurolink/blob/main/src/lib/rag/document/loaders.ts#L621)

Load a document from a file path, URL, or raw content.

Automatically detects the document type based on file extension or URL protocol
and uses the appropriate loader. Supports text, markdown, HTML, JSON, CSV, PDF,
and web pages.

## Parameters

### source

`string`

File path, URL, or raw content string to load

### options?

`LoaderOptions`

Optional loader configuration

#### options.metadata?

`Record<string, unknown>`

Custom metadata to add to the document

#### options.encoding?

`BufferEncoding`

Text encoding for file reading (default: `"utf-8"`)

#### options.type?

`DocumentType`

Override auto-detected document type

## Returns

`Promise<MDocument>`

Promise resolving to an MDocument instance ready for processing

## Examples

### Load from file path

```typescript
import { loadDocument } from "@juspay/neurolink";

// Load markdown file
const doc = await loadDocument("/path/to/document.md");

// Load with custom metadata
const docWithMeta = await loadDocument("/path/to/data.json", {
  metadata: { project: "research", author: "Jane Doe" },
});
```

### Load from URL

```typescript
import { loadDocument } from "@juspay/neurolink";

// Load web page
const webDoc = await loadDocument("https://example.com/article");

// The document type is automatically detected as HTML
console.log(webDoc.getType()); // "html"
```

### Load different file types

```typescript
import { loadDocument } from "@juspay/neurolink";

// Markdown
const mdDoc = await loadDocument("./README.md");

// JSON
const jsonDoc = await loadDocument("./config.json");

// CSV
const csvDoc = await loadDocument("./data.csv");

// PDF (requires pdf-parse package)
const pdfDoc = await loadDocument("./report.pdf");

// HTML
const htmlDoc = await loadDocument("./page.html");
```

### Process loaded document

```typescript
import { loadDocument } from "@juspay/neurolink";

const doc = await loadDocument("/path/to/document.md");

// Chain processing operations
await doc.chunk({ strategy: "markdown", config: { maxSize: 1000 } });
await doc.extractMetadata({ title: true, summary: true });
await doc.embed("openai", "text-embedding-3-small");

// Get processed chunks
const chunks = doc.getChunks();
console.log(`Created ${chunks.length} chunks`);
```

### Load raw content

```typescript
import { loadDocument } from "@juspay/neurolink";

// If source is not a valid file path or URL, it's treated as raw content
const doc = await loadDocument("This is some raw text content", {
  type: "text",
  metadata: { source: "inline" },
});
```

## Supported File Types

| Extension                  | Document Type | Loader         |
| -------------------------- | ------------- | -------------- |
| `.txt`                     | text          | TextLoader     |
| `.md`, `.markdown`, `.mdx` | markdown      | MarkdownLoader |
| `.html`, `.htm`, `.xhtml`  | html          | HTMLLoader     |
| `.json`, `.jsonl`          | json          | JSONLoader     |
| `.csv`, `.tsv`             | csv           | CSVLoader      |
| `.pdf`                     | pdf           | PDFLoader      |
| `http://`, `https://`      | html          | WebLoader      |

## Notes

- File existence is checked before loading; non-existent files are treated as raw content. Note: PDF files will throw an error if the file doesn't exist. Only text-based files may fall back to raw content treatment.
- PDF loading requires the optional `pdf-parse` package
- Web loading supports timeout configuration and content extraction
- The returned MDocument supports method chaining for processing workflows

## Since

v8.44.0

## See Also

- [loadDocuments](./loadDocuments.md) - Load multiple documents in parallel
- [MDocument](../classes/MDocument.md) - Document processing class
