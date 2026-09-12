[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareProvisioningBundle

# Type Alias: ProxyShareProvisioningBundle

> **ProxyShareProvisioningBundle** = `object`

Defined in: [types/proxy.ts:4438](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4438)

The handover artifact a lender gives a complete-share borrower.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:4439](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4439)

---

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4440](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4440)

---

### lenderName

> **lenderName**: `string`

Defined in: [types/proxy.ts:4441](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4441)

---

### lenderUrl

> **lenderUrl**: `string`

Defined in: [types/proxy.ts:4442](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4442)

---

### accountLabel

> **accountLabel**: `string`

Defined in: [types/proxy.ts:4443](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4443)

---

### leaseSecret

> **leaseSecret**: `string`

Defined in: [types/proxy.ts:4444](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4444)

---

### lease

> **lease**: [`ProxyShareLease`](ProxyShareLease.md)

Defined in: [types/proxy.ts:4445](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4445)

---

### tokens

> **tokens**: `object`

Defined in: [types/proxy.ts:4446](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4446)

#### accessToken

> **accessToken**: `string`

#### refreshToken?

> `optional` **refreshToken?**: `string`

#### expiresAt?

> `optional` **expiresAt?**: `number`
