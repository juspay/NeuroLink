[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareRequestContext

# Type Alias: ProxyShareRequestContext

> **ProxyShareRequestContext** = `object`

Defined in: [types/proxy.ts:3750](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3750)

Request-scoped view of the grant serving the current borrowed request.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:3751](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3751)

---

### peerLabel

> **peerLabel**: `string`

Defined in: [types/proxy.ts:3752](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3752)

---

### level

> **level**: [`ProxyShareLevel`](ProxyShareLevel.md)

Defined in: [types/proxy.ts:3753](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3753)

---

### gates

> **gates**: [`ProxyShareGates`](ProxyShareGates.md)

Defined in: [types/proxy.ts:3754](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3754)

---

### ledger

> **ledger**: [`ProxyShareLedgerMode`](ProxyShareLedgerMode.md)

Defined in: [types/proxy.ts:3755](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3755)

---

### holdId?

> `optional` **holdId?**: `string`

Defined in: [types/proxy.ts:3757](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3757)

Pre-authorization opened at admission; settlement closes it.

---

### model?

> `optional` **model?**: `string`

Defined in: [types/proxy.ts:3759](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3759)

Model the borrower asked for, carried so settlement can price it.
