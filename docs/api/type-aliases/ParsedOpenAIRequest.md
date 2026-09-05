[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ParsedOpenAIRequest

# Type Alias: ParsedOpenAIRequest

> **ParsedOpenAIRequest** = `object`

Defined in: [types/proxy.ts:3463](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3463)

## Properties

### model

> **model**: `string`

Defined in: [types/proxy.ts:3464](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3464)

---

### maxTokens?

> `optional` **maxTokens?**: `number`

Defined in: [types/proxy.ts:3465](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3465)

---

### temperature?

> `optional` **temperature?**: `number`

Defined in: [types/proxy.ts:3466](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3466)

---

### topP?

> `optional` **topP?**: `number`

Defined in: [types/proxy.ts:3467](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3467)

---

### systemPrompt?

> `optional` **systemPrompt?**: `string`

Defined in: [types/proxy.ts:3468](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3468)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:3469](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3469)

---

### prompt

> **prompt**: `string`

Defined in: [types/proxy.ts:3470](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3470)

---

### images

> **images**: `string`[]

Defined in: [types/proxy.ts:3471](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3471)

---

### conversationMessages

> **conversationMessages**: `object`[]

Defined in: [types/proxy.ts:3472](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3472)

#### role

> **role**: `string`

#### content

> **content**: `string`

---

### tools

> **tools**: `Record`\<`string`, \{ `description?`: `string`; `inputSchema`: `unknown`; `execute?`: (...`args`) => `unknown`; \}\>

Defined in: [types/proxy.ts:3473](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3473)

---

### toolChoice?

> `optional` **toolChoice?**: `"auto"` \| `"required"` \| `"none"`

Defined in: [types/proxy.ts:3481](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3481)

---

### toolChoiceName?

> `optional` **toolChoiceName?**: `string`

Defined in: [types/proxy.ts:3482](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3482)

---

### stopSequences?

> `optional` **stopSequences?**: `string`[]

Defined in: [types/proxy.ts:3483](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3483)

---

### responseFormat?

> `optional` **responseFormat?**: `object`

Defined in: [types/proxy.ts:3484](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3484)

#### type

> **type**: `string`

#### jsonSchema?

> `optional` **jsonSchema?**: `unknown`
