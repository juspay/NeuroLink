[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / SSETelemetry

# Type Alias: SSETelemetry

> **SSETelemetry** = `object`

Defined in: [types/proxy.ts:2501](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2501)

Aggregated telemetry resolved when an SSE stream completes.

## Properties

### messageStopReceived

> **messageStopReceived**: `boolean`

Defined in: [types/proxy.ts:2502](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2502)

---

### firstUsefulOutputAt?

> `optional` **firstUsefulOutputAt?**: `number`

Defined in: [types/proxy.ts:2503](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2503)

---

### messageId

> **messageId**: `string`

Defined in: [types/proxy.ts:2504](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2504)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:2505](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2505)

---

### usage

> **usage**: `object`

Defined in: [types/proxy.ts:2506](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2506)

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

Defined in: [types/proxy.ts:2513](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2513)

---

### stopReason

> **stopReason**: `string` \| `null`

Defined in: [types/proxy.ts:2514](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2514)

---

### stopSequence

> **stopSequence**: `string` \| `null`

Defined in: [types/proxy.ts:2515](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2515)

---

### eventCount

> **eventCount**: `number`

Defined in: [types/proxy.ts:2516](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2516)

---

### streamDurationMs

> **streamDurationMs**: `number`

Defined in: [types/proxy.ts:2517](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2517)

---

### totalBytesReceived

> **totalBytesReceived**: `number`

Defined in: [types/proxy.ts:2518](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2518)

---

### events

> **events**: `object`[]

Defined in: [types/proxy.ts:2519](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2519)

#### type

> **type**: `string`

#### timestamp

> **timestamp**: `number`

#### data

> **data**: `string`

---

### streamErrorMessage?

> `optional` **streamErrorMessage?**: `string`

Defined in: [types/proxy.ts:2521](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2521)

Error carried as a terminal SSE `event: error`, if one was observed.

---

### rawText?

> `optional` **rawText?**: `string`

Defined in: [types/proxy.ts:2522](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2522)
