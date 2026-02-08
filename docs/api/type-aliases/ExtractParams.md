[**NeuroLink API Reference v8.44.0**](../README.md)

---

[NeuroLink API Reference](../README.md) / ExtractParams

# Type Alias: ExtractParams

> **ExtractParams** = `object`

Defined in: [lib/rag/types.ts:387](https://github.com/juspay/neurolink/blob/main/src/lib/rag/types.ts#L387)

Combined extraction parameters for LLM-based metadata extraction from document chunks. Enables extraction of titles, summaries, keywords, Q&A pairs, and custom schemas.

## Since

v8.44.0

## Properties

### title?

> `optional` **title**: `boolean` | [`TitleExtractorConfig`](TitleExtractorConfig.md)

Extract document title. Set to `true` for defaults or provide configuration object.

---

### summary?

> `optional` **summary**: `boolean` | [`SummaryExtractorConfig`](SummaryExtractorConfig.md)

Extract document summary. Set to `true` for defaults or provide configuration object.

---

### keywords?

> `optional` **keywords**: `boolean` | [`KeywordExtractorConfig`](KeywordExtractorConfig.md)

Extract keywords from content. Set to `true` for defaults or provide configuration object.

---

### questions?

> `optional` **questions**: `boolean` | [`QuestionExtractorConfig`](QuestionExtractorConfig.md)

Generate Q&A pairs from content. Set to `true` for defaults or provide configuration object.

---

### custom?

> `optional` **custom**: [`CustomSchemaExtractorConfig`](CustomSchemaExtractorConfig.md)

Custom schema extraction using Zod schemas for structured data extraction.

## Example

```typescript
import { MDocument } from "@juspay/neurolink";

const doc = MDocument.fromMarkdown(content);
await doc.chunk({ strategy: "markdown" });

// Simple boolean flags for default extraction
await doc.extractMetadata({
  title: true,
  summary: true,
  keywords: true,
});

// Advanced configuration with options
await doc.extractMetadata({
  title: {
    nodes: 3,
    modelName: "gpt-4o-mini",
  },
  summary: {
    summaryTypes: ["current", "next"],
    maxWords: 100,
  },
  keywords: {
    maxKeywords: 10,
    minRelevance: 0.7,
  },
  questions: {
    numQuestions: 5,
    includeAnswers: true,
  },
});

// Custom schema extraction
import { z } from "zod";

await doc.extractMetadata({
  custom: {
    schema: z.object({
      entities: z.array(z.string()),
      sentiment: z.enum(["positive", "negative", "neutral"]),
    }),
    description: "Extract named entities and sentiment",
  },
});
```
