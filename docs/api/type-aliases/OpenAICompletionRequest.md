[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / OpenAICompletionRequest

# Type Alias: OpenAICompletionRequest

> **OpenAICompletionRequest** = `object`

Defined in: [types/proxy.ts:3438](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3438)

OpenAI Chat Completions request body.

## Properties

### model

> **model**: `string`

Defined in: [types/proxy.ts:3439](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3439)

---

### messages

> **messages**: [`OpenAIMessage`](OpenAIMessage.md)[]

Defined in: [types/proxy.ts:3440](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3440)

---

### tools?

> `optional` **tools?**: [`OpenAIToolDef`](OpenAIToolDef.md)[]

Defined in: [types/proxy.ts:3441](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3441)

---

### tool_choice?

> `optional` **tool_choice?**: [`OpenAIToolChoice`](OpenAIToolChoice.md)

Defined in: [types/proxy.ts:3442](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3442)

---

### stream?

> `optional` **stream?**: `boolean`

Defined in: [types/proxy.ts:3443](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3443)

---

### temperature?

> `optional` **temperature?**: `number`

Defined in: [types/proxy.ts:3444](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3444)

---

### top_p?

> `optional` **top_p?**: `number`

Defined in: [types/proxy.ts:3445](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3445)

---

### max_tokens?

> `optional` **max_tokens?**: `number`

Defined in: [types/proxy.ts:3446](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3446)

---

### max_completion_tokens?

> `optional` **max_completion_tokens?**: `number`

Defined in: [types/proxy.ts:3447](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3447)

---

### stop?

> `optional` **stop?**: `string` \| `string`[]

Defined in: [types/proxy.ts:3448](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3448)

---

### n?

> `optional` **n?**: `number`

Defined in: [types/proxy.ts:3449](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3449)

---

### response_format?

> `optional` **response_format?**: `object`

Defined in: [types/proxy.ts:3450](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3450)

#### type

> **type**: `"text"` \| `"json_object"` \| `"json_schema"`

#### json_schema?

> `optional` **json_schema?**: `unknown`

---

### stream_options?

> `optional` **stream_options?**: `object`

Defined in: [types/proxy.ts:3454](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3454)

#### include_usage?

> `optional` **include_usage?**: `boolean`
