[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyResidentGrant

# Type Alias: ProxyResidentGrant

> **ProxyResidentGrant** = `object`

Defined in: [types/proxy.ts:4357](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4357)

A credential provisioned onto a borrower's device under a complete grant.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:4358](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4358)

---

### accountLabel

> **accountLabel**: `string`

Defined in: [types/proxy.ts:4360](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4360)

Local tokenStore label, unique on the borrower's device.

---

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4361](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4361)

---

### lenderName

> **lenderName**: `string`

Defined in: [types/proxy.ts:4362](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4362)

---

### lenderUrl

> **lenderUrl**: `string`

Defined in: [types/proxy.ts:4363](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4363)

---

### leaseSecret

> **leaseSecret**: `string`

Defined in: [types/proxy.ts:4365](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4365)

Shared secret used to verify leases from this lender.

---

### lease

> **lease**: [`ProxyShareLease`](ProxyShareLease.md)

Defined in: [types/proxy.ts:4366](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4366)

---

### lastHeartbeatAt?

> `optional` **lastHeartbeatAt?**: `number`

Defined in: [types/proxy.ts:4367](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4367)

---

### unreportedCoins?

> `optional` **unreportedCoins?**: `number`

Defined in: [types/proxy.ts:4369](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4369)

Coins spent since the last successful heartbeat, awaiting report.

---

### unreportedRequests?

> `optional` **unreportedRequests?**: `number`

Defined in: [types/proxy.ts:4370](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4370)
