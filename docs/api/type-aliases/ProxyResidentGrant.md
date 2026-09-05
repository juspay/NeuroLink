[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyResidentGrant

# Type Alias: ProxyResidentGrant

> **ProxyResidentGrant** = `object`

Defined in: [types/proxy.ts:4273](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4273)

A credential provisioned onto a borrower's device under a complete grant.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:4274](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4274)

---

### accountLabel

> **accountLabel**: `string`

Defined in: [types/proxy.ts:4276](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4276)

Local tokenStore label, unique on the borrower's device.

---

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4277](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4277)

---

### lenderName

> **lenderName**: `string`

Defined in: [types/proxy.ts:4278](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4278)

---

### lenderUrl

> **lenderUrl**: `string`

Defined in: [types/proxy.ts:4279](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4279)

---

### leaseSecret

> **leaseSecret**: `string`

Defined in: [types/proxy.ts:4281](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4281)

Shared secret used to verify leases from this lender.

---

### lease

> **lease**: [`ProxyShareLease`](ProxyShareLease.md)

Defined in: [types/proxy.ts:4282](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4282)

---

### lastHeartbeatAt?

> `optional` **lastHeartbeatAt?**: `number`

Defined in: [types/proxy.ts:4283](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4283)

---

### unreportedCoins?

> `optional` **unreportedCoins?**: `number`

Defined in: [types/proxy.ts:4285](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4285)

Coins spent since the last successful heartbeat, awaiting report.

---

### unreportedRequests?

> `optional` **unreportedRequests?**: `number`

Defined in: [types/proxy.ts:4286](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4286)
