[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareHeartbeatRequest

# Type Alias: ProxyShareHeartbeatRequest

> **ProxyShareHeartbeatRequest** = `object`

Defined in: [types/proxy.ts:4330](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4330)

What a borrower sends when checking in.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4331](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4331)

---

### coinsSpent?

> `optional` **coinsSpent?**: `number`

Defined in: [types/proxy.ts:4333](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4333)

Coins the borrower believes it has spent since the last heartbeat.

---

### requests?

> `optional` **requests?**: `number`

Defined in: [types/proxy.ts:4334](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4334)

---

### reportedAt

> **reportedAt**: `number`

Defined in: [types/proxy.ts:4336](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4336)

Borrower's clock, for drift diagnostics only.
