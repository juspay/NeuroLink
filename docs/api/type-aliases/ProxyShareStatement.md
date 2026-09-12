[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareStatement

# Type Alias: ProxyShareStatement

> **ProxyShareStatement** = `object`

Defined in: [types/proxy.ts:3916](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3916)

What a borrower makes of the receipts it collected.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:3917](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3917)

---

### receipts

> **receipts**: `number`

Defined in: [types/proxy.ts:3918](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3918)

---

### coins

> **coins**: `number`

Defined in: [types/proxy.ts:3919](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3919)

---

### unverified

> **unverified**: `number`

Defined in: [types/proxy.ts:3921](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3921)

Receipts whose signature did not verify against the shared secret.

---

### miscounted

> **miscounted**: `number`

Defined in: [types/proxy.ts:3923](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3923)

Receipts whose coin figure disagrees with its own usage block.

---

### gaps

> **gaps**: `number`[]

Defined in: [types/proxy.ts:3925](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3925)

Sequence numbers missing from an otherwise contiguous run.

---

### latestSequence

> **latestSequence**: `number`

Defined in: [types/proxy.ts:3926](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3926)
