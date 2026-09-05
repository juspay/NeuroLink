[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareGrant

# Type Alias: ProxyShareGrant

> **ProxyShareGrant** = `object`

Defined in: [types/proxy.ts:3583](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3583)

One lender-issued authorization for one borrower.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:3584](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3584)

---

### id

> **id**: `string`

Defined in: [types/proxy.ts:3585](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3585)

---

### peerLabel

> **peerLabel**: `string`

Defined in: [types/proxy.ts:3586](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3586)

---

### tokenHash

> **tokenHash**: `string`

Defined in: [types/proxy.ts:3588](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3588)

sha256(salt + token). The token itself is never persisted.

---

### tokenSalt

> **tokenSalt**: `string`

Defined in: [types/proxy.ts:3589](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3589)

---

### level

> **level**: [`ProxyShareLevel`](ProxyShareLevel.md)

Defined in: [types/proxy.ts:3590](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3590)

---

### state

> **state**: [`ProxyShareGrantState`](ProxyShareGrantState.md)

Defined in: [types/proxy.ts:3591](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3591)

---

### entitlement

> **entitlement**: [`ProxyShareEntitlement`](ProxyShareEntitlement.md)

Defined in: [types/proxy.ts:3592](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3592)

---

### gates

> **gates**: [`ProxyShareGates`](ProxyShareGates.md)

Defined in: [types/proxy.ts:3593](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3593)

---

### createdAt

> **createdAt**: `number`

Defined in: [types/proxy.ts:3594](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3594)

---

### updatedAt

> **updatedAt**: `number`

Defined in: [types/proxy.ts:3595](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3595)

---

### lastUsedAt?

> `optional` **lastUsedAt?**: `number`

Defined in: [types/proxy.ts:3596](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3596)

---

### note?

> `optional` **note?**: `string`

Defined in: [types/proxy.ts:3597](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3597)

---

### leaseSecret?

> `optional` **leaseSecret?**: `string`

Defined in: [types/proxy.ts:3599](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3599)

Complete-mode only: shared secret the lease signature is keyed by.

---

### receiptSecret?

> `optional` **receiptSecret?**: `string`

Defined in: [types/proxy.ts:3605](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3605)

Shared secret receipts and netting claims are keyed by. Minted with the
grant and handed to the borrower in the share link; deliberately survives
`share rotate`, so receipts issued under an old token stay checkable.

---

### nettedCoins?

> `optional` **nettedCoins?**: `number`

Defined in: [types/proxy.ts:3607](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3607)

Cumulative coins forgiven by reciprocal netting on this grant.

---

### provisionedAccount?

> `optional` **provisionedAccount?**: `string`

Defined in: [types/proxy.ts:3609](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3609)

Complete-mode only: which of the lender's own accounts was provisioned.

---

### leasePolicy?

> `optional` **leasePolicy?**: `object`

Defined in: [types/proxy.ts:3611](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3611)

Complete-mode lease shape. Absent means the defaults apply.

#### ttlMs

> **ttlMs**: `number`

#### heartbeatEveryMs

> **heartbeatEveryMs**: `number`

#### offlineGraceMs

> **offlineGraceMs**: `number`
