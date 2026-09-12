[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareRequestContext

# Type Alias: ProxyShareRequestContext

> **ProxyShareRequestContext** = `object`

Defined in: [types/proxy.ts:3756](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3756)

Request-scoped view of the grant serving the current borrowed request.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:3757](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3757)

---

### peerLabel

> **peerLabel**: `string`

Defined in: [types/proxy.ts:3758](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3758)

---

### level

> **level**: [`ProxyShareLevel`](ProxyShareLevel.md)

Defined in: [types/proxy.ts:3759](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3759)

---

### gates

> **gates**: [`ProxyShareGates`](ProxyShareGates.md)

Defined in: [types/proxy.ts:3760](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3760)

---

### ledger

> **ledger**: [`ProxyShareLedgerMode`](ProxyShareLedgerMode.md)

Defined in: [types/proxy.ts:3761](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3761)

---

### holdId?

> `optional` **holdId?**: `string`

Defined in: [types/proxy.ts:3763](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3763)

Pre-authorization opened at admission; settlement closes it.

---

### model?

> `optional` **model?**: `string`

Defined in: [types/proxy.ts:3765](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3765)

Model the borrower asked for, carried so settlement can price it.
