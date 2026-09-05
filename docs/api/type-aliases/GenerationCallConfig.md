[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / GenerationCallConfig

# Type Alias: GenerationCallConfig

> **GenerationCallConfig** = `object`

Defined in: [types/generate.ts:1769](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1769)

Per-call configuration for GenerationHandler's AI-SDK loop invocation,
shared by the initial call and every fallback retry so they cannot drift.

## Properties

### shouldUseTools

> **shouldUseTools**: `boolean`

Defined in: [types/generate.ts:1770](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1770)

---

### includeStructuredOutput

> **includeStructuredOutput**: `boolean`

Defined in: [types/generate.ts:1771](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1771)

---

### turnStartMs

> **turnStartMs**: `number`

Defined in: [types/generate.ts:1775](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1775)

Anchor for the turn deadline — the ORIGINAL executeGeneration start,
shared across fallback/provider retries so they can't refresh the
wall-clock budget.

---

### promptJsonInstruction?

> `optional` **promptJsonInstruction?**: `boolean`

Defined in: [types/generate.ts:1778](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1778)

Structured-output fallback retry: also spell the JSON Schema out in the
system prompt, for vendors that ignore `response_format`.

---

### isToolReask?

> `optional` **isToolReask?**: `boolean`

Defined in: [types/generate.ts:1780](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1780)

Set on the single toolChoice:"none" re-ask so it can never recurse.
