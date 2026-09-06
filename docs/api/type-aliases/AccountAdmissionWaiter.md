[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AccountAdmissionWaiter

# Type Alias: AccountAdmissionWaiter

> **AccountAdmissionWaiter** = `object`

Defined in: [types/proxy.ts:1008](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1008)

One queued request waiting for per-account admission capacity.

## Properties

### capacity

> **capacity**: `number`

Defined in: [types/proxy.ts:1009](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1009)

---

### resolve

> **resolve**: (`lease`) => `void`

Defined in: [types/proxy.ts:1010](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1010)

#### Parameters

##### lease

[`AccountAdmissionLease`](AccountAdmissionLease.md)

#### Returns

`void`
