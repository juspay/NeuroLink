[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / QueuedAccountAdmission

# Type Alias: QueuedAccountAdmission

> **QueuedAccountAdmission** = `object`

Defined in: [types/proxy.ts:982](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L982)

A cancellable queued request for per-account admission capacity.

## Properties

### accountKey

> **accountKey**: `string`

Defined in: [types/proxy.ts:983](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L983)

---

### promise

> **promise**: `Promise`\<[`AccountAdmissionLease`](AccountAdmissionLease.md)\>

Defined in: [types/proxy.ts:984](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L984)

## Methods

### cancel()

> **cancel**(): `void`

Defined in: [types/proxy.ts:985](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L985)

#### Returns

`void`
