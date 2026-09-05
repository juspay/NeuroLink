[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AccountAdmissionWaiter

# Type Alias: AccountAdmissionWaiter

> **AccountAdmissionWaiter** = `object`

Defined in: [types/proxy.ts:989](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L989)

One queued request waiting for per-account admission capacity.

## Properties

### capacity

> **capacity**: `number`

Defined in: [types/proxy.ts:990](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L990)

---

### resolve

> **resolve**: (`lease`) => `void`

Defined in: [types/proxy.ts:991](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L991)

#### Parameters

##### lease

[`AccountAdmissionLease`](AccountAdmissionLease.md)

#### Returns

`void`
