[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyRequestContext

# Type Alias: ProxyRequestContext

> **ProxyRequestContext** = `object`

Defined in: [types/proxy.ts:1775](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1775)

Context for a proxy request at the root span level.

## Properties

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:1776](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1776)

---

### method

> **method**: `string`

Defined in: [types/proxy.ts:1777](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1777)

---

### path

> **path**: `string`

Defined in: [types/proxy.ts:1778](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1778)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:1779](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1779)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:1780](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1780)

---

### toolCount

> **toolCount**: `number`

Defined in: [types/proxy.ts:1781](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1781)

---

### toolNames?

> `optional` **toolNames?**: `string`[]

Defined in: [types/proxy.ts:1783](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1783)

Names of the tools advertised in the request (what the caller exposed).

---

### sessionId?

> `optional` **sessionId?**: `string`

Defined in: [types/proxy.ts:1784](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1784)

---

### userAgent?

> `optional` **userAgent?**: `string`

Defined in: [types/proxy.ts:1785](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1785)

---

### clientApp?

> `optional` **clientApp?**: `string`

Defined in: [types/proxy.ts:1786](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1786)

---

### provider?

> `optional` **provider?**: `string`

Defined in: [types/proxy.ts:1793](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1793)

Provider that will serve the request, used for costing. Defaults to
"anthropic" when omitted, which is correct for the /v1/messages engine;
the OpenAI-compatible engine must pass whatever ModelRouter resolved, or
every non-Anthropic model prices to $0.
