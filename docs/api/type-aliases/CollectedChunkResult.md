[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / CollectedChunkResult

# Type Alias: CollectedChunkResult

> **CollectedChunkResult** = `object`

Defined in: [types/providers.ts:2072](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2072)

## Properties

### rawResponseParts

> **rawResponseParts**: `unknown`[]

Defined in: [types/providers.ts:2073](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2073)

---

### stepFunctionCalls

> **stepFunctionCalls**: [`NativeFunctionCall`](NativeFunctionCall.md)[]

Defined in: [types/providers.ts:2074](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2074)

---

### finishReason?

> `optional` **finishReason?**: `string`

Defined in: [types/providers.ts:2076](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2076)

Raw `Candidate.finishReason` from the last chunk that carried one.

---

### inputTokens

> **inputTokens**: `number`

Defined in: [types/providers.ts:2077](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2077)

---

### outputTokens

> **outputTokens**: `number`

Defined in: [types/providers.ts:2078](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2078)

---

### cacheReadTokens?

> `optional` **cacheReadTokens?**: `number`

Defined in: [types/providers.ts:2084](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2084)

Gemini cached-content tokens (overlapping: included in promptTokenCount).
Surfaced so the call site can subtract from input and bill at cacheRead
rate. Subtraction happens at the call site, not in the collector.

---

### cacheCreationTokens?

> `optional` **cacheCreationTokens?**: `number`

Defined in: [types/providers.ts:2086](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2086)

Cache creation tokens (symmetry; Gemini does not emit this).

---

### reasoningTokens?

> `optional` **reasoningTokens?**: `number`

Defined in: [types/providers.ts:2092](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2092)

Gemini thinking tokens (usageMetadata.thoughtsTokenCount). Billed at the
output rate but NOT included in candidatesTokenCount — Gemini reports
totalTokenCount = prompt + candidates + thoughts.
