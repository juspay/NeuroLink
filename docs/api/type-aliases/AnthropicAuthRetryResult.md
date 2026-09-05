[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AnthropicAuthRetryResult

# Type Alias: AnthropicAuthRetryResult

> **AnthropicAuthRetryResult** = `object`

Defined in: [types/proxy.ts:1021](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1021)

## Properties

### response?

> `optional` **response?**: `Response` \| `unknown`

Defined in: [types/proxy.ts:1022](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1022)

---

### holdsAccountAdmission?

> `optional` **holdsAccountAdmission?**: `boolean`

Defined in: [types/proxy.ts:1023](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1023)

---

### continueLoop

> **continueLoop**: `boolean`

Defined in: [types/proxy.ts:1024](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1024)

---

### retryDelayMs?

> `optional` **retryDelayMs?**: `number`

Defined in: [types/proxy.ts:1026](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1026)

Failure-path pacing before rotating after provider-wide overload.

---

### lastError

> **lastError**: `unknown`

Defined in: [types/proxy.ts:1027](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1027)

---

### authFailureMessage

> **authFailureMessage**: `string` \| `null`

Defined in: [types/proxy.ts:1028](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1028)

---

### entitlementFailure

> **entitlementFailure**: [`AnthropicEntitlementFailure`](AnthropicEntitlementFailure.md) \| `null`

Defined in: [types/proxy.ts:1029](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1029)

---

### sawRateLimit

> **sawRateLimit**: `boolean`

Defined in: [types/proxy.ts:1030](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1030)

---

### sawTransientFailure

> **sawTransientFailure**: `boolean`

Defined in: [types/proxy.ts:1031](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1031)

---

### sawNetworkError

> **sawNetworkError**: `boolean`

Defined in: [types/proxy.ts:1032](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1032)

---

### upstreamSpan?

> `optional` **upstreamSpan?**: `Span`

Defined in: [types/proxy.ts:1033](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1033)
