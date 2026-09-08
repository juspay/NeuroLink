[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProviderStatus

# Type Alias: ProviderStatus

> **ProviderStatus** = `object`

Defined in: [types/providers.ts:103](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L103)

Provider status information

## Properties

### provider

> **provider**: `string`

Defined in: [types/providers.ts:104](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L104)

---

### status

> **status**: `"working"` \| `"failed"` \| `"not-configured"`

Defined in: [types/providers.ts:105](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L105)

---

### configured

> **configured**: `boolean`

Defined in: [types/providers.ts:106](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L106)

---

### authenticated

> **authenticated**: `boolean`

Defined in: [types/providers.ts:107](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L107)

---

### error?

> `optional` **error?**: `string`

Defined in: [types/providers.ts:108](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L108)

---

### responseTime?

> `optional` **responseTime?**: `number`

Defined in: [types/providers.ts:109](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L109)

---

### model?

> `optional` **model?**: `string`

Defined in: [types/providers.ts:110](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L110)

---

### subscription?

> `optional` **subscription?**: [`SubscriptionInfo`](SubscriptionInfo.md)

Defined in: [types/providers.ts:115](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L115)

Subscription information for providers that support subscription tiers
(e.g., Anthropic Claude with Pro/Max/Team/Enterprise subscriptions)

---

### authMethod?

> `optional` **authMethod?**: [`AnthropicAuthMethod`](AnthropicAuthMethod.md)

Defined in: [types/providers.ts:119](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L119)

The authentication method currently in use for this provider
