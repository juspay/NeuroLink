[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / createContextWindow

# Function: createContextWindow()

> **createContextWindow**(`results`, `options?`): `ContextWindow`

Defined in: [lib/rag/pipeline/contextAssembly.ts:246](https://github.com/juspay/neurolink/blob/main/src/lib/rag/pipeline/contextAssembly.ts#L246)

Create a context window with detailed tracking of assembled content.

Unlike `assembleContext`, this function returns a structured object containing
the assembled text along with metadata about included chunks, token counts,
truncation information, and a citation map.

## Parameters

### results

`Array<Chunk | VectorQueryResult>`

Array of retrieved chunks or vector query results

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

Citation style for the citation map

#### options.separator?

`string`

Separator between chunks

## Returns

`ContextWindow`

Context window object with assembled text and metadata

### ContextWindow Properties

| Property          | Type                  | Description                            |
| ----------------- | --------------------- | -------------------------------------- |
| `text`            | `string`              | Assembled context text                 |
| `chunkCount`      | `number`              | Number of chunks included              |
| `charCount`       | `number`              | Total character count                  |
| `tokenCount`      | `number`              | Estimated token count                  |
| `truncatedChunks` | `number`              | Number of chunks truncated or excluded |
| `citations`       | `Map<string, string>` | Map of chunk IDs to citation strings   |

## Examples

### Basic usage

```typescript
import { createContextWindow } from "@juspay/neurolink";

const results = await vectorStore.query({
  query: "machine learning",
  topK: 10,
});

const window = createContextWindow(results, {
  maxTokens: 4000,
});

console.log(`Included ${window.chunkCount} chunks`);
console.log(`Token count: ${window.tokenCount}`);
console.log(`Truncated: ${window.truncatedChunks} chunks`);
```

### Track context utilization

```typescript
import { createContextWindow } from "@juspay/neurolink";

const window = createContextWindow(results, { maxTokens: 8000 });

const utilization = (window.tokenCount / 8000) * 100;
console.log(`Context utilization: ${utilization.toFixed(1)}%`);

if (window.truncatedChunks > 0) {
  console.warn(`Warning: ${window.truncatedChunks} chunks were truncated`);
}
```

### Use citations in response

```typescript
import { createContextWindow } from "@juspay/neurolink";

const window = createContextWindow(results, { maxTokens: 4000 });

const response = await llm.generate({
  prompt: `Context:\n${window.text}\n\nQuestion: ${question}`,
});

// Include citations in the response
const citationList = [...window.citations.values()].join("\n");
const fullResponse = `${response.content}\n\nSources:\n${citationList}`;
```

### Adaptive context sizing

```typescript
import { createContextWindow } from "@juspay/neurolink";

function createAdaptiveContext(
  results: VectorQueryResult[],
  modelContext: number,
) {
  // Reserve tokens for system prompt and response
  const availableTokens = modelContext - 2000;

  const window = createContextWindow(results, {
    maxTokens: availableTokens,
  });

  return {
    context: window.text,
    metadata: {
      chunksUsed: window.chunkCount,
      chunksExcluded: window.truncatedChunks,
      tokensUsed: window.tokenCount,
      tokensAvailable: availableTokens,
    },
  };
}
```

### With logging and monitoring

```typescript
import { createContextWindow } from "@juspay/neurolink";

async function buildContext(query: string) {
  const results = await search(query);
  const window = createContextWindow(results, { maxTokens: 4000 });

  // Log context metrics
  logger.info("Context assembled", {
    query,
    chunkCount: window.chunkCount,
    charCount: window.charCount,
    tokenCount: window.tokenCount,
    truncatedChunks: window.truncatedChunks,
    sourceCount: window.citations.size,
  });

  return window;
}
```

## Notes

- Token count is estimated at 4 characters per token
- Partial chunk inclusion is attempted when space allows (>100 chars remaining)
- Citations are automatically generated from chunk metadata or IDs
- Truncated chunks are marked with "(truncated)" in their citation

## Since

v8.44.0

## See Also

- [assembleContext](./assembleContext.md) - Simple context assembly returning string only
- [formatContextWithCitations](./formatContextWithCitations.md) - Format with separate citation list
- [summarizeContext](./summarizeContext.md) - Summarize context using LLM
