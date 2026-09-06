[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyRequestContext

# Type Alias: ProxyRequestContext

> **ProxyRequestContext** = `object`

Defined in: [types/proxy.ts:1794](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1794)

Context for a proxy request at the root span level.

## Properties

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:1795](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1795)

---

### method

> **method**: `string`

Defined in: [types/proxy.ts:1796](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1796)

---

### path

> **path**: `string`

Defined in: [types/proxy.ts:1797](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1797)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:1798](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1798)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:1799](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1799)

---

### toolCount

> **toolCount**: `number`

Defined in: [types/proxy.ts:1800](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1800)

---

### toolNames?

> `optional` **toolNames?**: `string`[]

Defined in: [types/proxy.ts:1802](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1802)

Names of the tools advertised in the request (what the caller exposed).

---

### sessionId?

> `optional` **sessionId?**: `string`

Defined in: [types/proxy.ts:1803](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1803)

---

### userAgent?

> `optional` **userAgent?**: `string`

Defined in: [types/proxy.ts:1804](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1804)

---

### clientApp?

> `optional` **clientApp?**: `string`

Defined in: [types/proxy.ts:1805](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1805)

---

### provider?

> `optional` **provider?**: `string`

Defined in: [types/proxy.ts:1812](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1812)

Provider that will serve the request, used for costing. Defaults to
"anthropic" when omitted, which is correct for the /v1/messages engine;
the OpenAI-compatible engine must pass whatever ModelRouter resolved, or
every non-Anthropic model prices to $0.
