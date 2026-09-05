[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareNote

# Type Alias: ProxyShareNote

> **ProxyShareNote** = `object`

Defined in: [types/proxy.ts:3869](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3869)

A bearer credit one node issued, which any node holding it may redeem against
the issuer.

Signed by the issuer with a node-level secret, because the grant that
eventually redeems it need not have existed when it was issued.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:3870](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3870)

---

### noteId

> **noteId**: `string`

Defined in: [types/proxy.ts:3871](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3871)

---

### issuer

> **issuer**: `string`

Defined in: [types/proxy.ts:3872](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3872)

---

### coins

> **coins**: `number`

Defined in: [types/proxy.ts:3873](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3873)

---

### issuedAt

> **issuedAt**: `number`

Defined in: [types/proxy.ts:3874](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3874)

---

### notAfter

> **notAfter**: `number`

Defined in: [types/proxy.ts:3875](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3875)

---

### memo?

> `optional` **memo?**: `string`

Defined in: [types/proxy.ts:3876](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3876)

---

### signature

> **signature**: `string`

Defined in: [types/proxy.ts:3877](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3877)
