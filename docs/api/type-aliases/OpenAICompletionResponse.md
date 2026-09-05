[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / OpenAICompletionResponse

# Type Alias: OpenAICompletionResponse

> **OpenAICompletionResponse** = `object`

Defined in: [types/proxy.ts:3381](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3381)

OpenAI non-streaming response.

## Properties

### id

> **id**: `string`

Defined in: [types/proxy.ts:3382](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3382)

---

### object

> **object**: `"chat.completion"`

Defined in: [types/proxy.ts:3383](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3383)

---

### created

> **created**: `number`

Defined in: [types/proxy.ts:3384](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3384)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:3385](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3385)

---

### choices

> **choices**: `object`[]

Defined in: [types/proxy.ts:3386](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3386)

#### index

> **index**: `number`

#### message

> **message**: `object`

##### message.role

> **role**: `"assistant"`

##### message.content

> **content**: `string` \| `null`

##### message.tool_calls?

> `optional` **tool_calls?**: [`OpenAIToolCall`](OpenAIToolCall.md)[]

#### finish_reason

> **finish_reason**: `"stop"` \| `"tool_calls"` \| `"length"` \| `"content_filter"` \| `null`

---

### usage

> **usage**: [`OpenAIUsage`](OpenAIUsage.md)

Defined in: [types/proxy.ts:3395](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3395)
