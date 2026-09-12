[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareNote

# Type Alias: ProxyShareNote

> **ProxyShareNote** = `object`

Defined in: [types/proxy.ts:3953](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3953)

A bearer credit one node issued, which any node holding it may redeem against
the issuer.

Signed by the issuer with a node-level secret, because the grant that
eventually redeems it need not have existed when it was issued.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:3954](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3954)

---

### noteId

> **noteId**: `string`

Defined in: [types/proxy.ts:3955](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3955)

---

### issuer

> **issuer**: `string`

Defined in: [types/proxy.ts:3956](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3956)

---

### coins

> **coins**: `number`

Defined in: [types/proxy.ts:3957](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3957)

---

### issuedAt

> **issuedAt**: `number`

Defined in: [types/proxy.ts:3958](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3958)

---

### notAfter

> **notAfter**: `number`

Defined in: [types/proxy.ts:3959](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3959)

---

### memo?

> `optional` **memo?**: `string`

Defined in: [types/proxy.ts:3960](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3960)

---

### signature

> **signature**: `string`

Defined in: [types/proxy.ts:3961](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3961)
