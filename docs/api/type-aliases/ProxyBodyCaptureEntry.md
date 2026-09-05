[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyBodyCaptureEntry

# Type Alias: ProxyBodyCaptureEntry

> **ProxyBodyCaptureEntry** = `object`

Defined in: [types/proxy.ts:2315](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2315)

Single captured body/headers entry written to disk by the proxy logger.

## Properties

### timestamp

> **timestamp**: `string`

Defined in: [types/proxy.ts:2316](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2316)

---

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:2317](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2317)

---

### phase

> **phase**: `string`

Defined in: [types/proxy.ts:2318](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2318)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:2319](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2319)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:2320](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2320)

---

### headers?

> `optional` **headers?**: `Record`\<`string`, `string`\>

Defined in: [types/proxy.ts:2321](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2321)

---

### body?

> `optional` **body?**: `unknown`

Defined in: [types/proxy.ts:2322](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2322)

---

### bodySize?

> `optional` **bodySize?**: `number`

Defined in: [types/proxy.ts:2323](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2323)

---

### contentType?

> `optional` **contentType?**: `string`

Defined in: [types/proxy.ts:2324](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2324)

---

### responseStatus?

> `optional` **responseStatus?**: `number`

Defined in: [types/proxy.ts:2325](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2325)

---

### durationMs?

> `optional` **durationMs?**: `number`

Defined in: [types/proxy.ts:2326](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2326)

---

### account?

> `optional` **account?**: `string`

Defined in: [types/proxy.ts:2327](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2327)

---

### accountType?

> `optional` **accountType?**: `string`

Defined in: [types/proxy.ts:2328](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2328)

---

### attempt?

> `optional` **attempt?**: `number`

Defined in: [types/proxy.ts:2329](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2329)

---

### traceId?

> `optional` **traceId?**: `string`

Defined in: [types/proxy.ts:2330](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2330)

---

### spanId?

> `optional` **spanId?**: `string`

Defined in: [types/proxy.ts:2331](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2331)

---

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [types/proxy.ts:2332](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2332)
