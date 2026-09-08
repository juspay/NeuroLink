[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / SageMakerUsage

# Type Alias: SageMakerUsage

> **SageMakerUsage** = `object`

Defined in: [types/providers.ts:1478](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1478)

Token usage and billing information

## Properties

### promptTokens

> **promptTokens**: `number`

Defined in: [types/providers.ts:1480](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1480)

Number of prompt tokens

---

### completionTokens

> **completionTokens**: `number`

Defined in: [types/providers.ts:1482](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1482)

Number of completion tokens

---

### total

> **total**: `number`

Defined in: [types/providers.ts:1484](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1484)

Total tokens used

---

### requestTime?

> `optional` **requestTime?**: `number`

Defined in: [types/providers.ts:1486](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1486)

Request processing time in milliseconds

---

### inferenceTime?

> `optional` **inferenceTime?**: `number`

Defined in: [types/providers.ts:1488](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1488)

Model inference time in milliseconds

---

### estimatedCost?

> `optional` **estimatedCost?**: `number`

Defined in: [types/providers.ts:1490](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1490)

Estimated cost in USD
