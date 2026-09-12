[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ParsedOpenAIRequest

# Type Alias: ParsedOpenAIRequest

> **ParsedOpenAIRequest** = `object`

Defined in: [types/proxy.ts:3547](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3547)

## Properties

### model

> **model**: `string`

Defined in: [types/proxy.ts:3548](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3548)

---

### maxTokens?

> `optional` **maxTokens?**: `number`

Defined in: [types/proxy.ts:3549](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3549)

---

### temperature?

> `optional` **temperature?**: `number`

Defined in: [types/proxy.ts:3550](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3550)

---

### topP?

> `optional` **topP?**: `number`

Defined in: [types/proxy.ts:3551](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3551)

---

### systemPrompt?

> `optional` **systemPrompt?**: `string`

Defined in: [types/proxy.ts:3552](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3552)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:3553](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3553)

---

### prompt

> **prompt**: `string`

Defined in: [types/proxy.ts:3554](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3554)

---

### images

> **images**: `string`[]

Defined in: [types/proxy.ts:3555](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3555)

---

### conversationMessages

> **conversationMessages**: `object`[]

Defined in: [types/proxy.ts:3556](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3556)

#### role

> **role**: `string`

#### content

> **content**: `string`

---

### tools

> **tools**: `Record`\<`string`, \{ `description?`: `string`; `inputSchema`: `unknown`; `execute?`: (...`args`) => `unknown`; \}\>

Defined in: [types/proxy.ts:3557](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3557)

---

### toolChoice?

> `optional` **toolChoice?**: `"auto"` \| `"required"` \| `"none"`

Defined in: [types/proxy.ts:3565](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3565)

---

### toolChoiceName?

> `optional` **toolChoiceName?**: `string`

Defined in: [types/proxy.ts:3566](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3566)

---

### stopSequences?

> `optional` **stopSequences?**: `string`[]

Defined in: [types/proxy.ts:3567](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3567)

---

### responseFormat?

> `optional` **responseFormat?**: `object`

Defined in: [types/proxy.ts:3568](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3568)

#### type

> **type**: `string`

#### jsonSchema?

> `optional` **jsonSchema?**: `unknown`
