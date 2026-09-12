[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / SSETelemetry

# Type Alias: SSETelemetry

> **SSETelemetry** = `object`

Defined in: [types/proxy.ts:2565](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2565)

Aggregated telemetry resolved when an SSE stream completes.

## Properties

### messageStopReceived

> **messageStopReceived**: `boolean`

Defined in: [types/proxy.ts:2566](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2566)

---

### firstUsefulOutputAt?

> `optional` **firstUsefulOutputAt?**: `number`

Defined in: [types/proxy.ts:2567](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2567)

---

### messageId

> **messageId**: `string`

Defined in: [types/proxy.ts:2568](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2568)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:2569](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2569)

---

### usage

> **usage**: `object`

Defined in: [types/proxy.ts:2570](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2570)

#### inputTokens

> **inputTokens**: `number`

#### outputTokens

> **outputTokens**: `number`

#### cacheCreationInputTokens

> **cacheCreationInputTokens**: `number`

#### cacheReadInputTokens

> **cacheReadInputTokens**: `number`

#### totalTokens

> **totalTokens**: `number`

---

### contentBlocks

> **contentBlocks**: [`SSEContentBlock`](SSEContentBlock.md)[]

Defined in: [types/proxy.ts:2577](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2577)

---

### stopReason

> **stopReason**: `string` \| `null`

Defined in: [types/proxy.ts:2578](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2578)

---

### stopSequence

> **stopSequence**: `string` \| `null`

Defined in: [types/proxy.ts:2579](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2579)

---

### eventCount

> **eventCount**: `number`

Defined in: [types/proxy.ts:2580](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2580)

---

### streamDurationMs

> **streamDurationMs**: `number`

Defined in: [types/proxy.ts:2581](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2581)

---

### totalBytesReceived

> **totalBytesReceived**: `number`

Defined in: [types/proxy.ts:2582](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2582)

---

### events

> **events**: `object`[]

Defined in: [types/proxy.ts:2583](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2583)

#### type

> **type**: `string`

#### timestamp

> **timestamp**: `number`

#### data

> **data**: `string`

---

### streamErrorMessage?

> `optional` **streamErrorMessage?**: `string`

Defined in: [types/proxy.ts:2585](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2585)

Error carried as a terminal SSE `event: error`, if one was observed.

---

### rawText?

> `optional` **rawText?**: `string`

Defined in: [types/proxy.ts:2586](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2586)
