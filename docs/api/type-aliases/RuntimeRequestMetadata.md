[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RuntimeRequestMetadata

# Type Alias: RuntimeRequestMetadata

> **RuntimeRequestMetadata** = `object`

Defined in: [types/proxy.ts:2273](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2273)

Request metadata retained by the HTTP adapter for terminal error logging.

## Properties

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:2274](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2274)

---

### method

> **method**: `string`

Defined in: [types/proxy.ts:2275](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2275)

---

### path

> **path**: `string`

Defined in: [types/proxy.ts:2276](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2276)

---

### startedAt

> **startedAt**: `number`

Defined in: [types/proxy.ts:2277](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2277)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:2278](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2278)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:2279](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2279)

---

### toolCount

> **toolCount**: `number`

Defined in: [types/proxy.ts:2280](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2280)

---

### rejectForUpdate?

> `optional` **rejectForUpdate?**: `boolean`

Defined in: [types/proxy.ts:2282](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2282)

Admission decision captured before an updater drain can race the route.

---

### terminalErrorType?

> `optional` **terminalErrorType?**: `string`

Defined in: [types/proxy.ts:2283](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2283)

---

### terminalErrorCode?

> `optional` **terminalErrorCode?**: `string`

Defined in: [types/proxy.ts:2284](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2284)

---

### terminalResult?

> `optional` **terminalResult?**: [`RequestLogEntry`](RequestLogEntry.md)

Defined in: [types/proxy.ts:2286](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2286)

Canonical final record, populated synchronously before asynchronous I/O.

---

### shareRelease?

> `optional` **shareRelease?**: () => `void`

Defined in: [types/proxy.ts:2290](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2290)

Releases this request's peer-share concurrency slot. Set by the share
gate for borrowed traffic; invoked once the response body completes, so a
long stream holds its slot for as long as it is actually streaming.

#### Returns

`void`
