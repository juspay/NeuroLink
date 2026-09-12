[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / TelemetryAccumulator

# Type Alias: TelemetryAccumulator

> **TelemetryAccumulator** = `object`

Defined in: [types/proxy.ts:2604](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2604)

Mutable accumulator the SSE interceptor uses internally.

## Properties

### messageStopReceived

> **messageStopReceived**: `boolean`

Defined in: [types/proxy.ts:2605](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2605)

---

### firstUsefulOutputAt?

> `optional` **firstUsefulOutputAt?**: `number`

Defined in: [types/proxy.ts:2606](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2606)

---

### messageId

> **messageId**: `string`

Defined in: [types/proxy.ts:2607](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2607)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:2608](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2608)

---

### inputTokens

> **inputTokens**: `number`

Defined in: [types/proxy.ts:2609](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2609)

---

### outputTokens

> **outputTokens**: `number`

Defined in: [types/proxy.ts:2610](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2610)

---

### cacheCreationInputTokens

> **cacheCreationInputTokens**: `number`

Defined in: [types/proxy.ts:2611](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2611)

---

### cacheReadInputTokens

> **cacheReadInputTokens**: `number`

Defined in: [types/proxy.ts:2612](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2612)

---

### contentBlocks

> **contentBlocks**: [`SSEContentBlock`](SSEContentBlock.md)[]

Defined in: [types/proxy.ts:2613](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2613)

---

### blockByteCounts

> **blockByteCounts**: `Map`\<`number`, `number`\>

Defined in: [types/proxy.ts:2614](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2614)

---

### stopReason

> **stopReason**: `string` \| `null`

Defined in: [types/proxy.ts:2615](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2615)

---

### stopSequence

> **stopSequence**: `string` \| `null`

Defined in: [types/proxy.ts:2616](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2616)

---

### eventCount

> **eventCount**: `number`

Defined in: [types/proxy.ts:2617](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2617)

---

### startTime

> **startTime**: `number`

Defined in: [types/proxy.ts:2618](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2618)

---

### totalBytesReceived

> **totalBytesReceived**: `number`

Defined in: [types/proxy.ts:2619](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2619)

---

### events

> **events**: `object`[]

Defined in: [types/proxy.ts:2620](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2620)

#### type

> **type**: `string`

#### timestamp

> **timestamp**: `number`

#### data

> **data**: `string`

---

### rawTextChunks?

> `optional` **rawTextChunks?**: `string`[]

Defined in: [types/proxy.ts:2621](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2621)

---

### rawTextBytes

> **rawTextBytes**: `number`

Defined in: [types/proxy.ts:2622](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2622)

---

### rawTextTruncated

> **rawTextTruncated**: `boolean`

Defined in: [types/proxy.ts:2623](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2623)

---

### eventLogTruncated

> **eventLogTruncated**: `boolean`

Defined in: [types/proxy.ts:2624](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2624)

---

### streamErrorMessage?

> `optional` **streamErrorMessage?**: `string`

Defined in: [types/proxy.ts:2625](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2625)
