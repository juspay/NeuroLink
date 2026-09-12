[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AnthropicAuthRetryResult

# Type Alias: AnthropicAuthRetryResult

> **AnthropicAuthRetryResult** = `object`

Defined in: [types/proxy.ts:1044](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1044)

## Properties

### response?

> `optional` **response?**: `Response` \| `unknown`

Defined in: [types/proxy.ts:1045](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1045)

---

### holdsAccountAdmission?

> `optional` **holdsAccountAdmission?**: `boolean`

Defined in: [types/proxy.ts:1046](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1046)

---

### continueLoop

> **continueLoop**: `boolean`

Defined in: [types/proxy.ts:1047](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1047)

---

### retryDelayMs?

> `optional` **retryDelayMs?**: `number`

Defined in: [types/proxy.ts:1049](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1049)

Failure-path pacing before rotating after provider-wide overload.

---

### lastError

> **lastError**: `unknown`

Defined in: [types/proxy.ts:1050](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1050)

---

### authFailureMessage

> **authFailureMessage**: `string` \| `null`

Defined in: [types/proxy.ts:1051](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1051)

---

### entitlementFailure

> **entitlementFailure**: [`AnthropicEntitlementFailure`](AnthropicEntitlementFailure.md) \| `null`

Defined in: [types/proxy.ts:1052](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1052)

---

### sawRateLimit

> **sawRateLimit**: `boolean`

Defined in: [types/proxy.ts:1053](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1053)

---

### sawTransientFailure

> **sawTransientFailure**: `boolean`

Defined in: [types/proxy.ts:1054](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1054)

---

### sawNetworkError

> **sawNetworkError**: `boolean`

Defined in: [types/proxy.ts:1055](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1055)

---

### upstreamSpan?

> `optional` **upstreamSpan?**: `Span`

Defined in: [types/proxy.ts:1056](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1056)
