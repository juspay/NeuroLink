[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / OpenAIStreamChunk

# Type Alias: OpenAIStreamChunk

> **OpenAIStreamChunk** = `object`

Defined in: [types/proxy.ts:3483](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3483)

OpenAI streaming chunk.

## Properties

### id

> **id**: `string`

Defined in: [types/proxy.ts:3484](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3484)

---

### object

> **object**: `"chat.completion.chunk"`

Defined in: [types/proxy.ts:3485](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3485)

---

### created

> **created**: `number`

Defined in: [types/proxy.ts:3486](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3486)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:3487](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3487)

---

### choices

> **choices**: `object`[]

Defined in: [types/proxy.ts:3488](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3488)

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

Defined in: [types/proxy.ts:3502](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3502)
