[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareAuditRecord

# Type Alias: ProxyShareAuditRecord

> **ProxyShareAuditRecord** = `object`

Defined in: [types/proxy.ts:4399](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4399)

Rolling audit state for one complete-mode grant.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4400](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4400)

---

### accountLabel

> **accountLabel**: `string`

Defined in: [types/proxy.ts:4402](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4402)

The lender's own account the credential was provisioned from.

---

### lastObservation?

> `optional` **lastObservation?**: [`ProxyShareAuditObservation`](ProxyShareAuditObservation.md)

Defined in: [types/proxy.ts:4403](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4403)

---

### lenderRequestsTotal?

> `optional` **lenderRequestsTotal?**: `number`

Defined in: [types/proxy.ts:4406](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4406)

Running lifetime total of lender-served requests on the account, kept so
the next observation's delta can be computed.

---

### driftStreak

> **driftStreak**: `number`

Defined in: [types/proxy.ts:4408](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4408)

Consecutive heartbeats where the account moved but nothing was reported.

---

### lastDriftAt?

> `optional` **lastDriftAt?**: `number`

Defined in: [types/proxy.ts:4409](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4409)

---

### lastDriftDetail?

> `optional` **lastDriftDetail?**: `string`

Defined in: [types/proxy.ts:4410](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4410)

---

### autoPausedAt?

> `optional` **autoPausedAt?**: `number`

Defined in: [types/proxy.ts:4412](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4412)

Set once the streak crossed the tolerance and the grant was paused.
