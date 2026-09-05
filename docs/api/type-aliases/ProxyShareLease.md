[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareLease

# Type Alias: ProxyShareLease

> **ProxyShareLease** = `object`

Defined in: [types/proxy.ts:4211](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4211)

The offline-survivable projection of a grant.

A complete-mode borrower holds a credential on the lender's account and calls
the upstream directly, so the lender's gate is not in the request path. The
lease is what control looks like without that gate: the borrower enforces it
locally, refreshes it by heartbeat, and stops when it can no longer prove the
lender still consents.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:4212](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4212)

---

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4213](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4213)

---

### peerLabel

> **peerLabel**: `string`

Defined in: [types/proxy.ts:4214](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4214)

---

### issuedAt

> **issuedAt**: `number`

Defined in: [types/proxy.ts:4215](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4215)

---

### notAfter

> **notAfter**: `number`

Defined in: [types/proxy.ts:4217](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4217)

Hard stop, honored even by a borrower that never calls home again.

---

### heartbeatEveryMs

> **heartbeatEveryMs**: `number`

Defined in: [types/proxy.ts:4219](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4219)

How often the borrower should check in.

---

### offlineGraceMs

> **offlineGraceMs**: `number`

Defined in: [types/proxy.ts:4221](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4221)

How long the borrower may keep serving while the lender is unreachable.

---

### gates

> **gates**: [`ProxyShareGates`](ProxyShareGates.md)

Defined in: [types/proxy.ts:4223](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4223)

The gate set, snapshotted at issue time.

---

### entitlementSnapshot

> **entitlementSnapshot**: `number` \| `"unlimited"`

Defined in: [types/proxy.ts:4225](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4225)

Coin balance at issue time; "unlimited" for an uncapped grant.

---

### signature

> **signature**: `string`

Defined in: [types/proxy.ts:4227](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4227)

HMAC over the payload, keyed by the grant's lease secret.
