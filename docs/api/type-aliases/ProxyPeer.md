[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyPeer

# Type Alias: ProxyPeer

> **ProxyPeer** = `object`

Defined in: [types/proxy.ts:4192](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4192)

A lender this node may borrow from.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:4193](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4193)

---

### name

> **name**: `string`

Defined in: [types/proxy.ts:4194](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4194)

---

### url

> **url**: `string`

Defined in: [types/proxy.ts:4195](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4195)

---

### token

> **token**: `string`

Defined in: [types/proxy.ts:4196](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4196)

---

### priority

> **priority**: `number`

Defined in: [types/proxy.ts:4198](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4198)

Lower is tried first. Peers of equal priority keep insertion order.

---

### enabled

> **enabled**: `boolean`

Defined in: [types/proxy.ts:4199](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4199)

---

### createdAt

> **createdAt**: `number`

Defined in: [types/proxy.ts:4200](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4200)

---

### updatedAt

> **updatedAt**: `number`

Defined in: [types/proxy.ts:4201](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4201)

---

### note?

> `optional` **note?**: `string`

Defined in: [types/proxy.ts:4202](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4202)

---

### lastUsedAt?

> `optional` **lastUsedAt?**: `number`

Defined in: [types/proxy.ts:4203](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4203)

---

### cooldownUntil?

> `optional` **cooldownUntil?**: `number`

Defined in: [types/proxy.ts:4204](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4204)

---

### cooldownReason?

> `optional` **cooldownReason?**: [`ProxyPeerCooldownReason`](ProxyPeerCooldownReason.md)

Defined in: [types/proxy.ts:4205](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4205)

---

### lastObservation?

> `optional` **lastObservation?**: [`ProxyPeerObservation`](ProxyPeerObservation.md)

Defined in: [types/proxy.ts:4206](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4206)

---

### pendingProvision?

> `optional` **pendingProvision?**: [`ProxyPeerPendingProvision`](ProxyPeerPendingProvision.md)

Defined in: [types/proxy.ts:4208](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4208)

Set while a split-PKCE provisioning request is outstanding.

---

### receiptSecret?

> `optional` **receiptSecret?**: `string`

Defined in: [types/proxy.ts:4210](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4210)

Shared secret this lender's receipts are signed with, when known.

---

### reciprocalPeer?

> `optional` **reciprocalPeer?**: `string`

Defined in: [types/proxy.ts:4212](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4212)

Label of the grant this node issued to the same person, for netting.

---

### lastReceiptSequence?

> `optional` **lastReceiptSequence?**: `number`

Defined in: [types/proxy.ts:4214](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4214)

Highest receipt sequence collected from this lender.
