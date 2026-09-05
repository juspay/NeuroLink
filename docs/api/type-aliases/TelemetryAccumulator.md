[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / TelemetryAccumulator

# Type Alias: TelemetryAccumulator

> **TelemetryAccumulator** = `object`

Defined in: [types/proxy.ts:2540](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2540)

Mutable accumulator the SSE interceptor uses internally.

## Properties

### messageStopReceived

> **messageStopReceived**: `boolean`

Defined in: [types/proxy.ts:2541](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2541)

---

### firstUsefulOutputAt?

> `optional` **firstUsefulOutputAt?**: `number`

Defined in: [types/proxy.ts:2542](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2542)

---

### messageId

> **messageId**: `string`

Defined in: [types/proxy.ts:2543](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2543)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:2544](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2544)

---

### inputTokens

> **inputTokens**: `number`

Defined in: [types/proxy.ts:2545](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2545)

---

### outputTokens

> **outputTokens**: `number`

Defined in: [types/proxy.ts:2546](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2546)

---

### cacheCreationInputTokens

> **cacheCreationInputTokens**: `number`

Defined in: [types/proxy.ts:2547](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2547)

---

### cacheReadInputTokens

> **cacheReadInputTokens**: `number`

Defined in: [types/proxy.ts:2548](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2548)

---

### contentBlocks

> **contentBlocks**: [`SSEContentBlock`](SSEContentBlock.md)[]

Defined in: [types/proxy.ts:2549](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2549)

---

### blockByteCounts

> **blockByteCounts**: `Map`\<`number`, `number`\>

Defined in: [types/proxy.ts:2550](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2550)

---

### stopReason

> **stopReason**: `string` \| `null`

Defined in: [types/proxy.ts:2551](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2551)

---

### stopSequence

> **stopSequence**: `string` \| `null`

Defined in: [types/proxy.ts:2552](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2552)

---

### eventCount

> **eventCount**: `number`

Defined in: [types/proxy.ts:2553](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2553)

---

### startTime

> **startTime**: `number`

Defined in: [types/proxy.ts:2554](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2554)

---

### totalBytesReceived

> **totalBytesReceived**: `number`

Defined in: [types/proxy.ts:2555](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2555)

---

### events

> **events**: `object`[]

Defined in: [types/proxy.ts:2556](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2556)

#### type

> **type**: `string`

#### timestamp

> **timestamp**: `number`

#### data

> **data**: `string`

---

### rawTextChunks?

> `optional` **rawTextChunks?**: `string`[]

Defined in: [types/proxy.ts:2557](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2557)

---

### rawTextBytes

> **rawTextBytes**: `number`

Defined in: [types/proxy.ts:2558](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2558)

---

### rawTextTruncated

> **rawTextTruncated**: `boolean`

Defined in: [types/proxy.ts:2559](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2559)

---

### eventLogTruncated

> **eventLogTruncated**: `boolean`

Defined in: [types/proxy.ts:2560](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2560)

---

### streamErrorMessage?

> `optional` **streamErrorMessage?**: `string`

Defined in: [types/proxy.ts:2561](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2561)
