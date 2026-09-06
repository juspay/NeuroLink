[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareAdmissionInput

# Type Alias: ProxyShareAdmissionInput

> **ProxyShareAdmissionInput** = `object`

Defined in: [types/proxy.ts:3793](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3793)

Everything `evaluateShareAdmission` needs. Pure input — no I/O.

## Properties

### grant

> **grant**: [`ProxyShareGrant`](ProxyShareGrant.md)

Defined in: [types/proxy.ts:3794](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3794)

---

### now

> **now**: `number`

Defined in: [types/proxy.ts:3795](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3795)

---

### model?

> `optional` **model?**: `string`

Defined in: [types/proxy.ts:3797](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3797)

Requested model, used against the model allowlist.

---

### counters

> **counters**: [`ProxyShareRuntimeCounters`](ProxyShareRuntimeCounters.md)

Defined in: [types/proxy.ts:3798](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3798)

---

### coinBalance?

> `optional` **coinBalance?**: `number`

Defined in: [types/proxy.ts:3800](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3800)

Remaining coins; omitted for an unlimited grant.
