[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyReplayCapture

# Type Alias: ProxyReplayCapture

> **ProxyReplayCapture** = `object`

Defined in: [types/proxy.ts:2339](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2339)

One verified body-capture record in a proxy replay bundle.

## Properties

### timestamp

> **timestamp**: `string`

Defined in: [types/proxy.ts:2340](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2340)

---

### phase

> **phase**: `string`

Defined in: [types/proxy.ts:2341](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2341)

---

### attempt

> **attempt**: `number` \| `null`

Defined in: [types/proxy.ts:2342](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2342)

---

### model

> **model**: `string` \| `null`

Defined in: [types/proxy.ts:2343](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2343)

---

### stream

> **stream**: `boolean` \| `null`

Defined in: [types/proxy.ts:2344](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2344)

---

### account

> **account**: `string` \| `null`

Defined in: [types/proxy.ts:2345](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2345)

---

### accountType

> **accountType**: `string` \| `null`

Defined in: [types/proxy.ts:2346](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2346)

---

### responseStatus

> **responseStatus**: `number` \| `null`

Defined in: [types/proxy.ts:2347](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2347)

---

### durationMs

> **durationMs**: `number` \| `null`

Defined in: [types/proxy.ts:2348](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2348)

---

### contentType

> **contentType**: `string` \| `null`

Defined in: [types/proxy.ts:2349](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2349)

---

### headers

> **headers**: `Record`\<`string`, `string`\>

Defined in: [types/proxy.ts:2350](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2350)

---

### body

> **body**: `string` \| `null`

Defined in: [types/proxy.ts:2351](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2351)

---

### bodySha256

> **bodySha256**: `string` \| `null`

Defined in: [types/proxy.ts:2352](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2352)

---

### bodyTruncated

> **bodyTruncated**: `boolean`

Defined in: [types/proxy.ts:2353](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2353)

---

### observedBodyBytes

> **observedBodyBytes**: `number` \| `null`

Defined in: [types/proxy.ts:2354](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2354)

---

### metadata

> **metadata**: [`ProxyReplayJsonRecord`](ProxyReplayJsonRecord.md) \| `null`

Defined in: [types/proxy.ts:2355](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2355)

---

### source

> **source**: `object`

Defined in: [types/proxy.ts:2356](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2356)

#### indexFile

> **indexFile**: `string`

#### indexLine

> **indexLine**: `number`

#### artifactPath

> **artifactPath**: `string` \| `null`

---

### issues

> **issues**: `string`[]

Defined in: [types/proxy.ts:2361](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2361)
