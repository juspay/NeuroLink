[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / QueuedAccountAdmission

# Type Alias: QueuedAccountAdmission

> **QueuedAccountAdmission** = `object`

Defined in: [types/proxy.ts:1001](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1001)

A cancellable queued request for per-account admission capacity.

## Properties

### accountKey

> **accountKey**: `string`

Defined in: [types/proxy.ts:1002](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1002)

---

### promise

> **promise**: `Promise`\<[`AccountAdmissionLease`](AccountAdmissionLease.md)\>

Defined in: [types/proxy.ts:1003](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1003)

## Methods

### cancel()

> **cancel**(): `void`

Defined in: [types/proxy.ts:1004](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1004)

#### Returns

`void`
