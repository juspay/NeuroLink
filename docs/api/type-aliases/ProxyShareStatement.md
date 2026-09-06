[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareStatement

# Type Alias: ProxyShareStatement

> **ProxyShareStatement** = `object`

Defined in: [types/proxy.ts:3910](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3910)

What a borrower makes of the receipts it collected.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:3911](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3911)

---

### receipts

> **receipts**: `number`

Defined in: [types/proxy.ts:3912](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3912)

---

### coins

> **coins**: `number`

Defined in: [types/proxy.ts:3913](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3913)

---

### unverified

> **unverified**: `number`

Defined in: [types/proxy.ts:3915](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3915)

Receipts whose signature did not verify against the shared secret.

---

### miscounted

> **miscounted**: `number`

Defined in: [types/proxy.ts:3917](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3917)

Receipts whose coin figure disagrees with its own usage block.

---

### gaps

> **gaps**: `number`[]

Defined in: [types/proxy.ts:3919](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3919)

Sequence numbers missing from an otherwise contiguous run.

---

### latestSequence

> **latestSequence**: `number`

Defined in: [types/proxy.ts:3920](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3920)
