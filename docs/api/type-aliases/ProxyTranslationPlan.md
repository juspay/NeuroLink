[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyTranslationPlan

# Type Alias: ProxyTranslationPlan

> **ProxyTranslationPlan** = `object`

Defined in: [types/proxy.ts:1715](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1715)

Ordered plan of provider attempts for a proxy request.

## Properties

### requestedModel

> **requestedModel**: `string`

Defined in: [types/proxy.ts:1716](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1716)

---

### modelTier

> **modelTier**: [`ClaudeProxyModelTier`](ClaudeProxyModelTier.md)

Defined in: [types/proxy.ts:1717](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1717)

---

### attempts

> **attempts**: [`ProxyTranslationAttempt`](ProxyTranslationAttempt.md)[]

Defined in: [types/proxy.ts:1718](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1718)

---

### skipped

> **skipped**: `never`[]

Defined in: [types/proxy.ts:1719](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1719)
