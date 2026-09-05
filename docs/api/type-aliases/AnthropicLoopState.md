[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AnthropicLoopState

# Type Alias: AnthropicLoopState

> **AnthropicLoopState** = `object`

Defined in: [types/proxy.ts:930](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L930)

## Properties

### lastError

> **lastError**: `unknown`

Defined in: [types/proxy.ts:931](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L931)

---

### sawRateLimit

> **sawRateLimit**: `boolean`

Defined in: [types/proxy.ts:932](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L932)

---

### sawNetworkError

> **sawNetworkError**: `boolean`

Defined in: [types/proxy.ts:933](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L933)

---

### sawTransientFailure

> **sawTransientFailure**: `boolean`

Defined in: [types/proxy.ts:934](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L934)

---

### invalidRequestFailure

> **invalidRequestFailure**: \{ `status`: `number`; `body`: `string`; `contentType?`: `string`; \} \| `null`

Defined in: [types/proxy.ts:935](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L935)

---

### authFailureMessage

> **authFailureMessage**: `string` \| `null`

Defined in: [types/proxy.ts:940](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L940)

---

### authCooldownMessage

> **authCooldownMessage**: `string` \| `null`

Defined in: [types/proxy.ts:941](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L941)

---

### entitlementFailure

> **entitlementFailure**: [`AnthropicEntitlementFailure`](AnthropicEntitlementFailure.md) \| `null`

Defined in: [types/proxy.ts:942](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L942)

---

### scopedExhaustion

> **scopedExhaustion**: [`AnthropicScopedExhaustion`](AnthropicScopedExhaustion.md) \| `null`

Defined in: [types/proxy.ts:943](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L943)

---

### fallbackFailureMessage?

> `optional` **fallbackFailureMessage?**: `string`

Defined in: [types/proxy.ts:944](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L944)

---

### attemptNumber

> **attemptNumber**: `number`

Defined in: [types/proxy.ts:945](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L945)

---

### lastTransportErrorCode?

> `optional` **lastTransportErrorCode?**: `string`

Defined in: [types/proxy.ts:946](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L946)

---

### lastTransportScope?

> `optional` **lastTransportScope?**: [`ProxyNetworkTransportScope`](ProxyNetworkTransportScope.md)

Defined in: [types/proxy.ts:947](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L947)
