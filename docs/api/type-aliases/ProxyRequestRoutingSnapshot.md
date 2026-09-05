[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyRequestRoutingSnapshot

# Type Alias: ProxyRequestRoutingSnapshot

> **ProxyRequestRoutingSnapshot** = `object`

Defined in: [types/proxy.ts:3095](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3095)

Routing values captured once when a proxy request begins.

## Properties

### generation

> **generation**: `number`

Defined in: [types/proxy.ts:3096](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3096)

---

### strategy

> **strategy**: [`ProxyStartStrategy`](ProxyStartStrategy.md)

Defined in: [types/proxy.ts:3097](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3097)

---

### modelRouter?

> `optional` **modelRouter?**: [`ModelRouterInterface`](ModelRouterInterface.md)

Defined in: [types/proxy.ts:3098](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3098)

---

### passthrough

> **passthrough**: `boolean`

Defined in: [types/proxy.ts:3099](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3099)

---

### primaryAccountKey?

> `optional` **primaryAccountKey?**: `string`

Defined in: [types/proxy.ts:3100](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3100)

---

### accountAllowlist?

> `optional` **accountAllowlist?**: `ReadonlySet`\<`string`\>

Defined in: [types/proxy.ts:3101](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3101)

---

### quotaRoutingEnabled

> **quotaRoutingEnabled**: `boolean`

Defined in: [types/proxy.ts:3102](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3102)

---

### sessionSoftLimit

> **sessionSoftLimit**: `number`

Defined in: [types/proxy.ts:3103](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3103)

---

### sessionResetToleranceMs

> **sessionResetToleranceMs**: `number`

Defined in: [types/proxy.ts:3104](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3104)

---

### useOverage

> **useOverage**: [`ProxyOveragePolicy`](ProxyOveragePolicy.md)

Defined in: [types/proxy.ts:3107](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3107)

Operator policy on spending paid extra usage once a subscription window is
spent. Only "never" can override the provider's own signal.
