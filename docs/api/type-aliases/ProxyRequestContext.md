[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyRequestContext

# Type Alias: ProxyRequestContext

> **ProxyRequestContext** = `object`

Defined in: [types/proxy.ts:1798](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1798)

Context for a proxy request at the root span level.

## Properties

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:1799](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1799)

---

### method

> **method**: `string`

Defined in: [types/proxy.ts:1800](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1800)

---

### path

> **path**: `string`

Defined in: [types/proxy.ts:1801](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1801)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:1802](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1802)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:1803](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1803)

---

### toolCount

> **toolCount**: `number`

Defined in: [types/proxy.ts:1804](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1804)

---

### toolNames?

> `optional` **toolNames?**: `string`[]

Defined in: [types/proxy.ts:1806](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1806)

Names of the tools advertised in the request (what the caller exposed).

---

### sessionId?

> `optional` **sessionId?**: `string`

Defined in: [types/proxy.ts:1807](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1807)

---

### userAgent?

> `optional` **userAgent?**: `string`

Defined in: [types/proxy.ts:1808](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1808)

---

### clientApp?

> `optional` **clientApp?**: `string`

Defined in: [types/proxy.ts:1809](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1809)

---

### provider?

> `optional` **provider?**: `string`

Defined in: [types/proxy.ts:1816](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1816)

Provider that will serve the request, used for costing. Defaults to
"anthropic" when omitted, which is correct for the /v1/messages engine;
the OpenAI-compatible engine must pass whatever ModelRouter resolved, or
every non-Anthropic model prices to $0.
