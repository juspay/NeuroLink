[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / getAvailableStrategies

# Function: getAvailableStrategies()

> **getAvailableStrategies**(): `Promise<ChunkingStrategy[]>`

Defined in: [lib/rag/ChunkerFactory.ts:380](https://github.com/juspay/neurolink/blob/main/src/lib/rag/ChunkerFactory.ts#L380)

Get all available chunking strategies

Returns a list of all registered chunking strategy names (not including aliases).
This is useful for dynamically discovering available strategies or validating
user input.

## Returns

`Promise<ChunkingStrategy[]>`

Array of available chunking strategy names:

- `character` - Fixed-size character chunks
- `recursive` - Recursive text splitting with ordered separators
- `sentence` - Sentence-boundary aware splitting
- `token` - Token-count based splitting
- `markdown` - Markdown structure-aware splitting
- `html` - HTML tag-aware splitting
- `json` - JSON structure-aware splitting
- `latex` - LaTeX environment-aware splitting
- `semantic` - LLM-powered semantic splitting
- `semantic-markdown` - Combines markdown splitting with semantic similarity

## Examples

### List all strategies

```typescript
import { getAvailableStrategies } from "@juspay/neurolink";

const strategies = await getAvailableStrategies();
console.log("Available strategies:", strategies);
// Output: ["character", "recursive", "sentence", "token", "markdown", "html", "json", "latex", "semantic", "semantic-markdown"]
```

### Validate user-selected strategy

```typescript
import { getAvailableStrategies, createChunker } from "@juspay/neurolink";

async function processWithStrategy(text: string, userStrategy: string) {
  const strategies = await getAvailableStrategies();

  if (!strategies.includes(userStrategy as ChunkingStrategy)) {
    throw new Error(`Invalid strategy. Choose from: ${strategies.join(", ")}`);
  }

  const chunker = await createChunker(userStrategy);
  return chunker.chunk(text);
}
```

### Build a strategy selector UI

```typescript
import { getAvailableStrategies, getChunkerMetadata } from "@juspay/neurolink";

async function buildStrategyOptions() {
  const strategies = await getAvailableStrategies();

  return strategies.map((strategy) => {
    const metadata = getChunkerMetadata(strategy);
    return {
      value: strategy,
      label: strategy,
      description: metadata?.description,
      useCases: metadata?.useCases,
    };
  });
}
```

## Since

v8.44.0

## See Also

- [createChunker](./createChunker.md) - Create a chunker instance
- [chunkText](./chunkText.md) - Convenience function for chunking
- [ChunkingStrategy](../type-aliases/ChunkingStrategy.md) - Strategy type definition
