[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareAuditRecord

# Type Alias: ProxyShareAuditRecord

> **ProxyShareAuditRecord** = `object`

Defined in: [types/proxy.ts:4321](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4321)

Rolling audit state for one complete-mode grant.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4322](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4322)

---

### accountLabel

> **accountLabel**: `string`

Defined in: [types/proxy.ts:4324](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4324)

The lender's own account the credential was provisioned from.

---

### lastObservation?

> `optional` **lastObservation?**: [`ProxyShareAuditObservation`](ProxyShareAuditObservation.md)

Defined in: [types/proxy.ts:4325](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4325)

---

### lenderRequestsTotal?

> `optional` **lenderRequestsTotal?**: `number`

Defined in: [types/proxy.ts:4328](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4328)

Running lifetime total of lender-served requests on the account, kept so
the next observation's delta can be computed.

---

### driftStreak

> **driftStreak**: `number`

Defined in: [types/proxy.ts:4330](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4330)

Consecutive heartbeats where the account moved but nothing was reported.

---

### lastDriftAt?

> `optional` **lastDriftAt?**: `number`

Defined in: [types/proxy.ts:4331](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4331)

---

### lastDriftDetail?

> `optional` **lastDriftDetail?**: `string`

Defined in: [types/proxy.ts:4332](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4332)

---

### autoPausedAt?

> `optional` **autoPausedAt?**: `number`

Defined in: [types/proxy.ts:4334](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4334)

Set once the streak crossed the tolerance and the grant was paused.
