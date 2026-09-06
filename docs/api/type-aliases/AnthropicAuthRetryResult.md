[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AnthropicAuthRetryResult

# Type Alias: AnthropicAuthRetryResult

> **AnthropicAuthRetryResult** = `object`

Defined in: [types/proxy.ts:1040](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1040)

## Properties

### response?

> `optional` **response?**: `Response` \| `unknown`

Defined in: [types/proxy.ts:1041](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1041)

---

### holdsAccountAdmission?

> `optional` **holdsAccountAdmission?**: `boolean`

Defined in: [types/proxy.ts:1042](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1042)

---

### continueLoop

> **continueLoop**: `boolean`

Defined in: [types/proxy.ts:1043](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1043)

---

### retryDelayMs?

> `optional` **retryDelayMs?**: `number`

Defined in: [types/proxy.ts:1045](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1045)

Failure-path pacing before rotating after provider-wide overload.

---

### lastError

> **lastError**: `unknown`

Defined in: [types/proxy.ts:1046](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1046)

---

### authFailureMessage

> **authFailureMessage**: `string` \| `null`

Defined in: [types/proxy.ts:1047](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1047)

---

### entitlementFailure

> **entitlementFailure**: [`AnthropicEntitlementFailure`](AnthropicEntitlementFailure.md) \| `null`

Defined in: [types/proxy.ts:1048](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1048)

---

### sawRateLimit

> **sawRateLimit**: `boolean`

Defined in: [types/proxy.ts:1049](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1049)

---

### sawTransientFailure

> **sawTransientFailure**: `boolean`

Defined in: [types/proxy.ts:1050](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1050)

---

### sawNetworkError

> **sawNetworkError**: `boolean`

Defined in: [types/proxy.ts:1051](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1051)

---

### upstreamSpan?

> `optional` **upstreamSpan?**: `Span`

Defined in: [types/proxy.ts:1052](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1052)
