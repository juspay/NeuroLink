[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / assembleContext

# Function: assembleContext()

> **assembleContext**(`results`, `options?`): `string`

Defined in: [lib/rag/pipeline/contextAssembly.ts:86](https://github.com/juspay/neurolink/blob/main/src/lib/rag/pipeline/contextAssembly.ts#L86)

Assemble context from retrieved chunks or query results into a coherent string
suitable for LLM consumption.

Combines multiple chunks with token-aware truncation, optional deduplication,
relevance-based ordering, and configurable citation formatting.

## Parameters

### results

`Array<Chunk | VectorQueryResult>`

Array of retrieved chunks or vector query results to assemble

### options?

`ContextAssemblyOptions`

Assembly configuration options

#### options.maxChars?

`number`

Maximum characters in assembled context

#### options.maxTokens?

`number`

Maximum tokens (approximate, 4 chars/token). Default: `4000`

#### options.citationFormat?

`CitationFormat`

Citation style: `"inline"`, `"footnote"`, `"numbered"`, or `"none"`. Default: `"none"`

#### options.separator?

`string`

Separator between chunks. Default: `"\n\n---\n\n"`

#### options.includeMetadata?

`boolean`

Include chunk metadata in context. Default: `false`

#### options.deduplicate?

`boolean`

Remove overlapping content. Default: `false`

#### options.dedupeThreshold?

`number`

Similarity threshold for deduplication (0-1). Default: `0.8`

#### options.orderByRelevance?

`boolean`

Sort chunks by relevance score. Default: `true`

#### options.includeSectionHeaders?

`boolean`

Add section headers to chunks. Default: `false`

#### options.headerTemplate?

`string`

Header template with `{index}`, `{source}`, `{score}` placeholders. Default: `"[{index}] Source: {source}"`

## Returns

`string`

Assembled context string ready for LLM prompt insertion

## Examples

### Basic context assembly

```typescript
import { assembleContext } from "@juspay/neurolink";

const results = await vectorStore.query({ query: "climate change", topK: 5 });

const context = assembleContext(results);

const prompt = `Based on the following context, answer the question.

Context:
${context}

Question: What are the main causes of climate change?`;
```

### With token limit and citations

```typescript
import { assembleContext } from "@juspay/neurolink";

const context = assembleContext(results, {
  maxTokens: 4000,
  citationFormat: "numbered",
  includeSectionHeaders: true,
});

// Output includes [1], [2], etc. for each chunk
```

### Deduplicated context

```typescript
import { assembleContext } from "@juspay/neurolink";

// When chunks may have overlapping content
const context = assembleContext(results, {
  deduplicate: true,
  dedupeThreshold: 0.7, // Remove chunks with >70% word overlap
  orderByRelevance: true,
});
```

### Custom formatting

```typescript
import { assembleContext } from "@juspay/neurolink";

const context = assembleContext(results, {
  maxTokens: 8000,
  separator: "\n\n",
  includeMetadata: true,
  includeSectionHeaders: true,
  headerTemplate: "### [{index}] {source} (relevance: {score})",
});
```

### For RAG pipeline

```typescript
import { assembleContext, createVectorQueryTool } from "@juspay/neurolink";

async function ragQuery(question: string) {
  const queryTool = createVectorQueryTool(vectorStore, embeddingModel);
  const results = await queryTool.query(question, { topK: 10 });

  const context = assembleContext(results, {
    maxTokens: 4000,
    deduplicate: true,
    citationFormat: "numbered",
  });

  const response = await llm.generate({
    prompt: `Context:\n${context}\n\nQuestion: ${question}`,
  });

  return response;
}
```

## Notes

- Token count is approximated at 4 characters per token
- Chunks exceeding the token limit are partially included when possible
- Deduplication uses Jaccard similarity on word sets
- Empty results return an empty string
- Relevance ordering uses the `score` field from results

## Since

v8.44.0

## See Also

- [createContextWindow](./createContextWindow.md) - Create context window with detailed tracking
- [formatContextWithCitations](./formatContextWithCitations.md) - Format context with citation list
- [summarizeContext](./summarizeContext.md) - Summarize context using LLM
