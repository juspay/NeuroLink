[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ParsedGeminiRequest

# Type Alias: ParsedGeminiRequest

> **ParsedGeminiRequest** = `object`

Defined in: [types/proxy.ts:3526](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3526)

A Gemini `generateContent` request, reduced to what translation needs.

Google's shape differs from both others in three ways that matter here:
roles are `user`/`model` rather than `user`/`assistant`, the system prompt
lives in a sibling `systemInstruction` rather than in the turn list, and
generation settings are nested under `generationConfig` instead of sitting
at the top level.

## Properties

### model

> **model**: `string`

Defined in: [types/proxy.ts:3527](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3527)

---

### maxTokens?

> `optional` **maxTokens?**: `number`

Defined in: [types/proxy.ts:3528](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3528)

---

### temperature?

> `optional` **temperature?**: `number`

Defined in: [types/proxy.ts:3529](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3529)

---

### topP?

> `optional` **topP?**: `number`

Defined in: [types/proxy.ts:3530](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3530)

---

### systemPrompt?

> `optional` **systemPrompt?**: `string`

Defined in: [types/proxy.ts:3531](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3531)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:3532](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3532)

---

### prompt

> **prompt**: `string`

Defined in: [types/proxy.ts:3533](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3533)

---

### images

> **images**: `string`[]

Defined in: [types/proxy.ts:3534](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3534)

---

### conversationMessages

> **conversationMessages**: `object`[]

Defined in: [types/proxy.ts:3535](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3535)

#### role

> **role**: `string`

#### content

> **content**: `string`

---

### tools

> **tools**: `Record`\<`string`, \{ `description?`: `string`; `inputSchema`: `unknown`; `execute?`: (...`args`) => `unknown`; \}\>

Defined in: [types/proxy.ts:3536](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3536)

---

### stopSequences?

> `optional` **stopSequences?**: `string`[]

Defined in: [types/proxy.ts:3544](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3544)
