[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / DocumentType

# Type Alias: DocumentType

> **DocumentType** = `"text"` | `"markdown"` | `"html"` | `"json"` | `"latex"` | `"csv"` | `"pdf"`

Defined in: [lib/rag/types.ts:16](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L16)

Supported document types for RAG document processing. Each type has optimized chunking strategies and metadata extraction patterns.

## Since

v8.44.0

## Values

### "text"

Plain text documents with no special formatting

---

### "markdown"

Markdown formatted documents with headers, lists, and code blocks

---

### "html"

HTML documents with DOM structure

---

### "json"

JSON structured data documents

---

### "latex"

LaTeX scientific documents with mathematical notation

---

### "csv"

Comma-separated values tabular data

---

### "pdf"

PDF documents (requires PDF parsing)

## Example

```typescript
import { MDocument, type DocumentType } from "@juspay/neurolink";

// Explicit type specification
const docType: DocumentType = "markdown";

// Using with MDocument factory methods
const markdownDoc = MDocument.fromMarkdown("# Title\n\nContent here");
const htmlDoc = MDocument.fromHTML("<h1>Title</h1><p>Content</p>");
const jsonDoc = MDocument.fromJSONContent({ key: "value" });

// Manual configuration
const doc = new MDocument(content, {
  type: "latex",
  metadata: { source: "paper.tex" },
});
```
