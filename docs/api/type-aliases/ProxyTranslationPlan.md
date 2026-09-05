[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyTranslationPlan

# Type Alias: ProxyTranslationPlan

> **ProxyTranslationPlan** = `object`

Defined in: [types/proxy.ts:1692](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1692)

Ordered plan of provider attempts for a proxy request.

## Properties

### requestedModel

> **requestedModel**: `string`

Defined in: [types/proxy.ts:1693](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1693)

---

### modelTier

> **modelTier**: [`ClaudeProxyModelTier`](ClaudeProxyModelTier.md)

Defined in: [types/proxy.ts:1694](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1694)

---

### attempts

> **attempts**: [`ProxyTranslationAttempt`](ProxyTranslationAttempt.md)[]

Defined in: [types/proxy.ts:1695](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1695)

---

### skipped

> **skipped**: `never`[]

Defined in: [types/proxy.ts:1696](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1696)
