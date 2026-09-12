[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyRequestRoutingSnapshot

# Type Alias: ProxyRequestRoutingSnapshot

> **ProxyRequestRoutingSnapshot** = `object`

Defined in: [types/proxy.ts:3179](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3179)

Routing values captured once when a proxy request begins.

## Properties

### generation

> **generation**: `number`

Defined in: [types/proxy.ts:3180](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3180)

---

### strategy

> **strategy**: [`ProxyStartStrategy`](ProxyStartStrategy.md)

Defined in: [types/proxy.ts:3181](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3181)

---

### modelRouter?

> `optional` **modelRouter?**: [`ModelRouterInterface`](ModelRouterInterface.md)

Defined in: [types/proxy.ts:3182](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3182)

---

### passthrough

> **passthrough**: `boolean`

Defined in: [types/proxy.ts:3183](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3183)

---

### primaryAccountKey?

> `optional` **primaryAccountKey?**: `string`

Defined in: [types/proxy.ts:3184](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3184)

---

### accountAllowlist?

> `optional` **accountAllowlist?**: `ReadonlySet`\<`string`\>

Defined in: [types/proxy.ts:3185](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3185)

---

### quotaRoutingEnabled

> **quotaRoutingEnabled**: `boolean`

Defined in: [types/proxy.ts:3186](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3186)

---

### sessionSoftLimit

> **sessionSoftLimit**: `number`

Defined in: [types/proxy.ts:3187](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3187)

---

### sessionResetToleranceMs

> **sessionResetToleranceMs**: `number`

Defined in: [types/proxy.ts:3188](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3188)

---

### useOverage

> **useOverage**: [`ProxyOveragePolicy`](ProxyOveragePolicy.md)

Defined in: [types/proxy.ts:3191](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3191)

Operator policy on spending paid extra usage once a subscription window is
spent. Only "never" can override the provider's own signal.
