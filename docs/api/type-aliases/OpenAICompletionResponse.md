[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / OpenAICompletionResponse

# Type Alias: OpenAICompletionResponse

> **OpenAICompletionResponse** = `object`

Defined in: [types/proxy.ts:3465](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3465)

OpenAI non-streaming response.

## Properties

### id

> **id**: `string`

Defined in: [types/proxy.ts:3466](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3466)

---

### object

> **object**: `"chat.completion"`

Defined in: [types/proxy.ts:3467](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3467)

---

### created

> **created**: `number`

Defined in: [types/proxy.ts:3468](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3468)

---

### model

> **model**: `string`

Defined in: [types/proxy.ts:3469](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3469)

---

### choices

> **choices**: `object`[]

Defined in: [types/proxy.ts:3470](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3470)

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

Defined in: [types/proxy.ts:3479](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3479)
