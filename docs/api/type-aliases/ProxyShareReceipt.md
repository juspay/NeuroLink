[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareReceipt

# Type Alias: ProxyShareReceipt

> **ProxyShareReceipt** = `object`

Defined in: [types/proxy.ts:3878](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3878)

A lender's signed statement that one borrowed request was settled, and for
how much.

`usage` travels with it so the borrower can recompute the charge from the
response it actually received, rather than taking the coin figure on faith.
`sequence` is contiguous per grant, so a withheld receipt shows up as a gap.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:3879](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3879)

---

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:3880](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3880)

---

### sequence

> **sequence**: `number`

Defined in: [types/proxy.ts:3882](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3882)

Monotonic, contiguous, per grant.

---

### settledAt

> **settledAt**: `number`

Defined in: [types/proxy.ts:3883](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3883)

---

### model?

> `optional` **model?**: `string`

Defined in: [types/proxy.ts:3884](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3884)

---

### usage

> **usage**: [`ProxyShareUsage`](ProxyShareUsage.md)

Defined in: [types/proxy.ts:3885](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3885)

---

### coins

> **coins**: `number`

Defined in: [types/proxy.ts:3886](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3886)

---

### balanceAfter

> **balanceAfter**: `number` \| `null`

Defined in: [types/proxy.ts:3888](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3888)

Remaining balance after this charge; null on an unlimited grant.

---

### signature

> **signature**: `string`

Defined in: [types/proxy.ts:3889](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3889)
