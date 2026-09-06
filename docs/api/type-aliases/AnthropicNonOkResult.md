[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AnthropicNonOkResult

# Type Alias: AnthropicNonOkResult

> **AnthropicNonOkResult** = `object`

Defined in: [types/proxy.ts:1055](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1055)

## Properties

### response?

> `optional` **response?**: `Response` \| `unknown`

Defined in: [types/proxy.ts:1056](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1056)

---

### continueLoop

> **continueLoop**: `boolean`

Defined in: [types/proxy.ts:1057](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1057)

---

### retrySameAccount?

> `optional` **retrySameAccount?**: `boolean`

Defined in: [types/proxy.ts:1058](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1058)

---

### retryDelayMs?

> `optional` **retryDelayMs?**: `number`

Defined in: [types/proxy.ts:1060](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1060)

Failure-path pacing before rotating after provider-wide overload.

---

### lastError

> **lastError**: `unknown`

Defined in: [types/proxy.ts:1061](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1061)

---

### authFailureMessage

> **authFailureMessage**: `string` \| `null`

Defined in: [types/proxy.ts:1062](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1062)

---

### sawTransientFailure

> **sawTransientFailure**: `boolean`

Defined in: [types/proxy.ts:1063](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1063)

---

### invalidRequestFailure

> **invalidRequestFailure**: \{ `status`: `number`; `body`: `string`; `contentType?`: `string`; \} \| `null`

Defined in: [types/proxy.ts:1064](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1064)

---

### entitlementFailure

> **entitlementFailure**: [`AnthropicEntitlementFailure`](AnthropicEntitlementFailure.md) \| `null`

Defined in: [types/proxy.ts:1069](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1069)

---

### upstreamSpan?

> `optional` **upstreamSpan?**: `Span`

Defined in: [types/proxy.ts:1070](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1070)
