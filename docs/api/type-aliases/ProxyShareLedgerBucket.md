[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareLedgerBucket

# Type Alias: ProxyShareLedgerBucket

> **ProxyShareLedgerBucket** = `object`

Defined in: [types/proxy.ts:4105](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4105)

One grant's consumption of one account's current windows.

Keyed by the window's reset timestamp so a reset starts a fresh bucket
automatically — without that, a slice ceiling would latch permanently after
the first busy window.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4106](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4106)

---

### accountKey

> **accountKey**: `string`

Defined in: [types/proxy.ts:4107](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4107)

---

### sessionResetAt

> **sessionResetAt**: `number` \| `null`

Defined in: [types/proxy.ts:4108](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4108)

---

### weeklyResetAt

> **weeklyResetAt**: `number` \| `null`

Defined in: [types/proxy.ts:4109](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4109)

---

### sessionFraction

> **sessionFraction**: `number`

Defined in: [types/proxy.ts:4111](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4111)

Accumulated 5h-window utilization attributable to this grant (0..1).

---

### weeklyFraction

> **weeklyFraction**: `number`

Defined in: [types/proxy.ts:4113](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4113)

Accumulated 7d-window utilization attributable to this grant (0..1).

---

### coinsSpent

> **coinsSpent**: `number`

Defined in: [types/proxy.ts:4114](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4114)

---

### requests

> **requests**: `number`

Defined in: [types/proxy.ts:4115](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4115)

---

### updatedAt

> **updatedAt**: `number`

Defined in: [types/proxy.ts:4116](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4116)
