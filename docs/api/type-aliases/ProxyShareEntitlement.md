[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareEntitlement

# Type Alias: ProxyShareEntitlement

> **ProxyShareEntitlement** = `object`

Defined in: [types/proxy.ts:3571](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3571)

## Properties

### ledger

> **ledger**: [`ProxyShareLedgerMode`](ProxyShareLedgerMode.md)

Defined in: [types/proxy.ts:3572](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3572)

---

### coins?

> `optional` **coins?**: `number`

Defined in: [types/proxy.ts:3574](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3574)

Remaining balance when `ledger` is "coins".

---

### refill?

> `optional` **refill?**: `object`

Defined in: [types/proxy.ts:3575](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3575)

#### amount

> **amount**: `number`

#### per

> **per**: [`ProxyShareRefillPeriod`](ProxyShareRefillPeriod.md)

#### lastAt?

> `optional` **lastAt?**: `number`
