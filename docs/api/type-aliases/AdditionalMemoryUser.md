[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AdditionalMemoryUser

# Type Alias: AdditionalMemoryUser

> **AdditionalMemoryUser** = `object`

Defined in: [types/generate.ts:850](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L850)

Represents an additional user whose memory should be included in a generate/stream call.
Allows per-user prompt overrides for different memory condensation strategies
(e.g. personal preferences vs org-level policies).

## Properties

### userId

> **userId**: `string`

Defined in: [types/generate.ts:852](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L852)

The user/owner ID to retrieve or store memory for.

---

### label?

> `optional` **label?**: `string`

Defined in: [types/generate.ts:858](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L858)

Human-readable label used in the formatted memory context.
E.g. "Organization Policy", "Team Context", "User Preferences".
If not provided, defaults to userId.

---

### read?

> `optional` **read?**: `boolean`

Defined in: [types/generate.ts:860](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L860)

Whether to read this user's memory and include in context. Defaults to true.

---

### write?

> `optional` **write?**: `boolean`

Defined in: [types/generate.ts:862](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L862)

Whether to write conversation into this user's memory. Defaults to true.

---

### prompt?

> `optional` **prompt?**: `string`

Defined in: [types/generate.ts:864](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L864)

Custom condensation prompt for this user. Overrides the default Hippocampus prompt.

---

### maxWords?

> `optional` **maxWords?**: `number`

Defined in: [types/generate.ts:866](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L866)

Max words for this user's condensed memory. Overrides the default maxWords.
