[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / TelemetryAccumulator

# Type Alias: TelemetryAccumulator

> **TelemetryAccumulator** = `object`

Defined in: [types/proxy.ts:2598](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2598)

Mutable accumulator the SSE interceptor uses internally.

## Properties

### messageStopReceived

> **messageStopReceived**: `boolean`

Defined in: [types/proxy.ts:2599](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2599)

---

### firstUsefulOutputAt?

> `optional` **firstUsefulOutputAt?**: `number`

Defined in: [types/proxy.ts:2600](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2600)

---

### messageId

> **messageId**: `string`

Defined in: [types/proxy.ts:2601](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2601)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:2602](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2602)

---

### inputTokens

> **inputTokens**: `number`

Defined in: [types/proxy.ts:2603](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2603)

---

### outputTokens

> **outputTokens**: `number`

Defined in: [types/proxy.ts:2604](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2604)

---

### cacheCreationInputTokens

> **cacheCreationInputTokens**: `number`

Defined in: [types/proxy.ts:2605](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2605)

---

### cacheReadInputTokens

> **cacheReadInputTokens**: `number`

Defined in: [types/proxy.ts:2606](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2606)

---

### contentBlocks

> **contentBlocks**: [`SSEContentBlock`](SSEContentBlock.md)[]

Defined in: [types/proxy.ts:2607](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2607)

---

### blockByteCounts

> **blockByteCounts**: `Map`\<`number`, `number`\>

Defined in: [types/proxy.ts:2608](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2608)

---

### stopReason

> **stopReason**: `string` \| `null`

Defined in: [types/proxy.ts:2609](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2609)

---

### stopSequence

> **stopSequence**: `string` \| `null`

Defined in: [types/proxy.ts:2610](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2610)

---

### eventCount

> **eventCount**: `number`

Defined in: [types/proxy.ts:2611](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2611)

---

### startTime

> **startTime**: `number`

Defined in: [types/proxy.ts:2612](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2612)

---

### totalBytesReceived

> **totalBytesReceived**: `number`

Defined in: [types/proxy.ts:2613](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2613)

---

### events

> **events**: `object`[]

Defined in: [types/proxy.ts:2614](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2614)

#### type

> **type**: `string`

#### timestamp

> **timestamp**: `number`

#### data

> **data**: `string`

---

### rawTextChunks?

> `optional` **rawTextChunks?**: `string`[]

Defined in: [types/proxy.ts:2615](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2615)

---

### rawTextBytes

> **rawTextBytes**: `number`

Defined in: [types/proxy.ts:2616](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2616)

---

### rawTextTruncated

> **rawTextTruncated**: `boolean`

Defined in: [types/proxy.ts:2617](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2617)

---

### eventLogTruncated

> **eventLogTruncated**: `boolean`

Defined in: [types/proxy.ts:2618](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2618)

---

### streamErrorMessage?

> `optional` **streamErrorMessage?**: `string`

Defined in: [types/proxy.ts:2619](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2619)
