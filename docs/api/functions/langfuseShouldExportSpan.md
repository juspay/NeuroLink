[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / langfuseShouldExportSpan

# Function: langfuseShouldExportSpan()

> **langfuseShouldExportSpan**(`__namedParameters`): `boolean`

Defined in: [services/server/ai/observability/instrumentation.ts:779](https://github.com/juspay/neurolink/blob/release/src/lib/services/server/ai/observability/instrumentation.ts#L779)

Drop-in `shouldExportSpan` predicate for a `LangfuseSpanProcessor` that
filters out NeuroLink internal wrapper spans.

Usage in host apps:

```ts
import { langfuseShouldExportSpan } from "@juspay/neurolink";
new LangfuseSpanProcessor({ ..., shouldExportSpan: langfuseShouldExportSpan });
```

## Parameters

### \_\_namedParameters

#### otelSpan

\{ `attributes?`: `Record`\<`string`, `unknown`\>; \}

#### otelSpan.attributes?

`Record`\<`string`, `unknown`\>

## Returns

`boolean`
