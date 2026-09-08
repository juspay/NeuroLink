[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / GeminiGuardContent

# Type Alias: GeminiGuardContent

> **GeminiGuardContent** = `object`

Defined in: [types/context.ts:908](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L908)

Structural view of one Gemini history entry, loose enough to accept both the
native Vertex loop's `{ role, parts }` array and `@google/genai` contents
without a cast at either call site.

## Properties

### role

> **role**: `string`

Defined in: [types/context.ts:909](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L909)

---

### parts

> **parts**: `unknown`[]

Defined in: [types/context.ts:910](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L910)
