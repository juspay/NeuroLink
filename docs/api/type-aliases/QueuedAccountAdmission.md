[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / QueuedAccountAdmission

# Type Alias: QueuedAccountAdmission

> **QueuedAccountAdmission** = `object`

Defined in: [types/proxy.ts:1005](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1005)

A cancellable queued request for per-account admission capacity.

## Properties

### accountKey

> **accountKey**: `string`

Defined in: [types/proxy.ts:1006](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1006)

---

### promise

> **promise**: `Promise`\<[`AccountAdmissionLease`](AccountAdmissionLease.md)\>

Defined in: [types/proxy.ts:1007](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1007)

## Methods

### cancel()

> **cancel**(): `void`

Defined in: [types/proxy.ts:1008](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1008)

#### Returns

`void`
