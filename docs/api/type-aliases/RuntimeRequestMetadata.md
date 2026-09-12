[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RuntimeRequestMetadata

# Type Alias: RuntimeRequestMetadata

> **RuntimeRequestMetadata** = `object`

Defined in: [types/proxy.ts:2337](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2337)

Request metadata retained by the HTTP adapter for terminal error logging.

## Properties

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:2338](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2338)

---

### method

> **method**: `string`

Defined in: [types/proxy.ts:2339](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2339)

---

### path

> **path**: `string`

Defined in: [types/proxy.ts:2340](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2340)

---

### startedAt

> **startedAt**: `number`

Defined in: [types/proxy.ts:2341](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2341)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:2342](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2342)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:2343](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2343)

---

### toolCount

> **toolCount**: `number`

Defined in: [types/proxy.ts:2344](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2344)

---

### rejectForUpdate?

> `optional` **rejectForUpdate?**: `boolean`

Defined in: [types/proxy.ts:2346](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2346)

Admission decision captured before an updater drain can race the route.

---

### terminalErrorType?

> `optional` **terminalErrorType?**: `string`

Defined in: [types/proxy.ts:2347](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2347)

---

### terminalErrorCode?

> `optional` **terminalErrorCode?**: `string`

Defined in: [types/proxy.ts:2348](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2348)

---

### terminalResult?

> `optional` **terminalResult?**: [`RequestLogEntry`](RequestLogEntry.md)

Defined in: [types/proxy.ts:2350](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2350)

Canonical final record, populated synchronously before asynchronous I/O.

---

### shareRelease?

> `optional` **shareRelease?**: () => `void`

Defined in: [types/proxy.ts:2354](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2354)

Releases this request's peer-share concurrency slot. Set by the share
gate for borrowed traffic; invoked once the response body completes, so a
long stream holds its slot for as long as it is actually streaming.

#### Returns

`void`
