[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyPeerLimitsSnapshot

# Type Alias: ProxyPeerLimitsSnapshot

> **ProxyPeerLimitsSnapshot** = `object`

Defined in: [types/proxy.ts:4032](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4032)

What `GET /peer/limits` tells a borrower.

Scoped to the caller's own grant on purpose: it carries no account labels and
no per-account figures, so it cannot be used to describe — or count — the
lender's pool. `null` on a slice means no ceiling is configured for that
window, which is different from a ceiling with nothing left.

## Properties

### grantState

> **grantState**: [`ProxyShareGrantState`](ProxyShareGrantState.md)

Defined in: [types/proxy.ts:4033](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4033)

---

### level

> **level**: [`ProxyShareLevel`](ProxyShareLevel.md)

Defined in: [types/proxy.ts:4034](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4034)

---

### ledger

> **ledger**: [`ProxyShareLedgerMode`](ProxyShareLedgerMode.md)

Defined in: [types/proxy.ts:4035](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4035)

---

### remainingCoins?

> `optional` **remainingCoins?**: `number`

Defined in: [types/proxy.ts:4036](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4036)

---

### servable

> **servable**: `boolean`

Defined in: [types/proxy.ts:4038](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4038)

Whether at least one of the lender's accounts can serve this grant now.

---

### withheldReason?

> `optional` **withheldReason?**: [`ProxyShareRefusalReason`](ProxyShareRefusalReason.md)

Defined in: [types/proxy.ts:4039](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4039)

---

### sliceLeftPct

> **sliceLeftPct**: `object`

Defined in: [types/proxy.ts:4040](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4040)

#### session

> **session**: `number` \| `null`

#### weekly

> **weekly**: `number` \| `null`

---

### retryAfterSeconds?

> `optional` **retryAfterSeconds?**: `number`

Defined in: [types/proxy.ts:4044](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4044)
