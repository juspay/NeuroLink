[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AnthropicLoopState

# Type Alias: AnthropicLoopState

> **AnthropicLoopState** = `object`

Defined in: [types/proxy.ts:949](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L949)

## Properties

### lastError

> **lastError**: `unknown`

Defined in: [types/proxy.ts:950](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L950)

---

### sawRateLimit

> **sawRateLimit**: `boolean`

Defined in: [types/proxy.ts:951](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L951)

---

### sawNetworkError

> **sawNetworkError**: `boolean`

Defined in: [types/proxy.ts:952](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L952)

---

### sawTransientFailure

> **sawTransientFailure**: `boolean`

Defined in: [types/proxy.ts:953](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L953)

---

### invalidRequestFailure

> **invalidRequestFailure**: \{ `status`: `number`; `body`: `string`; `contentType?`: `string`; \} \| `null`

Defined in: [types/proxy.ts:954](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L954)

---

### authFailureMessage

> **authFailureMessage**: `string` \| `null`

Defined in: [types/proxy.ts:959](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L959)

---

### authCooldownMessage

> **authCooldownMessage**: `string` \| `null`

Defined in: [types/proxy.ts:960](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L960)

---

### entitlementFailure

> **entitlementFailure**: [`AnthropicEntitlementFailure`](AnthropicEntitlementFailure.md) \| `null`

Defined in: [types/proxy.ts:961](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L961)

---

### scopedExhaustion

> **scopedExhaustion**: [`AnthropicScopedExhaustion`](AnthropicScopedExhaustion.md) \| `null`

Defined in: [types/proxy.ts:962](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L962)

---

### fallbackFailureMessage?

> `optional` **fallbackFailureMessage?**: `string`

Defined in: [types/proxy.ts:963](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L963)

---

### attemptNumber

> **attemptNumber**: `number`

Defined in: [types/proxy.ts:964](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L964)

---

### lastTransportErrorCode?

> `optional` **lastTransportErrorCode?**: `string`

Defined in: [types/proxy.ts:965](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L965)

---

### lastTransportScope?

> `optional` **lastTransportScope?**: [`ProxyNetworkTransportScope`](ProxyNetworkTransportScope.md)

Defined in: [types/proxy.ts:966](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L966)
