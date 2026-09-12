[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareWindowObservation

# Type Alias: ProxyShareWindowObservation

> **ProxyShareWindowObservation** = `object`

Defined in: [types/proxy.ts:4149](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4149)

A before/after utilization observation for one borrowed request.

Recorded where the response's quota headers are parsed, because that is the
only point at which both the previous snapshot and the new one are in hand.
Token usage settles separately: on a stream it is not known until
`message_delta`, long after the headers arrived.

## Properties

### grantId

> **grantId**: `string`

Defined in: [types/proxy.ts:4150](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4150)

---

### accountKey

> **accountKey**: `string`

Defined in: [types/proxy.ts:4151](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4151)

---

### sessionBefore?

> `optional` **sessionBefore?**: `number` \| `null`

Defined in: [types/proxy.ts:4152](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4152)

---

### sessionAfter?

> `optional` **sessionAfter?**: `number` \| `null`

Defined in: [types/proxy.ts:4153](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4153)

---

### sessionResetAt?

> `optional` **sessionResetAt?**: `number` \| `null`

Defined in: [types/proxy.ts:4154](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4154)

---

### weeklyBefore?

> `optional` **weeklyBefore?**: `number` \| `null`

Defined in: [types/proxy.ts:4155](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4155)

---

### weeklyAfter?

> `optional` **weeklyAfter?**: `number` \| `null`

Defined in: [types/proxy.ts:4156](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4156)

---

### weeklyResetAt?

> `optional` **weeklyResetAt?**: `number` \| `null`

Defined in: [types/proxy.ts:4157](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4157)
