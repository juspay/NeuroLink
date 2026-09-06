[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ParsedOpenAIRequest

# Type Alias: ParsedOpenAIRequest

> **ParsedOpenAIRequest** = `object`

Defined in: [types/proxy.ts:3541](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3541)

## Properties

### model

> **model**: `string`

Defined in: [types/proxy.ts:3542](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3542)

---

### maxTokens?

> `optional` **maxTokens?**: `number`

Defined in: [types/proxy.ts:3543](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3543)

---

### temperature?

> `optional` **temperature?**: `number`

Defined in: [types/proxy.ts:3544](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3544)

---

### topP?

> `optional` **topP?**: `number`

Defined in: [types/proxy.ts:3545](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3545)

---

### systemPrompt?

> `optional` **systemPrompt?**: `string`

Defined in: [types/proxy.ts:3546](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3546)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:3547](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3547)

---

### prompt

> **prompt**: `string`

Defined in: [types/proxy.ts:3548](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3548)

---

### images

> **images**: `string`[]

Defined in: [types/proxy.ts:3549](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3549)

---

### conversationMessages

> **conversationMessages**: `object`[]

Defined in: [types/proxy.ts:3550](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3550)

#### role

> **role**: `string`

#### content

> **content**: `string`

---

### tools

> **tools**: `Record`\<`string`, \{ `description?`: `string`; `inputSchema`: `unknown`; `execute?`: (...`args`) => `unknown`; \}\>

Defined in: [types/proxy.ts:3551](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3551)

---

### toolChoice?

> `optional` **toolChoice?**: `"auto"` \| `"required"` \| `"none"`

Defined in: [types/proxy.ts:3559](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3559)

---

### toolChoiceName?

> `optional` **toolChoiceName?**: `string`

Defined in: [types/proxy.ts:3560](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3560)

---

### stopSequences?

> `optional` **stopSequences?**: `string`[]

Defined in: [types/proxy.ts:3561](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3561)

---

### responseFormat?

> `optional` **responseFormat?**: `object`

Defined in: [types/proxy.ts:3562](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3562)

#### type

> **type**: `string`

#### jsonSchema?

> `optional` **jsonSchema?**: `unknown`
