[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RequestAttemptLogEntry

# Type Alias: RequestAttemptLogEntry

> **RequestAttemptLogEntry** = `object`

Defined in: [types/proxy.ts:780](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L780)

## Properties

### timestamp

> **timestamp**: `string`

Defined in: [types/proxy.ts:781](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L781)

---

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:782](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L782)

---

### parentRequestId?

> `optional` **parentRequestId?**: `string`

Defined in: [types/proxy.ts:784](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L784)

Parent client request for an internal fallback invocation.

---

### reasoningEffort?

> `optional` **reasoningEffort?**: `string`

Defined in: [types/proxy.ts:786](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L786)

Requested effort retained independently of full body captures.

---

### attempt

> **attempt**: `number`

Defined in: [types/proxy.ts:787](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L787)

---

### method

> **method**: `string`

Defined in: [types/proxy.ts:788](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L788)

---

### path

> **path**: `string`

Defined in: [types/proxy.ts:789](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L789)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:790](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L790)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:791](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L791)

---

### toolCount

> **toolCount**: `number`

Defined in: [types/proxy.ts:792](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L792)

---

### account

> **account**: `string`

Defined in: [types/proxy.ts:793](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L793)

---

### accountKey?

> `optional` **accountKey?**: `string`

Defined in: [types/proxy.ts:795](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L795)

Provider-qualified account key for collision-free reconstruction.

---

### accountType

> **accountType**: `string`

Defined in: [types/proxy.ts:796](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L796)

---

### responseStatus

> **responseStatus**: `number`

Defined in: [types/proxy.ts:797](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L797)

---

### responseTimeMs

> **responseTimeMs**: `number`

Defined in: [types/proxy.ts:799](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L799)

End-to-end request age when this attempt completed.

---

### attemptDurationMs?

> `optional` **attemptDurationMs?**: `number`

Defined in: [types/proxy.ts:801](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L801)

Time spent in this specific account attempt.

---

### errorType?

> `optional` **errorType?**: `string`

Defined in: [types/proxy.ts:802](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L802)

---

### errorMessage?

> `optional` **errorMessage?**: `string`

Defined in: [types/proxy.ts:803](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L803)

---

### errorCode?

> `optional` **errorCode?**: `string`

Defined in: [types/proxy.ts:805](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L805)

Low-level transport code such as ETIMEDOUT or EADDRNOTAVAIL.

---

### transportScope?

> `optional` **transportScope?**: [`ProxyTransportScope`](ProxyTransportScope.md)

Defined in: [types/proxy.ts:807](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L807)

Whether changing credentials can affect this transport failure.

---

### retryable?

> `optional` **retryable?**: `boolean`

Defined in: [types/proxy.ts:809](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L809)

Whether this failed attempt may be retried without changing the request.

---

### connectPhase?

> `optional` **connectPhase?**: `boolean`

Defined in: [types/proxy.ts:811](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L811)

The transport failure happened before any request byte was sent.

---

### rateLimitKind?

> `optional` **rateLimitKind?**: `"transient"` \| `"quota"`

Defined in: [types/proxy.ts:813](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L813)

Distinguishes short-lived admission throttles from exhausted quota windows.

---

### cooldownReason?

> `optional` **cooldownReason?**: `"transient"` \| `"session"` \| `"weekly"` \| `"unified"`

Defined in: [types/proxy.ts:815](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L815)

Reset-aware cooldown reason selected for a rate-limited attempt.

---

### inputTokens?

> `optional` **inputTokens?**: `number`

Defined in: [types/proxy.ts:816](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L816)

---

### outputTokens?

> `optional` **outputTokens?**: `number`

Defined in: [types/proxy.ts:817](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L817)

---

### cacheCreationTokens?

> `optional` **cacheCreationTokens?**: `number`

Defined in: [types/proxy.ts:818](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L818)

---

### cacheReadTokens?

> `optional` **cacheReadTokens?**: `number`

Defined in: [types/proxy.ts:819](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L819)

---

### provider?

> `optional` **provider?**: `string`

Defined in: [types/proxy.ts:821](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L821)

Provider that received this upstream attempt.

---

### traceId?

> `optional` **traceId?**: `string`

Defined in: [types/proxy.ts:823](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L823)

OTel trace ID for correlation with distributed traces

---

### spanId?

> `optional` **spanId?**: `string`

Defined in: [types/proxy.ts:825](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L825)

OTel span ID for correlation with distributed traces
