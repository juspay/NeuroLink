[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AccountAdmissionWaiter

# Type Alias: AccountAdmissionWaiter

> **AccountAdmissionWaiter** = `object`

Defined in: [types/proxy.ts:1012](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1012)

One queued request waiting for per-account admission capacity.

## Properties

### capacity

> **capacity**: `number`

Defined in: [types/proxy.ts:1013](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1013)

---

### resolve

> **resolve**: (`lease`) => `void`

Defined in: [types/proxy.ts:1014](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1014)

#### Parameters

##### lease

[`AccountAdmissionLease`](AccountAdmissionLease.md)

#### Returns

`void`
