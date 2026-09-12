[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareEntitlement

# Type Alias: ProxyShareEntitlement

> **ProxyShareEntitlement** = `object`

Defined in: [types/proxy.ts:3655](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3655)

## Properties

### ledger

> **ledger**: [`ProxyShareLedgerMode`](ProxyShareLedgerMode.md)

Defined in: [types/proxy.ts:3656](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3656)

---

### coins?

> `optional` **coins?**: `number`

Defined in: [types/proxy.ts:3658](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3658)

Remaining balance when `ledger` is "coins".

---

### refill?

> `optional` **refill?**: `object`

Defined in: [types/proxy.ts:3659](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3659)

#### amount

> **amount**: `number`

#### per

> **per**: [`ProxyShareRefillPeriod`](ProxyShareRefillPeriod.md)

#### lastAt?

> `optional` **lastAt?**: `number`
