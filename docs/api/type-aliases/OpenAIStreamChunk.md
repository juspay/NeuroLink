[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / OpenAIStreamChunk

# Type Alias: OpenAIStreamChunk

> **OpenAIStreamChunk** = `object`

Defined in: [types/proxy.ts:3399](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3399)

OpenAI streaming chunk.

## Properties

### id

> **id**: `string`

Defined in: [types/proxy.ts:3400](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3400)

---

### object

> **object**: `"chat.completion.chunk"`

Defined in: [types/proxy.ts:3401](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3401)

---

### created

> **created**: `number`

Defined in: [types/proxy.ts:3402](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3402)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:3403](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3403)

---

### choices

> **choices**: `object`[]

Defined in: [types/proxy.ts:3404](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3404)

#### index

> **index**: `number`

#### delta

> **delta**: `object`

##### delta.role?

> `optional` **role?**: `"assistant"`

##### delta.content?

> `optional` **content?**: `string`

##### delta.tool_calls?

> `optional` **tool_calls?**: `object`[]

#### finish_reason

> **finish_reason**: `string` \| `null`

---

### usage?

> `optional` **usage?**: [`OpenAIUsage`](OpenAIUsage.md)

Defined in: [types/proxy.ts:3418](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3418)
