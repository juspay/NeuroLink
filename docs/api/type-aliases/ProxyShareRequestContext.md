[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareRequestContext

# Type Alias: ProxyShareRequestContext

> **ProxyShareRequestContext** = `object`

Defined in: [types/proxy.ts:3672](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3672)

Request-scoped view of the grant serving the current borrowed request.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:3673](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3673)

---

### peerLabel

> **peerLabel**: `string`

Defined in: [types/proxy.ts:3674](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3674)

---

### level

> **level**: [`ProxyShareLevel`](ProxyShareLevel.md)

Defined in: [types/proxy.ts:3675](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3675)

---

### gates

> **gates**: [`ProxyShareGates`](ProxyShareGates.md)

Defined in: [types/proxy.ts:3676](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3676)

---

### ledger

> **ledger**: [`ProxyShareLedgerMode`](ProxyShareLedgerMode.md)

Defined in: [types/proxy.ts:3677](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3677)

---

### holdId?

> `optional` **holdId?**: `string`

Defined in: [types/proxy.ts:3679](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3679)

Pre-authorization opened at admission; settlement closes it.

---

### model?

> `optional` **model?**: `string`

Defined in: [types/proxy.ts:3681](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3681)

Model the borrower asked for, carried so settlement can price it.
