[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AgenticLoopStepResult

# Type Alias: AgenticLoopStepResult\<TRaw\>

> **AgenticLoopStepResult**\<`TRaw`\> = `object`

Defined in: [types/loopEngine.ts:56](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L56)

## Type Parameters

### TRaw

`TRaw` = `unknown`

## Properties

### text

> **text**: `string`

Defined in: [types/loopEngine.ts:57](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L57)

---

### reasoning?

> `optional` **reasoning?**: `string`

Defined in: [types/loopEngine.ts:58](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L58)

---

### toolCalls

> **toolCalls**: [`AgenticLoopToolCall`](AgenticLoopToolCall.md)[]

Defined in: [types/loopEngine.ts:59](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L59)

---

### usage

> **usage**: [`AgenticLoopUsage`](AgenticLoopUsage.md)

Defined in: [types/loopEngine.ts:60](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L60)

---

### rawStopReason

> **rawStopReason**: `string` \| `undefined`

Defined in: [types/loopEngine.ts:62](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L62)

Provider's own raw stop/finish-reason string, e.g. "tool_use", "MAX_TOKENS"

---

### raw

> **raw**: `TRaw`

Defined in: [types/loopEngine.ts:65](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L65)

Adapter-private accumulated response data needed by buildToolResultMessages
(e.g. Anthropic's ordered content blocks, Gemini's rawResponseParts).
