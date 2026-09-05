[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RequestLogEntry

# Type Alias: RequestLogEntry

> **RequestLogEntry** = `object`

Defined in: [types/proxy.ts:672](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L672)

## Properties

### firstUsefulOutputMs?

> `optional` **firstUsefulOutputMs?**: `number`

Defined in: [types/proxy.ts:674](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L674)

First output text or tool-argument delta, excluding SSE control frames.

---

### fallbackPlan?

> `optional` **fallbackPlan?**: `object`[]

Defined in: [types/proxy.ts:676](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L676)

Small routing evidence retained even when response bodies are pruned.

#### provider

> **provider**: `string`

#### model

> **model**: `string`

#### reasoningEffort?

> `optional` **reasoningEffort?**: `string`

---

### timestamp

> **timestamp**: `string`

Defined in: [types/proxy.ts:681](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L681)

---

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:682](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L682)

---

### method

> **method**: `string`

Defined in: [types/proxy.ts:683](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L683)

---

### path

> **path**: `string`

Defined in: [types/proxy.ts:684](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L684)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:685](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L685)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:686](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L686)

---

### toolCount

> **toolCount**: `number`

Defined in: [types/proxy.ts:687](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L687)

---

### account

> **account**: `string`

Defined in: [types/proxy.ts:688](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L688)

---

### accountKey?

> `optional` **accountKey?**: `string`

Defined in: [types/proxy.ts:690](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L690)

Provider-qualified account key for collision-free reconstruction.

---

### accountType

> **accountType**: `string`

Defined in: [types/proxy.ts:691](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L691)

---

### responseStatus

> **responseStatus**: `number`

Defined in: [types/proxy.ts:692](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L692)

---

### responseTimeMs

> **responseTimeMs**: `number`

Defined in: [types/proxy.ts:693](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L693)

---

### errorType?

> `optional` **errorType?**: `string`

Defined in: [types/proxy.ts:694](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L694)

---

### errorMessage?

> `optional` **errorMessage?**: `string`

Defined in: [types/proxy.ts:695](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L695)

---

### errorCode?

> `optional` **errorCode?**: `string`

Defined in: [types/proxy.ts:697](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L697)

Low-level transport code such as ETIMEDOUT or EADDRNOTAVAIL.

---

### transportScope?

> `optional` **transportScope?**: [`ProxyTransportScope`](ProxyTransportScope.md)

Defined in: [types/proxy.ts:699](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L699)

Whether changing credentials can affect this transport failure.

---

### inputTokens?

> `optional` **inputTokens?**: `number`

Defined in: [types/proxy.ts:700](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L700)

---

### outputTokens?

> `optional` **outputTokens?**: `number`

Defined in: [types/proxy.ts:701](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L701)

---

### cacheCreationTokens?

> `optional` **cacheCreationTokens?**: `number`

Defined in: [types/proxy.ts:702](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L702)

---

### cacheReadTokens?

> `optional` **cacheReadTokens?**: `number`

Defined in: [types/proxy.ts:703](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L703)

---

### provider?

> `optional` **provider?**: `string`

Defined in: [types/proxy.ts:709](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L709)

Provider that actually served the request, for costing. Absent on records
written before this field existed; `proxyAnalysis` then falls back to a
cross-provider model lookup rather than assuming Anthropic.

---

### terminalOutcome?

> `optional` **terminalOutcome?**: `"completed"` \| `"bodyless"` \| `"client_cancelled"` \| `"stream_error"` \| `"handler_error"`

Defined in: [types/proxy.ts:711](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L711)

Terminal state of the client-facing response when known.

---

### clientApp?

> `optional` **clientApp?**: `string`

Defined in: [types/proxy.ts:726](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L726)

Which CLI made the request, derived from User-Agent, and the raw header it
was derived from.

Both are stored. The derived name is what a dashboard groups on, but the
classifier only knows the clients it has seen — keeping the raw header
means a client it does not recognise is still attributable rather than
collapsing into "unknown" with everything else.

---

### userAgent?

> `optional` **userAgent?**: `string`

Defined in: [types/proxy.ts:728](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L728)

Raw User-Agent, truncated. See clientApp.

---

### traceId?

> `optional` **traceId?**: `string`

Defined in: [types/proxy.ts:730](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L730)

OTel trace ID for correlation with distributed traces

---

### spanId?

> `optional` **spanId?**: `string`

Defined in: [types/proxy.ts:732](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L732)

OTel span ID for correlation with distributed traces

---

### routingDecision?

> `optional` **routingDecision?**: [`ProxyAccountRoutingDecision`](ProxyAccountRoutingDecision.md)

Defined in: [types/proxy.ts:734](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L734)

Exact secret-free inputs and result of initial account selection.
