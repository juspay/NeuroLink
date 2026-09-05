[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareLedgerBucket

# Type Alias: ProxyShareLedgerBucket

> **ProxyShareLedgerBucket** = `object`

Defined in: [types/proxy.ts:4021](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4021)

One grant's consumption of one account's current windows.

Keyed by the window's reset timestamp so a reset starts a fresh bucket
automatically — without that, a slice ceiling would latch permanently after
the first busy window.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4022](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4022)

---

### accountKey

> **accountKey**: `string`

Defined in: [types/proxy.ts:4023](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4023)

---

### sessionResetAt

> **sessionResetAt**: `number` \| `null`

Defined in: [types/proxy.ts:4024](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4024)

---

### weeklyResetAt

> **weeklyResetAt**: `number` \| `null`

Defined in: [types/proxy.ts:4025](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4025)

---

### sessionFraction

> **sessionFraction**: `number`

Defined in: [types/proxy.ts:4027](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4027)

Accumulated 5h-window utilization attributable to this grant (0..1).

---

### weeklyFraction

> **weeklyFraction**: `number`

Defined in: [types/proxy.ts:4029](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4029)

Accumulated 7d-window utilization attributable to this grant (0..1).

---

### coinsSpent

> **coinsSpent**: `number`

Defined in: [types/proxy.ts:4030](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4030)

---

### requests

> **requests**: `number`

Defined in: [types/proxy.ts:4031](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4031)

---

### updatedAt

> **updatedAt**: `number`

Defined in: [types/proxy.ts:4032](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4032)
