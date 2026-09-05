[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / OpenAICompletionRequest

# Type Alias: OpenAICompletionRequest

> **OpenAICompletionRequest** = `object`

Defined in: [types/proxy.ts:3354](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3354)

OpenAI Chat Completions request body.

## Properties

### model

> **model**: `string`

Defined in: [types/proxy.ts:3355](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3355)

---

### messages

> **messages**: [`OpenAIMessage`](OpenAIMessage.md)[]

Defined in: [types/proxy.ts:3356](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3356)

---

### tools?

> `optional` **tools?**: [`OpenAIToolDef`](OpenAIToolDef.md)[]

Defined in: [types/proxy.ts:3357](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3357)

---

### tool_choice?

> `optional` **tool_choice?**: [`OpenAIToolChoice`](OpenAIToolChoice.md)

Defined in: [types/proxy.ts:3358](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3358)

---

### stream?

> `optional` **stream?**: `boolean`

Defined in: [types/proxy.ts:3359](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3359)

---

### temperature?

> `optional` **temperature?**: `number`

Defined in: [types/proxy.ts:3360](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3360)

---

### top_p?

> `optional` **top_p?**: `number`

Defined in: [types/proxy.ts:3361](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3361)

---

### max_tokens?

> `optional` **max_tokens?**: `number`

Defined in: [types/proxy.ts:3362](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3362)

---

### max_completion_tokens?

> `optional` **max_completion_tokens?**: `number`

Defined in: [types/proxy.ts:3363](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3363)

---

### stop?

> `optional` **stop?**: `string` \| `string`[]

Defined in: [types/proxy.ts:3364](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3364)

---

### n?

> `optional` **n?**: `number`

Defined in: [types/proxy.ts:3365](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3365)

---

### response_format?

> `optional` **response_format?**: `object`

Defined in: [types/proxy.ts:3366](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3366)

#### type

> **type**: `"text"` \| `"json_object"` \| `"json_schema"`

#### json_schema?

> `optional` **json_schema?**: `unknown`

---

### stream_options?

> `optional` **stream_options?**: `object`

Defined in: [types/proxy.ts:3370](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3370)

#### include_usage?

> `optional` **include_usage?**: `boolean`
