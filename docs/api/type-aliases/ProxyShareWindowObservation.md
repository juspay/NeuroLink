[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareWindowObservation

# Type Alias: ProxyShareWindowObservation

> **ProxyShareWindowObservation** = `object`

Defined in: [types/proxy.ts:4065](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4065)

A before/after utilization observation for one borrowed request.

Recorded where the response's quota headers are parsed, because that is the
only point at which both the previous snapshot and the new one are in hand.
Token usage settles separately: on a stream it is not known until
`message_delta`, long after the headers arrived.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4066](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4066)

---

### accountKey

> **accountKey**: `string`

Defined in: [types/proxy.ts:4067](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4067)

---

### sessionBefore?

> `optional` **sessionBefore?**: `number` \| `null`

Defined in: [types/proxy.ts:4068](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4068)

---

### sessionAfter?

> `optional` **sessionAfter?**: `number` \| `null`

Defined in: [types/proxy.ts:4069](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4069)

---

### sessionResetAt?

> `optional` **sessionResetAt?**: `number` \| `null`

Defined in: [types/proxy.ts:4070](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4070)

---

### weeklyBefore?

> `optional` **weeklyBefore?**: `number` \| `null`

Defined in: [types/proxy.ts:4071](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4071)

---

### weeklyAfter?

> `optional` **weeklyAfter?**: `number` \| `null`

Defined in: [types/proxy.ts:4072](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4072)

---

### weeklyResetAt?

> `optional` **weeklyResetAt?**: `number` \| `null`

Defined in: [types/proxy.ts:4073](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4073)
