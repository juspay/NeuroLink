[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyLifecycleEventInput

# Type Alias: ProxyLifecycleEventInput

> **ProxyLifecycleEventInput** = `object`

Defined in: [types/proxy.ts:1963](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1963)

Content-free lifecycle event accepted by the bounded metadata logger.

## Properties

### event

> **event**: [`ProxyLifecycleEventName`](ProxyLifecycleEventName.md)

Defined in: [types/proxy.ts:1964](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1964)

---

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:1965](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1965)

---

### method

> **method**: `string`

Defined in: [types/proxy.ts:1966](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1966)

---

### path

> **path**: `string`

Defined in: [types/proxy.ts:1967](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1967)

---

### model?

> `optional` **model?**: `string`

Defined in: [types/proxy.ts:1968](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1968)

---

### stream?

> `optional` **stream?**: `boolean`

Defined in: [types/proxy.ts:1969](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1969)

---

### toolCount?

> `optional` **toolCount?**: `number`

Defined in: [types/proxy.ts:1970](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1970)

---

### sessionHash?

> `optional` **sessionHash?**: `string`

Defined in: [types/proxy.ts:1971](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1971)

---

### requestBytes?

> `optional` **requestBytes?**: `number`

Defined in: [types/proxy.ts:1972](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1972)

---

### responseStatus?

> `optional` **responseStatus?**: `number`

Defined in: [types/proxy.ts:1973](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1973)

---

### finalStatus?

> `optional` **finalStatus?**: `number`

Defined in: [types/proxy.ts:1975](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1975)

Semantic final status; the HTTP status may already have been committed.

---

### telemetryStatus?

> `optional` **telemetryStatus?**: `"complete"` \| `"timeout"` \| `"observer_error"` \| `"missing_final"`

Defined in: [types/proxy.ts:1977](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1977)

Terminal bookkeeping health, separate from the model outcome.

---

### transportOutcome?

> `optional` **transportOutcome?**: [`ProxyResponseTerminalOutcome`](ProxyResponseTerminalOutcome.md)

Defined in: [types/proxy.ts:1979](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1979)

Transport completion is independent of successful model completion.

---

### outcomeSource?

> `optional` **outcomeSource?**: `"final_request"` \| `"transport_error"` \| `"http_status"` \| `"unknown"`

Defined in: [types/proxy.ts:1980](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1980)

---

### observedBodyBytes?

> `optional` **observedBodyBytes?**: `number`

Defined in: [types/proxy.ts:1986](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1986)

Decoded response-body bytes observed by the adapter.

---

### responseChunks?

> `optional` **responseChunks?**: `number`

Defined in: [types/proxy.ts:1987](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1987)

---

### elapsedMs?

> `optional` **elapsedMs?**: `number`

Defined in: [types/proxy.ts:1988](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1988)

---

### terminalOutcome?

> `optional` **terminalOutcome?**: [`ProxyLifecycleTerminalOutcome`](ProxyLifecycleTerminalOutcome.md)

Defined in: [types/proxy.ts:1989](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1989)

---

### errorType?

> `optional` **errorType?**: `string`

Defined in: [types/proxy.ts:1990](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1990)

---

### errorCode?

> `optional` **errorCode?**: `string`

Defined in: [types/proxy.ts:1991](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1991)

---

### timestampMs?

> `optional` **timestampMs?**: `number`

Defined in: [types/proxy.ts:1992](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1992)

---

### monotonicMs?

> `optional` **monotonicMs?**: `number`

Defined in: [types/proxy.ts:1993](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1993)

---

### supervisorEvent?

> `optional` **supervisorEvent?**: [`RollingWorkerSupervisorEvent`](RollingWorkerSupervisorEvent.md)

Defined in: [types/proxy.ts:1995](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1995)

Parent-owned evidence, independent of the serving worker's journal tail.

---

### runtimeSample?

> `optional` **runtimeSample?**: [`ProxyRuntimeSample`](ProxyRuntimeSample.md)

Defined in: [types/proxy.ts:1996](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1996)
