[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLifecycleEventInput

# Type Alias: ProxyLifecycleEventInput

> **ProxyLifecycleEventInput** = `object`

Defined in: [types/proxy.ts:1938](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1938)

Content-free lifecycle event accepted by the bounded metadata logger.

## Properties

### event

> **event**: [`ProxyLifecycleEventName`](ProxyLifecycleEventName.md)

Defined in: [types/proxy.ts:1939](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1939)

---

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:1940](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1940)

---

### method

> **method**: `string`

Defined in: [types/proxy.ts:1941](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1941)

---

### path

> **path**: `string`

Defined in: [types/proxy.ts:1942](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1942)

---

### model?

> `optional` **model?**: `string`

Defined in: [types/proxy.ts:1943](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1943)

---

### stream?

> `optional` **stream?**: `boolean`

Defined in: [types/proxy.ts:1944](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1944)

---

### toolCount?

> `optional` **toolCount?**: `number`

Defined in: [types/proxy.ts:1945](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1945)

---

### sessionHash?

> `optional` **sessionHash?**: `string`

Defined in: [types/proxy.ts:1946](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1946)

---

### requestBytes?

> `optional` **requestBytes?**: `number`

Defined in: [types/proxy.ts:1947](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1947)

---

### responseStatus?

> `optional` **responseStatus?**: `number`

Defined in: [types/proxy.ts:1948](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1948)

---

### finalStatus?

> `optional` **finalStatus?**: `number`

Defined in: [types/proxy.ts:1950](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1950)

Semantic final status; the HTTP status may already have been committed.

---

### telemetryStatus?

> `optional` **telemetryStatus?**: `"complete"` \| `"timeout"` \| `"observer_error"` \| `"missing_final"`

Defined in: [types/proxy.ts:1952](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1952)

Terminal bookkeeping health, separate from the model outcome.

---

### transportOutcome?

> `optional` **transportOutcome?**: [`ProxyResponseTerminalOutcome`](ProxyResponseTerminalOutcome.md)

Defined in: [types/proxy.ts:1954](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1954)

Transport completion is independent of successful model completion.

---

### outcomeSource?

> `optional` **outcomeSource?**: `"final_request"` \| `"transport_error"` \| `"http_status"` \| `"unknown"`

Defined in: [types/proxy.ts:1955](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1955)

---

### observedBodyBytes?

> `optional` **observedBodyBytes?**: `number`

Defined in: [types/proxy.ts:1961](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1961)

Decoded response-body bytes observed by the adapter.

---

### responseChunks?

> `optional` **responseChunks?**: `number`

Defined in: [types/proxy.ts:1962](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1962)

---

### elapsedMs?

> `optional` **elapsedMs?**: `number`

Defined in: [types/proxy.ts:1963](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1963)

---

### terminalOutcome?

> `optional` **terminalOutcome?**: [`ProxyLifecycleTerminalOutcome`](ProxyLifecycleTerminalOutcome.md)

Defined in: [types/proxy.ts:1964](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1964)

---

### errorType?

> `optional` **errorType?**: `string`

Defined in: [types/proxy.ts:1965](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1965)

---

### errorCode?

> `optional` **errorCode?**: `string`

Defined in: [types/proxy.ts:1966](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1966)

---

### timestampMs?

> `optional` **timestampMs?**: `number`

Defined in: [types/proxy.ts:1967](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1967)

---

### monotonicMs?

> `optional` **monotonicMs?**: `number`

Defined in: [types/proxy.ts:1968](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1968)
