[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyReplayCapture

# Type Alias: ProxyReplayCapture

> **ProxyReplayCapture** = `object`

Defined in: [types/proxy.ts:2403](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2403)

One verified body-capture record in a proxy replay bundle.

## Properties

### timestamp

> **timestamp**: `string`

Defined in: [types/proxy.ts:2404](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2404)

---

### phase

> **phase**: `string`

Defined in: [types/proxy.ts:2405](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2405)

---

### attempt

> **attempt**: `number` \| `null`

Defined in: [types/proxy.ts:2406](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2406)

---

### model

> **model**: `string` \| `null`

Defined in: [types/proxy.ts:2407](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2407)

---

### stream

> **stream**: `boolean` \| `null`

Defined in: [types/proxy.ts:2408](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2408)

---

### account

> **account**: `string` \| `null`

Defined in: [types/proxy.ts:2409](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2409)

---

### accountType

> **accountType**: `string` \| `null`

Defined in: [types/proxy.ts:2410](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2410)

---

### responseStatus

> **responseStatus**: `number` \| `null`

Defined in: [types/proxy.ts:2411](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2411)

---

### durationMs

> **durationMs**: `number` \| `null`

Defined in: [types/proxy.ts:2412](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2412)

---

### contentType

> **contentType**: `string` \| `null`

Defined in: [types/proxy.ts:2413](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2413)

---

### headers

> **headers**: `Record`\<`string`, `string`\>

Defined in: [types/proxy.ts:2414](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2414)

---

### body

> **body**: `string` \| `null`

Defined in: [types/proxy.ts:2415](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2415)

---

### bodySha256

> **bodySha256**: `string` \| `null`

Defined in: [types/proxy.ts:2416](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2416)

---

### bodyTruncated

> **bodyTruncated**: `boolean`

Defined in: [types/proxy.ts:2417](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2417)

---

### observedBodyBytes

> **observedBodyBytes**: `number` \| `null`

Defined in: [types/proxy.ts:2418](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2418)

---

### metadata

> **metadata**: [`ProxyReplayJsonRecord`](ProxyReplayJsonRecord.md) \| `null`

Defined in: [types/proxy.ts:2419](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2419)

---

### source

> **source**: `object`

Defined in: [types/proxy.ts:2420](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2420)

#### indexFile

> **indexFile**: `string`

#### indexLine

> **indexLine**: `number`

#### artifactPath

> **artifactPath**: `string` \| `null`

---

### issues

> **issues**: `string`[]

Defined in: [types/proxy.ts:2425](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2425)
