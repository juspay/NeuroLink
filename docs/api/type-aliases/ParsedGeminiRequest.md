[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ParsedGeminiRequest

# Type Alias: ParsedGeminiRequest

> **ParsedGeminiRequest** = `object`

Defined in: [types/proxy.ts:3520](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3520)

A Gemini `generateContent` request, reduced to what translation needs.

Google's shape differs from both others in three ways that matter here:
roles are `user`/`model` rather than `user`/`assistant`, the system prompt
lives in a sibling `systemInstruction` rather than in the turn list, and
generation settings are nested under `generationConfig` instead of sitting
at the top level.

## Properties

### model

> **model**: `string`

Defined in: [types/proxy.ts:3521](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3521)

---

### maxTokens?

> `optional` **maxTokens?**: `number`

Defined in: [types/proxy.ts:3522](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3522)

---

### temperature?

> `optional` **temperature?**: `number`

Defined in: [types/proxy.ts:3523](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3523)

---

### topP?

> `optional` **topP?**: `number`

Defined in: [types/proxy.ts:3524](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3524)

---

### systemPrompt?

> `optional` **systemPrompt?**: `string`

Defined in: [types/proxy.ts:3525](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3525)

---

### stream

> **stream**: `boolean`

Defined in: [types/proxy.ts:3526](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3526)

---

### prompt

> **prompt**: `string`

Defined in: [types/proxy.ts:3527](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3527)

---

### images

> **images**: `string`[]

Defined in: [types/proxy.ts:3528](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3528)

---

### conversationMessages

> **conversationMessages**: `object`[]

Defined in: [types/proxy.ts:3529](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3529)

#### role

> **role**: `string`

#### content

> **content**: `string`

---

### tools

> **tools**: `Record`\<`string`, \{ `description?`: `string`; `inputSchema`: `unknown`; `execute?`: (...`args`) => `unknown`; \}\>

Defined in: [types/proxy.ts:3530](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3530)

---

### stopSequences?

> `optional` **stopSequences?**: `string`[]

Defined in: [types/proxy.ts:3538](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3538)
