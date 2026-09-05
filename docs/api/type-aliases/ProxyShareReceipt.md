[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareReceipt

# Type Alias: ProxyShareReceipt

> **ProxyShareReceipt** = `object`

Defined in: [types/proxy.ts:3794](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3794)

A lender's signed statement that one borrowed request was settled, and for
how much.

`usage` travels with it so the borrower can recompute the charge from the
response it actually received, rather than taking the coin figure on faith.
`sequence` is contiguous per grant, so a withheld receipt shows up as a gap.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:3795](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3795)

---

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:3796](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3796)

---

### sequence

> **sequence**: `number`

Defined in: [types/proxy.ts:3798](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3798)

Monotonic, contiguous, per grant.

---

### settledAt

> **settledAt**: `number`

Defined in: [types/proxy.ts:3799](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3799)

---

### model?

> `optional` **model?**: `string`

Defined in: [types/proxy.ts:3800](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3800)

---

### usage

> **usage**: [`ProxyShareUsage`](ProxyShareUsage.md)

Defined in: [types/proxy.ts:3801](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3801)

---

### coins

> **coins**: `number`

Defined in: [types/proxy.ts:3802](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3802)

---

### balanceAfter

> **balanceAfter**: `number` \| `null`

Defined in: [types/proxy.ts:3804](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3804)

Remaining balance after this charge; null on an unlimited grant.

---

### signature

> **signature**: `string`

Defined in: [types/proxy.ts:3805](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3805)
