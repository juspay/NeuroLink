[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareProvisioningBundle

# Type Alias: ProxyShareProvisioningBundle

> **ProxyShareProvisioningBundle** = `object`

Defined in: [types/proxy.ts:4432](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4432)

The handover artifact a lender gives a complete-share borrower.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:4433](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4433)

---

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4434](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4434)

---

### lenderName

> **lenderName**: `string`

Defined in: [types/proxy.ts:4435](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4435)

---

### lenderUrl

> **lenderUrl**: `string`

Defined in: [types/proxy.ts:4436](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4436)

---

### accountLabel

> **accountLabel**: `string`

Defined in: [types/proxy.ts:4437](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4437)

---

### leaseSecret

> **leaseSecret**: `string`

Defined in: [types/proxy.ts:4438](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4438)

---

### lease

> **lease**: [`ProxyShareLease`](ProxyShareLease.md)

Defined in: [types/proxy.ts:4439](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4439)

---

### tokens

> **tokens**: `object`

Defined in: [types/proxy.ts:4440](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4440)

#### accessToken

> **accessToken**: `string`

#### refreshToken?

> `optional` **refreshToken?**: `string`

#### expiresAt?

> `optional` **expiresAt?**: `number`
