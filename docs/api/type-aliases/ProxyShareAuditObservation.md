[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareAuditObservation

# Type Alias: ProxyShareAuditObservation

> **ProxyShareAuditObservation** = `object`

Defined in: [types/proxy.ts:4390](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4390)

One heartbeat's worth of evidence about a complete-mode grant.

The lender cannot see a resident credential's requests — they never touch this
node. What it _can_ see is the account's own utilization, which the provider
reports and the borrower cannot influence. Pairing that with what the borrower
claimed to spend is the whole audit.

## Properties

### at

> **at**: `number`

Defined in: [types/proxy.ts:4391](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4391)

---

### sessionUsed

> **sessionUsed**: `number` \| `null`

Defined in: [types/proxy.ts:4393](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4393)

0..1 utilization of the account's 5h window at this heartbeat.

---

### weeklyUsed

> **weeklyUsed**: `number` \| `null`

Defined in: [types/proxy.ts:4395](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4395)

0..1 utilization of the account's 7d window at this heartbeat.

---

### reportedCoins

> **reportedCoins**: `number`

Defined in: [types/proxy.ts:4397](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4397)

Coins the borrower reported since the previous heartbeat.

---

### lenderRequests

> **lenderRequests**: `number`

Defined in: [types/proxy.ts:4401](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4401)

Requests this node itself served on the account **since the previous
observation**. A per-interval delta, not a running total: the drift check
asks whether the lender used the account during this interval.
