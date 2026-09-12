[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareLease

# Type Alias: ProxyShareLease

> **ProxyShareLease** = `object`

Defined in: [types/proxy.ts:4295](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4295)

The offline-survivable projection of a grant.

A complete-mode borrower holds a credential on the lender's account and calls
the upstream directly, so the lender's gate is not in the request path. The
lease is what control looks like without that gate: the borrower enforces it
locally, refreshes it by heartbeat, and stops when it can no longer prove the
lender still consents.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:4296](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4296)

---

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4297](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4297)

---

### peerLabel

> **peerLabel**: `string`

Defined in: [types/proxy.ts:4298](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4298)

---

### issuedAt

> **issuedAt**: `number`

Defined in: [types/proxy.ts:4299](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4299)

---

### notAfter

> **notAfter**: `number`

Defined in: [types/proxy.ts:4301](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4301)

Hard stop, honored even by a borrower that never calls home again.

---

### heartbeatEveryMs

> **heartbeatEveryMs**: `number`

Defined in: [types/proxy.ts:4303](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4303)

How often the borrower should check in.

---

### offlineGraceMs

> **offlineGraceMs**: `number`

Defined in: [types/proxy.ts:4305](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4305)

How long the borrower may keep serving while the lender is unreachable.

---

### gates

> **gates**: [`ProxyShareGates`](ProxyShareGates.md)

Defined in: [types/proxy.ts:4307](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4307)

The gate set, snapshotted at issue time.

---

### entitlementSnapshot

> **entitlementSnapshot**: `number` \| `"unlimited"`

Defined in: [types/proxy.ts:4309](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4309)

Coin balance at issue time; "unlimited" for an uncapped grant.

---

### signature

> **signature**: `string`

Defined in: [types/proxy.ts:4311](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4311)

HMAC over the payload, keyed by the grant's lease secret.
