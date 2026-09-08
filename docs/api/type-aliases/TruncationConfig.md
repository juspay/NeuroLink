[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / TruncationConfig

# Type Alias: TruncationConfig

> **TruncationConfig** = `object`

Defined in: [types/context.ts:980](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L980)

Configuration for sliding window truncation (Stage 4).

## Properties

### fraction?

> `optional` **fraction?**: `number`

Defined in: [types/context.ts:981](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L981)

---

### currentTokens?

> `optional` **currentTokens?**: `number`

Defined in: [types/context.ts:983](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L983)

Current estimated tokens (enables adaptive mode)

---

### targetTokens?

> `optional` **targetTokens?**: `number`

Defined in: [types/context.ts:985](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L985)

Target token budget (enables adaptive mode)

---

### provider?

> `optional` **provider?**: `string`

Defined in: [types/context.ts:987](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L987)

Provider for token estimation (enables adaptive mode)

---

### adaptiveBuffer?

> `optional` **adaptiveBuffer?**: `number`

Defined in: [types/context.ts:989](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L989)

Buffer above required reduction (default: 0.15 = 15%)

---

### maxIterations?

> `optional` **maxIterations?**: `number`

Defined in: [types/context.ts:991](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L991)

Maximum iterations for adaptive truncation (default: 3)
