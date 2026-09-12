[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AnthropicLoopState

# Type Alias: AnthropicLoopState

> **AnthropicLoopState** = `object`

Defined in: [types/proxy.ts:953](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L953)

## Properties

### lastError

> **lastError**: `unknown`

Defined in: [types/proxy.ts:954](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L954)

---

### sawRateLimit

> **sawRateLimit**: `boolean`

Defined in: [types/proxy.ts:955](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L955)

---

### sawNetworkError

> **sawNetworkError**: `boolean`

Defined in: [types/proxy.ts:956](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L956)

---

### sawTransientFailure

> **sawTransientFailure**: `boolean`

Defined in: [types/proxy.ts:957](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L957)

---

### invalidRequestFailure

> **invalidRequestFailure**: \{ `status`: `number`; `body`: `string`; `contentType?`: `string`; \} \| `null`

Defined in: [types/proxy.ts:958](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L958)

---

### authFailureMessage

> **authFailureMessage**: `string` \| `null`

Defined in: [types/proxy.ts:963](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L963)

---

### authCooldownMessage

> **authCooldownMessage**: `string` \| `null`

Defined in: [types/proxy.ts:964](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L964)

---

### entitlementFailure

> **entitlementFailure**: [`AnthropicEntitlementFailure`](AnthropicEntitlementFailure.md) \| `null`

Defined in: [types/proxy.ts:965](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L965)

---

### scopedExhaustion

> **scopedExhaustion**: [`AnthropicScopedExhaustion`](AnthropicScopedExhaustion.md) \| `null`

Defined in: [types/proxy.ts:966](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L966)

---

### fallbackFailureMessage?

> `optional` **fallbackFailureMessage?**: `string`

Defined in: [types/proxy.ts:967](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L967)

---

### attemptNumber

> **attemptNumber**: `number`

Defined in: [types/proxy.ts:968](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L968)

---

### lastTransportErrorCode?

> `optional` **lastTransportErrorCode?**: `string`

Defined in: [types/proxy.ts:969](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L969)

---

### lastTransportScope?

> `optional` **lastTransportScope?**: [`ProxyNetworkTransportScope`](ProxyNetworkTransportScope.md)

Defined in: [types/proxy.ts:970](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L970)
