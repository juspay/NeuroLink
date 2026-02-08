[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / ChunkerConfig

# Type Alias: ChunkerConfig

> **ChunkerConfig** = [`CharacterChunkerConfig`](CharacterChunkerConfig.md) | [`RecursiveChunkerConfig`](RecursiveChunkerConfig.md) | [`SentenceChunkerConfig`](SentenceChunkerConfig.md) | [`TokenChunkerConfig`](TokenChunkerConfig.md) | [`MarkdownChunkerConfig`](MarkdownChunkerConfig.md) | [`HTMLChunkerConfig`](HTMLChunkerConfig.md) | [`JSONChunkerConfig`](JSONChunkerConfig.md) | [`LaTeXChunkerConfig`](LaTeXChunkerConfig.md) | [`SemanticChunkerConfig`](SemanticChunkerConfig.md)

Defined in: [lib/rag/types.ts:253](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L253)

Union type for all chunker configurations. The specific configuration type depends on the chosen chunking strategy.

## Base Properties

All chunker configurations inherit these base properties:

### maxSize?

> `optional` **maxSize**: `number`

Maximum chunk size (interpretation varies by strategy - characters, tokens, etc.)

---

### minSize?

> `optional` **minSize**: `number`

Minimum chunk size

---

### overlap?

> `optional` **overlap**: `number`

Overlap between consecutive chunks

---

### trimWhitespace?

> `optional` **trimWhitespace**: `boolean`

Whether to trim whitespace from chunks

---

### metadata?

> `optional` **metadata**: `Record<string, unknown>`

Custom metadata to add to all chunks

---

### preserveMetadata?

> `optional` **preserveMetadata**: `boolean`

Whether to preserve metadata from source document

## Strategy-Specific Configurations

### CharacterChunkerConfig

For `"character"` strategy:

- `separator?`: Character separator (default: "")
- `keepSeparator?`: Keep separator in chunks

### RecursiveChunkerConfig

For `"recursive"` strategy:

- `separators?`: Ordered list of separators to try (default: ["\n\n", "\n", " ", ""])
- `isSeparatorRegex?`: Whether separators are regex patterns
- `keepSeparators?`: Whether to keep separators in the output chunks

### SentenceChunkerConfig

For `"sentence"` strategy:

- `sentenceEnders?`: Sentence ending characters (default: [".", "!", "?", "\n"])
- `minSentences?`: Minimum sentences per chunk
- `maxSentences?`: Maximum sentences per chunk

### TokenChunkerConfig

For `"token"` strategy:

- `tokenizer?`: Tokenizer to use (default: "cl100k_base" for GPT models)
- `modelName?`: Model name for token counting (alternative to tokenizer)
- `maxTokens?`: Maximum tokens per chunk
- `tokenOverlap?`: Token overlap between chunks

### MarkdownChunkerConfig

For `"markdown"` strategy:

- `headerLevels?`: Header levels to split on (default: [1, 2, 3])
- `preserveCodeBlocks?`: Include code blocks as single chunks
- `includeHeader?`: Include the header in the chunk content
- `stripFormatting?`: Strip markdown formatting from output

### HTMLChunkerConfig

For `"html"` strategy:

- `splitTags?`: Tags to split on (default: ["div", "p", "section", "article"])
- `preserveTags?`: Tags to preserve as single chunks
- `extractTextOnly?`: Extract text only (strip HTML tags)
- `includeTagMetadata?`: Include tag metadata in chunks

### JSONChunkerConfig

For `"json"` strategy:

- `maxDepth?`: Maximum depth to traverse
- `splitKeys?`: Keys to split on (arrays/objects at these keys become chunks)
- `preserveKeys?`: Keys to preserve as single units
- `includeJsonPath?`: Include JSON path in metadata

### LaTeXChunkerConfig

For `"latex"` strategy:

- `splitEnvironments?`: Environments to split on (default: ["section", "subsection", "chapter"])
- `preserveMath?`: Preserve math environments as single chunks
- `includePreamble?`: Include preamble as separate chunk

### SemanticChunkerConfig

For `"semantic"` and `"semantic-markdown"` strategies:

- `joinThreshold?`: Minimum tokens before considering a split
- `modelName?`: Model for semantic analysis
- `provider?`: Provider for the model
- `semanticPrompt?`: Custom prompt for semantic grouping
- `maxHeaderDepth?`: Maximum header depth to consider for grouping
- `similarityThreshold?`: Similarity threshold for grouping (0-1)

## Example

```typescript
import { MDocument, ChunkerConfig } from "@juspay/neurolink";

// Recursive chunking configuration
const recursiveConfig: ChunkerConfig = {
  maxSize: 512,
  overlap: 50,
  separators: ["\n\n", "\n", ". ", " "],
  trimWhitespace: true,
};

// Markdown chunking configuration
const markdownConfig: ChunkerConfig = {
  maxSize: 1000,
  headerLevels: [1, 2, 3],
  preserveCodeBlocks: true,
  includeHeader: true,
};

// Token-based chunking configuration
const tokenConfig: ChunkerConfig = {
  maxTokens: 256,
  tokenOverlap: 20,
  tokenizer: "cl100k_base",
};

// Semantic chunking configuration
const semanticConfig: ChunkerConfig = {
  maxSize: 1000,
  similarityThreshold: 0.8,
  modelName: "gpt-4o-mini",
  provider: "openai",
};

const doc = MDocument.fromMarkdown(content);
const chunks = await doc.chunk({
  strategy: "markdown",
  config: markdownConfig,
});
```

## Since

v8.44.0
