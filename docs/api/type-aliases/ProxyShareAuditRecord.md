[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareAuditRecord

# Type Alias: ProxyShareAuditRecord

> **ProxyShareAuditRecord** = `object`

Defined in: [types/proxy.ts:4405](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4405)

Rolling audit state for one complete-mode grant.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4406](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4406)

---

### accountLabel

> **accountLabel**: `string`

Defined in: [types/proxy.ts:4408](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4408)

The lender's own account the credential was provisioned from.

---

### lastObservation?

> `optional` **lastObservation?**: [`ProxyShareAuditObservation`](ProxyShareAuditObservation.md)

Defined in: [types/proxy.ts:4409](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4409)

---

### lenderRequestsTotal?

> `optional` **lenderRequestsTotal?**: `number`

Defined in: [types/proxy.ts:4412](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4412)

Running lifetime total of lender-served requests on the account, kept so
the next observation's delta can be computed.

---

### driftStreak

> **driftStreak**: `number`

Defined in: [types/proxy.ts:4414](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4414)

Consecutive heartbeats where the account moved but nothing was reported.

---

### lastDriftAt?

> `optional` **lastDriftAt?**: `number`

Defined in: [types/proxy.ts:4415](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4415)

---

### lastDriftDetail?

> `optional` **lastDriftDetail?**: `string`

Defined in: [types/proxy.ts:4416](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4416)

---

### autoPausedAt?

> `optional` **autoPausedAt?**: `number`

Defined in: [types/proxy.ts:4418](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4418)

Set once the streak crossed the tolerance and the grant was paused.
