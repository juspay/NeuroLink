[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareHeartbeatRequest

# Type Alias: ProxyShareHeartbeatRequest

> **ProxyShareHeartbeatRequest** = `object`

Defined in: [types/proxy.ts:4324](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4324)

What a borrower sends when checking in.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4325](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4325)

---

### coinsSpent?

> `optional` **coinsSpent?**: `number`

Defined in: [types/proxy.ts:4327](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4327)

Coins the borrower believes it has spent since the last heartbeat.

---

### requests?

> `optional` **requests?**: `number`

Defined in: [types/proxy.ts:4328](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4328)

---

### reportedAt

> **reportedAt**: `number`

Defined in: [types/proxy.ts:4330](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4330)

Borrower's clock, for drift diagnostics only.
