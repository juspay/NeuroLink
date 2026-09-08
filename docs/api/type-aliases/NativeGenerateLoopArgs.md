[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / NativeGenerateLoopArgs

# Type Alias: NativeGenerateLoopArgs

> **NativeGenerateLoopArgs** = `object`

Defined in: [types/generate.ts:1770](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1770)

Inputs to the shared native generate loop (`core/nativeGenerateLoop.ts`).
One loop serves every provider whose delegating model exposes a v3-shaped
`doGenerate`; the provider supplies the wire details.

## Properties

### doGenerate

> **doGenerate**: (`options`) => `Promise`\<`Record`\<`string`, `unknown`\>\>

Defined in: [types/generate.ts:1771](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1771)

#### Parameters

##### options

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`Record`\<`string`, `unknown`\>\>

---

### conversation

> **conversation**: `Record`\<`string`, `unknown`\>[]

Defined in: [types/generate.ts:1775](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1775)

Conversation in the message-builder shape each doGenerate converts itself.

---

### tools?

> `optional` **tools?**: `Record`\<`string`, `unknown`\>[]

Defined in: [types/generate.ts:1777](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1777)

Tool declarations in the v3 shape doGenerate already knows how to convert.

---

### toolsRecord

> **toolsRecord**: `Record`\<`string`, `unknown`\>

Defined in: [types/generate.ts:1779](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1779)

Registered tools, used to execute a call the model asks for.

---

### toolChoice?

> `optional` **toolChoice?**: `unknown`

Defined in: [types/generate.ts:1780](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1780)

---

### responseFormat?

> `optional` **responseFormat?**: `Record`\<`string`, `unknown`\>

Defined in: [types/generate.ts:1781](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1781)

---

### providerOptions?

> `optional` **providerOptions?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: [types/generate.ts:1782](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1782)

---

### maxSteps

> **maxSteps**: `number`

Defined in: [types/generate.ts:1783](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1783)

---

### maxOutputTokens?

> `optional` **maxOutputTokens?**: `number`

Defined in: [types/generate.ts:1784](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1784)

---

### temperature?

> `optional` **temperature?**: `number`

Defined in: [types/generate.ts:1785](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1785)

---

### abortSignal?

> `optional` **abortSignal?**: `AbortSignal`

Defined in: [types/generate.ts:1786](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1786)

---

### toolTimeoutMs?

> `optional` **toolTimeoutMs?**: `number`

Defined in: [types/generate.ts:1788](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1788)

Per-tool-execution cap, forwarded into `guardToolExecutor`.

---

### runStep

> **runStep**: (`call`) => `Promise`\<`Record`\<`string`, `unknown`\>\>

Defined in: [types/generate.ts:1790](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1790)

Wraps one step: retry ladder plus provider error classification.

#### Parameters

##### call

() => `Promise`\<`Record`\<`string`, `unknown`\>\>

#### Returns

`Promise`\<`Record`\<`string`, `unknown`\>\>
