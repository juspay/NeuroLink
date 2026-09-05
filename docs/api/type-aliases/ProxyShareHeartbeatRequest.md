[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareHeartbeatRequest

# Type Alias: ProxyShareHeartbeatRequest

> **ProxyShareHeartbeatRequest** = `object`

Defined in: [types/proxy.ts:4246](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4246)

What a borrower sends when checking in.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4247](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4247)

---

### coinsSpent?

> `optional` **coinsSpent?**: `number`

Defined in: [types/proxy.ts:4249](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4249)

Coins the borrower believes it has spent since the last heartbeat.

---

### requests?

> `optional` **requests?**: `number`

Defined in: [types/proxy.ts:4250](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4250)

---

### reportedAt

> **reportedAt**: `number`

Defined in: [types/proxy.ts:4252](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4252)

Borrower's clock, for drift diagnostics only.
