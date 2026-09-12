[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareAdmissionInput

# Type Alias: ProxyShareAdmissionInput

> **ProxyShareAdmissionInput** = `object`

Defined in: [types/proxy.ts:3799](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3799)

Everything `evaluateShareAdmission` needs. Pure input — no I/O.

## Properties

### grant

> **grant**: [`ProxyShareGrant`](ProxyShareGrant.md)

Defined in: [types/proxy.ts:3800](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3800)

---

### now

> **now**: `number`

Defined in: [types/proxy.ts:3801](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3801)

---

### model?

> `optional` **model?**: `string`

Defined in: [types/proxy.ts:3803](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3803)

Requested model, used against the model allowlist.

---

### counters

> **counters**: [`ProxyShareRuntimeCounters`](ProxyShareRuntimeCounters.md)

Defined in: [types/proxy.ts:3804](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3804)

---

### coinBalance?

> `optional` **coinBalance?**: `number`

Defined in: [types/proxy.ts:3806](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3806)

Remaining coins; omitted for an unlimited grant.
