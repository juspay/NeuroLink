[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyPeer

# Type Alias: ProxyPeer

> **ProxyPeer** = `object`

Defined in: [types/proxy.ts:4108](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4108)

A lender this node may borrow from.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:4109](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4109)

---

### name

> **name**: `string`

Defined in: [types/proxy.ts:4110](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4110)

---

### url

> **url**: `string`

Defined in: [types/proxy.ts:4111](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4111)

---

### token

> **token**: `string`

Defined in: [types/proxy.ts:4112](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4112)

---

### priority

> **priority**: `number`

Defined in: [types/proxy.ts:4114](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4114)

Lower is tried first. Peers of equal priority keep insertion order.

---

### enabled

> **enabled**: `boolean`

Defined in: [types/proxy.ts:4115](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4115)

---

### createdAt

> **createdAt**: `number`

Defined in: [types/proxy.ts:4116](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4116)

---

### updatedAt

> **updatedAt**: `number`

Defined in: [types/proxy.ts:4117](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4117)

---

### note?

> `optional` **note?**: `string`

Defined in: [types/proxy.ts:4118](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4118)

---

### lastUsedAt?

> `optional` **lastUsedAt?**: `number`

Defined in: [types/proxy.ts:4119](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4119)

---

### cooldownUntil?

> `optional` **cooldownUntil?**: `number`

Defined in: [types/proxy.ts:4120](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4120)

---

### cooldownReason?

> `optional` **cooldownReason?**: [`ProxyPeerCooldownReason`](ProxyPeerCooldownReason.md)

Defined in: [types/proxy.ts:4121](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4121)

---

### lastObservation?

> `optional` **lastObservation?**: [`ProxyPeerObservation`](ProxyPeerObservation.md)

Defined in: [types/proxy.ts:4122](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4122)

---

### pendingProvision?

> `optional` **pendingProvision?**: [`ProxyPeerPendingProvision`](ProxyPeerPendingProvision.md)

Defined in: [types/proxy.ts:4124](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4124)

Set while a split-PKCE provisioning request is outstanding.

---

### receiptSecret?

> `optional` **receiptSecret?**: `string`

Defined in: [types/proxy.ts:4126](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4126)

Shared secret this lender's receipts are signed with, when known.

---

### reciprocalPeer?

> `optional` **reciprocalPeer?**: `string`

Defined in: [types/proxy.ts:4128](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4128)

Label of the grant this node issued to the same person, for netting.

---

### lastReceiptSequence?

> `optional` **lastReceiptSequence?**: `number`

Defined in: [types/proxy.ts:4130](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4130)

Highest receipt sequence collected from this lender.
