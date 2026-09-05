[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AnthropicNonOkResult

# Type Alias: AnthropicNonOkResult

> **AnthropicNonOkResult** = `object`

Defined in: [types/proxy.ts:1036](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1036)

## Properties

### response?

> `optional` **response?**: `Response` \| `unknown`

Defined in: [types/proxy.ts:1037](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1037)

---

### continueLoop

> **continueLoop**: `boolean`

Defined in: [types/proxy.ts:1038](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1038)

---

### retrySameAccount?

> `optional` **retrySameAccount?**: `boolean`

Defined in: [types/proxy.ts:1039](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1039)

---

### retryDelayMs?

> `optional` **retryDelayMs?**: `number`

Defined in: [types/proxy.ts:1041](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1041)

Failure-path pacing before rotating after provider-wide overload.

---

### lastError

> **lastError**: `unknown`

Defined in: [types/proxy.ts:1042](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1042)

---

### authFailureMessage

> **authFailureMessage**: `string` \| `null`

Defined in: [types/proxy.ts:1043](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1043)

---

### sawTransientFailure

> **sawTransientFailure**: `boolean`

Defined in: [types/proxy.ts:1044](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1044)

---

### invalidRequestFailure

> **invalidRequestFailure**: \{ `status`: `number`; `body`: `string`; `contentType?`: `string`; \} \| `null`

Defined in: [types/proxy.ts:1045](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1045)

---

### entitlementFailure

> **entitlementFailure**: [`AnthropicEntitlementFailure`](AnthropicEntitlementFailure.md) \| `null`

Defined in: [types/proxy.ts:1050](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1050)

---

### upstreamSpan?

> `optional` **upstreamSpan?**: `Span`

Defined in: [types/proxy.ts:1051](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1051)
