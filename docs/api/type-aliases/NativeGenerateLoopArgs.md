[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / NativeGenerateLoopArgs

# Type Alias: NativeGenerateLoopArgs

> **NativeGenerateLoopArgs** = `object`

Defined in: [types/generate.ts:1783](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1783)

Inputs to the shared native generate loop (`core/nativeGenerateLoop.ts`).
One loop serves every provider whose delegating model exposes a v3-shaped
`doGenerate`; the provider supplies the wire details.

## Properties

### doGenerate

> **doGenerate**: (`options`) => `Promise`\<`Record`\<`string`, `unknown`\>\>

Defined in: [types/generate.ts:1784](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1784)

#### Parameters

##### options

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`Record`\<`string`, `unknown`\>\>

---

### conversation

> **conversation**: `Record`\<`string`, `unknown`\>[]

Defined in: [types/generate.ts:1788](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1788)

Conversation in the message-builder shape each doGenerate converts itself.

---

### tools?

> `optional` **tools?**: `Record`\<`string`, `unknown`\>[]

Defined in: [types/generate.ts:1790](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1790)

Tool declarations in the v3 shape doGenerate already knows how to convert.

---

### toolsRecord

> **toolsRecord**: `Record`\<`string`, `unknown`\>

Defined in: [types/generate.ts:1792](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1792)

Registered tools, used to execute a call the model asks for.

---

### toolChoice?

> `optional` **toolChoice?**: `unknown`

Defined in: [types/generate.ts:1793](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1793)

---

### responseFormat?

> `optional` **responseFormat?**: `Record`\<`string`, `unknown`\>

Defined in: [types/generate.ts:1794](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1794)

---

### providerOptions?

> `optional` **providerOptions?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: [types/generate.ts:1795](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1795)

---

### maxSteps

> **maxSteps**: `number`

Defined in: [types/generate.ts:1796](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1796)

---

### maxOutputTokens?

> `optional` **maxOutputTokens?**: `number`

Defined in: [types/generate.ts:1797](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1797)

---

### temperature?

> `optional` **temperature?**: `number`

Defined in: [types/generate.ts:1798](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1798)

---

### abortSignal?

> `optional` **abortSignal?**: `AbortSignal`

Defined in: [types/generate.ts:1799](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1799)

---

### toolTimeoutMs?

> `optional` **toolTimeoutMs?**: `number` \| `null`

Defined in: [types/generate.ts:1801](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1801)

Per-tool-execution cap, forwarded into `guardToolExecutor`. `null` for no bound.

---

### runStep

> **runStep**: (`call`) => `Promise`\<`Record`\<`string`, `unknown`\>\>

Defined in: [types/generate.ts:1803](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1803)

Wraps one step: retry ladder plus provider error classification.

#### Parameters

##### call

() => `Promise`\<`Record`\<`string`, `unknown`\>\>

#### Returns

`Promise`\<`Record`\<`string`, `unknown`\>\>
