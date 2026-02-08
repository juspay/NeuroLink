[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / getAvailableRerankerTypes

# Function: getAvailableRerankerTypes()

> **getAvailableRerankerTypes**(): `Promise<RerankerType[]>`

Defined in: [lib/rag/reranker/RerankerFactory.ts:546](https://github.com/juspay/neurolink/blob/main/src/lib/rag/reranker/RerankerFactory.ts#L546)

Get all available reranker types registered in the factory.

Returns the canonical type names (not aliases). Use this to discover
available reranking options or build dynamic configuration interfaces.

## Returns

`Promise<RerankerType[]>`

Promise resolving to array of available reranker type names

## RerankerType Values

| Type              | Description                        | Requires Model | Requires External API |
| ----------------- | ---------------------------------- | -------------- | --------------------- |
| `"llm"`           | LLM-powered semantic reranking     | Yes            | No                    |
| `"cross-encoder"` | Cross-encoder relevance scoring    | Yes            | No                    |
| `"cohere"`        | Cohere Rerank API                  | No             | Yes                   |
| `"simple"`        | Position and score-based reranking | No             | No                    |
| `"batch"`         | Batch LLM reranking                | Yes            | No                    |

## Examples

### List available rerankers

```typescript
import { getAvailableRerankerTypes } from "@juspay/neurolink";

const types = await getAvailableRerankerTypes();
console.log("Available rerankers:", types);
// ["llm", "cross-encoder", "cohere", "simple", "batch"]
```

### Build selection UI

```typescript
import {
  getAvailableRerankerTypes,
  getRerankerMetadata,
} from "@juspay/neurolink";

async function buildRerankerOptions() {
  const types = await getAvailableRerankerTypes();

  return types.map((type) => {
    const metadata = getRerankerMetadata(type);
    return {
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      description: metadata?.description || "",
      requiresModel: metadata?.requiresModel || false,
      requiresExternalAPI: metadata?.requiresExternalAPI || false,
    };
  });
}
```

### Filter by requirements

```typescript
import {
  getAvailableRerankerTypes,
  getRerankerMetadata,
} from "@juspay/neurolink";

async function getLocalRerankers() {
  const types = await getAvailableRerankerTypes();

  return types.filter((type) => {
    const metadata = getRerankerMetadata(type);
    return !metadata?.requiresExternalAPI;
  });
}

async function getModelFreeRerankers() {
  const types = await getAvailableRerankerTypes();

  return types.filter((type) => {
    const metadata = getRerankerMetadata(type);
    return !metadata?.requiresModel;
  });
}

// Get rerankers that work without any external dependencies
const localTypes = await getLocalRerankers();
// ["llm", "cross-encoder", "simple", "batch"]

const modelFreeTypes = await getModelFreeRerankers();
// ["cohere", "simple"]
```

### Dynamic reranker selection

```typescript
import {
  getAvailableRerankerTypes,
  getRerankerMetadata,
  createReranker,
} from "@juspay/neurolink";

async function selectReranker(options: {
  preferFast?: boolean;
  allowExternalAPI?: boolean;
  hasModel?: boolean;
}) {
  const types = await getAvailableRerankerTypes();

  // Filter based on requirements
  const candidates = types.filter((type) => {
    const metadata = getRerankerMetadata(type);
    if (!metadata) return false;

    if (!options.allowExternalAPI && metadata.requiresExternalAPI) {
      return false;
    }

    if (!options.hasModel && metadata.requiresModel) {
      return false;
    }

    return true;
  });

  // Select based on preference
  if (options.preferFast && candidates.includes("simple")) {
    return createReranker("simple");
  }

  if (candidates.includes("llm")) {
    return createReranker("llm");
  }

  return createReranker(candidates[0] || "simple");
}
```

### Validate reranker type

```typescript
import { getAvailableRerankerTypes } from "@juspay/neurolink";

async function isValidRerankerType(type: string): Promise<boolean> {
  const types = await getAvailableRerankerTypes();
  return types.includes(type as any);
}

// Validate user input
const userType = "llm";
if (await isValidRerankerType(userType)) {
  const reranker = await createReranker(userType);
}
```

## Notes

- The function is async because the factory initializes lazily
- Only canonical type names are returned, not aliases
- Use `getRerankerMetadata()` to get detailed information about each type
- The factory ensures all built-in rerankers are registered before returning

## Since

v8.44.0

## See Also

- [createReranker](./createReranker.md) - Create a reranker instance
- [getRerankerMetadata](./getRerankerMetadata.md) - Get metadata for a reranker type
- [getRerankerDefaultConfig](./getRerankerDefaultConfig.md) - Get default configuration
