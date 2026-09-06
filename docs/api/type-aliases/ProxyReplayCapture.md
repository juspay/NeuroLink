[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyReplayCapture

# Type Alias: ProxyReplayCapture

> **ProxyReplayCapture** = `object`

Defined in: [types/proxy.ts:2397](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2397)

One verified body-capture record in a proxy replay bundle.

## Properties

### timestamp

> **timestamp**: `string`

Defined in: [types/proxy.ts:2398](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2398)

---

### phase

> **phase**: `string`

Defined in: [types/proxy.ts:2399](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2399)

---

### attempt

> **attempt**: `number` \| `null`

Defined in: [types/proxy.ts:2400](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2400)

---

### model

> **model**: `string` \| `null`

Defined in: [types/proxy.ts:2401](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2401)

---

### stream

> **stream**: `boolean` \| `null`

Defined in: [types/proxy.ts:2402](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2402)

---

### account

> **account**: `string` \| `null`

Defined in: [types/proxy.ts:2403](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2403)

---

### accountType

> **accountType**: `string` \| `null`

Defined in: [types/proxy.ts:2404](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2404)

---

### responseStatus

> **responseStatus**: `number` \| `null`

Defined in: [types/proxy.ts:2405](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2405)

---

### durationMs

> **durationMs**: `number` \| `null`

Defined in: [types/proxy.ts:2406](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2406)

---

### contentType

> **contentType**: `string` \| `null`

Defined in: [types/proxy.ts:2407](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2407)

---

### headers

> **headers**: `Record`\<`string`, `string`\>

Defined in: [types/proxy.ts:2408](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2408)

---

### body

> **body**: `string` \| `null`

Defined in: [types/proxy.ts:2409](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2409)

---

### bodySha256

> **bodySha256**: `string` \| `null`

Defined in: [types/proxy.ts:2410](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2410)

---

### bodyTruncated

> **bodyTruncated**: `boolean`

Defined in: [types/proxy.ts:2411](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2411)

---

### observedBodyBytes

> **observedBodyBytes**: `number` \| `null`

Defined in: [types/proxy.ts:2412](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2412)

---

### metadata

> **metadata**: [`ProxyReplayJsonRecord`](ProxyReplayJsonRecord.md) \| `null`

Defined in: [types/proxy.ts:2413](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2413)

---

### source

> **source**: `object`

Defined in: [types/proxy.ts:2414](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2414)

#### indexFile

> **indexFile**: `string`

#### indexLine

> **indexLine**: `number`

#### artifactPath

> **artifactPath**: `string` \| `null`

---

### issues

> **issues**: `string`[]

Defined in: [types/proxy.ts:2419](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2419)
