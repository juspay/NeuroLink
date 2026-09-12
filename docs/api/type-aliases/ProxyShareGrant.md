[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareGrant

# Type Alias: ProxyShareGrant

> **ProxyShareGrant** = `object`

Defined in: [types/proxy.ts:3667](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3667)

One lender-issued authorization for one borrower.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:3668](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3668)

---

### id

> **id**: `string`

Defined in: [types/proxy.ts:3669](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3669)

---

### peerLabel

> **peerLabel**: `string`

Defined in: [types/proxy.ts:3670](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3670)

---

### tokenHash

> **tokenHash**: `string`

Defined in: [types/proxy.ts:3672](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3672)

sha256(salt + token). The token itself is never persisted.

---

### tokenSalt

> **tokenSalt**: `string`

Defined in: [types/proxy.ts:3673](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3673)

---

### level

> **level**: [`ProxyShareLevel`](ProxyShareLevel.md)

Defined in: [types/proxy.ts:3674](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3674)

---

### state

> **state**: [`ProxyShareGrantState`](ProxyShareGrantState.md)

Defined in: [types/proxy.ts:3675](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3675)

---

### entitlement

> **entitlement**: [`ProxyShareEntitlement`](ProxyShareEntitlement.md)

Defined in: [types/proxy.ts:3676](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3676)

---

### gates

> **gates**: [`ProxyShareGates`](ProxyShareGates.md)

Defined in: [types/proxy.ts:3677](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3677)

---

### createdAt

> **createdAt**: `number`

Defined in: [types/proxy.ts:3678](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3678)

---

### updatedAt

> **updatedAt**: `number`

Defined in: [types/proxy.ts:3679](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3679)

---

### lastUsedAt?

> `optional` **lastUsedAt?**: `number`

Defined in: [types/proxy.ts:3680](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3680)

---

### note?

> `optional` **note?**: `string`

Defined in: [types/proxy.ts:3681](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3681)

---

### leaseSecret?

> `optional` **leaseSecret?**: `string`

Defined in: [types/proxy.ts:3683](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3683)

Complete-mode only: shared secret the lease signature is keyed by.

---

### receiptSecret?

> `optional` **receiptSecret?**: `string`

Defined in: [types/proxy.ts:3689](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3689)

Shared secret receipts and netting claims are keyed by. Minted with the
grant and handed to the borrower in the share link; deliberately survives
`share rotate`, so receipts issued under an old token stay checkable.

---

### nettedCoins?

> `optional` **nettedCoins?**: `number`

Defined in: [types/proxy.ts:3691](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3691)

Cumulative coins forgiven by reciprocal netting on this grant.

---

### provisionedAccount?

> `optional` **provisionedAccount?**: `string`

Defined in: [types/proxy.ts:3693](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3693)

Complete-mode only: which of the lender's own accounts was provisioned.

---

### leasePolicy?

> `optional` **leasePolicy?**: `object`

Defined in: [types/proxy.ts:3695](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3695)

Complete-mode lease shape. Absent means the defaults apply.

#### ttlMs

> **ttlMs**: `number`

#### heartbeatEveryMs

> **heartbeatEveryMs**: `number`

#### offlineGraceMs

> **offlineGraceMs**: `number`
