[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RequestAttemptLogEntry

# Type Alias: RequestAttemptLogEntry

> **RequestAttemptLogEntry** = `object`

Defined in: [types/proxy.ts:757](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L757)

## Properties

### timestamp

> **timestamp**: `string`

Defined in: [types/proxy.ts:758](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L758)

---

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:759](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L759)

---

### parentRequestId?

> `optional` **parentRequestId?**: `string`

Defined in: [types/proxy.ts:761](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L761)

Parent client request for an internal fallback invocation.

---

### reasoningEffort?

> `optional` **reasoningEffort?**: `string`

Defined in: [types/proxy.ts:763](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L763)

Requested effort retained independently of full body captures.

---

### attempt

> **attempt**: `number`

Defined in: [types/proxy.ts:764](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L764)

---

### method

> **method**: `string`

Defined in: [types/proxy.ts:765](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L765)

---

### path

> **path**: `string`

Defined in: [types/proxy.ts:766](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L766)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:767](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L767)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:768](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L768)

---

### toolCount

> **toolCount**: `number`

Defined in: [types/proxy.ts:769](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L769)

---

### account

> **account**: `string`

Defined in: [types/proxy.ts:770](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L770)

---

### accountKey?

> `optional` **accountKey?**: `string`

Defined in: [types/proxy.ts:772](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L772)

Provider-qualified account key for collision-free reconstruction.

---

### accountType

> **accountType**: `string`

Defined in: [types/proxy.ts:773](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L773)

---

### responseStatus

> **responseStatus**: `number`

Defined in: [types/proxy.ts:774](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L774)

---

### responseTimeMs

> **responseTimeMs**: `number`

Defined in: [types/proxy.ts:776](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L776)

End-to-end request age when this attempt completed.

---

### attemptDurationMs?

> `optional` **attemptDurationMs?**: `number`

Defined in: [types/proxy.ts:778](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L778)

Time spent in this specific account attempt.

---

### errorType?

> `optional` **errorType?**: `string`

Defined in: [types/proxy.ts:779](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L779)

---

### errorMessage?

> `optional` **errorMessage?**: `string`

Defined in: [types/proxy.ts:780](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L780)

---

### errorCode?

> `optional` **errorCode?**: `string`

Defined in: [types/proxy.ts:782](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L782)

Low-level transport code such as ETIMEDOUT or EADDRNOTAVAIL.

---

### transportScope?

> `optional` **transportScope?**: [`ProxyTransportScope`](ProxyTransportScope.md)

Defined in: [types/proxy.ts:784](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L784)

Whether changing credentials can affect this transport failure.

---

### retryable?

> `optional` **retryable?**: `boolean`

Defined in: [types/proxy.ts:786](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L786)

Whether this failed attempt may be retried without changing the request.

---

### connectPhase?

> `optional` **connectPhase?**: `boolean`

Defined in: [types/proxy.ts:788](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L788)

The transport failure happened before any request byte was sent.

---

### rateLimitKind?

> `optional` **rateLimitKind?**: `"transient"` \| `"quota"`

Defined in: [types/proxy.ts:790](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L790)

Distinguishes short-lived admission throttles from exhausted quota windows.

---

### cooldownReason?

> `optional` **cooldownReason?**: `"transient"` \| `"session"` \| `"weekly"` \| `"unified"`

Defined in: [types/proxy.ts:792](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L792)

Reset-aware cooldown reason selected for a rate-limited attempt.

---

### inputTokens?

> `optional` **inputTokens?**: `number`

Defined in: [types/proxy.ts:793](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L793)

---

### outputTokens?

> `optional` **outputTokens?**: `number`

Defined in: [types/proxy.ts:794](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L794)

---

### cacheCreationTokens?

> `optional` **cacheCreationTokens?**: `number`

Defined in: [types/proxy.ts:795](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L795)

---

### cacheReadTokens?

> `optional` **cacheReadTokens?**: `number`

Defined in: [types/proxy.ts:796](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L796)

---

### provider?

> `optional` **provider?**: `string`

Defined in: [types/proxy.ts:798](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L798)

Provider that received this upstream attempt.

---

### traceId?

> `optional` **traceId?**: `string`

Defined in: [types/proxy.ts:800](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L800)

OTel trace ID for correlation with distributed traces

---

### spanId?

> `optional` **spanId?**: `string`

Defined in: [types/proxy.ts:802](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L802)

OTel span ID for correlation with distributed traces
