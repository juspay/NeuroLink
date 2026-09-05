[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ParsedGeminiRequest

# Type Alias: ParsedGeminiRequest

> **ParsedGeminiRequest** = `object`

Defined in: [types/proxy.ts:3442](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3442)

A Gemini `generateContent` request, reduced to what translation needs.

Google's shape differs from both others in three ways that matter here:
roles are `user`/`model` rather than `user`/`assistant`, the system prompt
lives in a sibling `systemInstruction` rather than in the turn list, and
generation settings are nested under `generationConfig` instead of sitting
at the top level.

## Properties

### model

> **model**: `string`

Defined in: [types/proxy.ts:3443](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3443)

---

### maxTokens?

> `optional` **maxTokens?**: `number`

Defined in: [types/proxy.ts:3444](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3444)

---

### temperature?

> `optional` **temperature?**: `number`

Defined in: [types/proxy.ts:3445](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3445)

---

### topP?

> `optional` **topP?**: `number`

Defined in: [types/proxy.ts:3446](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3446)

---

### systemPrompt?

> `optional` **systemPrompt?**: `string`

Defined in: [types/proxy.ts:3447](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3447)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:3448](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3448)

---

### prompt

> **prompt**: `string`

Defined in: [types/proxy.ts:3449](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3449)

---

### images

> **images**: `string`[]

Defined in: [types/proxy.ts:3450](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3450)

---

### conversationMessages

> **conversationMessages**: `object`[]

Defined in: [types/proxy.ts:3451](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3451)

#### role

> **role**: `string`

#### content

> **content**: `string`

---

### tools

> **tools**: `Record`\<`string`, \{ `description?`: `string`; `inputSchema`: `unknown`; `execute?`: (...`args`) => `unknown`; \}\>

Defined in: [types/proxy.ts:3452](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3452)

---

### stopSequences?

> `optional` **stopSequences?**: `string`[]

Defined in: [types/proxy.ts:3460](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3460)
