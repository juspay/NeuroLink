[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AnthropicNonOkResult

# Type Alias: AnthropicNonOkResult

> **AnthropicNonOkResult** = `object`

Defined in: [types/proxy.ts:1059](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1059)

## Properties

### response?

> `optional` **response?**: `Response` \| `unknown`

Defined in: [types/proxy.ts:1060](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1060)

---

### continueLoop

> **continueLoop**: `boolean`

Defined in: [types/proxy.ts:1061](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1061)

---

### retrySameAccount?

> `optional` **retrySameAccount?**: `boolean`

Defined in: [types/proxy.ts:1062](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1062)

---

### retryDelayMs?

> `optional` **retryDelayMs?**: `number`

Defined in: [types/proxy.ts:1064](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1064)

Failure-path pacing before rotating after provider-wide overload.

---

### lastError

> **lastError**: `unknown`

Defined in: [types/proxy.ts:1065](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1065)

---

### authFailureMessage

> **authFailureMessage**: `string` \| `null`

Defined in: [types/proxy.ts:1066](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1066)

---

### sawTransientFailure

> **sawTransientFailure**: `boolean`

Defined in: [types/proxy.ts:1067](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1067)

---

### invalidRequestFailure

> **invalidRequestFailure**: \{ `status`: `number`; `body`: `string`; `contentType?`: `string`; \} \| `null`

Defined in: [types/proxy.ts:1068](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1068)

---

### entitlementFailure

> **entitlementFailure**: [`AnthropicEntitlementFailure`](AnthropicEntitlementFailure.md) \| `null`

Defined in: [types/proxy.ts:1073](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1073)

---

### upstreamSpan?

> `optional` **upstreamSpan?**: `Span`

Defined in: [types/proxy.ts:1074](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1074)
