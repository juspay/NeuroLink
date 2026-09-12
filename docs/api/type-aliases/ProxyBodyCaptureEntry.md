[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyBodyCaptureEntry

# Type Alias: ProxyBodyCaptureEntry

> **ProxyBodyCaptureEntry** = `object`

Defined in: [types/proxy.ts:2379](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2379)

Single captured body/headers entry written to disk by the proxy logger.

## Properties

### timestamp

> **timestamp**: `string`

Defined in: [types/proxy.ts:2380](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2380)

---

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:2381](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2381)

---

### phase

> **phase**: `string`

Defined in: [types/proxy.ts:2382](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2382)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:2383](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2383)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:2384](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2384)

---

### headers?

> `optional` **headers?**: `Record`\<`string`, `string`\>

Defined in: [types/proxy.ts:2385](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2385)

---

### body?

> `optional` **body?**: `unknown`

Defined in: [types/proxy.ts:2386](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2386)

---

### bodySize?

> `optional` **bodySize?**: `number`

Defined in: [types/proxy.ts:2387](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2387)

---

### contentType?

> `optional` **contentType?**: `string`

Defined in: [types/proxy.ts:2388](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2388)

---

### responseStatus?

> `optional` **responseStatus?**: `number`

Defined in: [types/proxy.ts:2389](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2389)

---

### durationMs?

> `optional` **durationMs?**: `number`

Defined in: [types/proxy.ts:2390](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2390)

---

### account?

> `optional` **account?**: `string`

Defined in: [types/proxy.ts:2391](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2391)

---

### accountType?

> `optional` **accountType?**: `string`

Defined in: [types/proxy.ts:2392](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2392)

---

### attempt?

> `optional` **attempt?**: `number`

Defined in: [types/proxy.ts:2393](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2393)

---

### traceId?

> `optional` **traceId?**: `string`

Defined in: [types/proxy.ts:2394](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2394)

---

### spanId?

> `optional` **spanId?**: `string`

Defined in: [types/proxy.ts:2395](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2395)

---

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [types/proxy.ts:2396](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2396)
