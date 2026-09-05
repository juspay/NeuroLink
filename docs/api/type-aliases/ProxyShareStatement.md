[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareStatement

# Type Alias: ProxyShareStatement

> **ProxyShareStatement** = `object`

Defined in: [types/proxy.ts:3832](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3832)

What a borrower makes of the receipts it collected.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:3833](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3833)

---

### receipts

> **receipts**: `number`

Defined in: [types/proxy.ts:3834](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3834)

---

### coins

> **coins**: `number`

Defined in: [types/proxy.ts:3835](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3835)

---

### unverified

> **unverified**: `number`

Defined in: [types/proxy.ts:3837](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3837)

Receipts whose signature did not verify against the shared secret.

---

### miscounted

> **miscounted**: `number`

Defined in: [types/proxy.ts:3839](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3839)

Receipts whose coin figure disagrees with its own usage block.

---

### gaps

> **gaps**: `number`[]

Defined in: [types/proxy.ts:3841](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3841)

Sequence numbers missing from an otherwise contiguous run.

---

### latestSequence

> **latestSequence**: `number`

Defined in: [types/proxy.ts:3842](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3842)
