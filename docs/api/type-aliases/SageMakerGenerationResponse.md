[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / SageMakerGenerationResponse

# Type Alias: SageMakerGenerationResponse

> **SageMakerGenerationResponse** = `object`

Defined in: [types/providers.ts:1685](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1685)

Generation response from SageMaker

## Properties

### text

> **text**: `string`

Defined in: [types/providers.ts:1687](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1687)

Generated text content

---

### usage

> **usage**: [`SageMakerUsage`](SageMakerUsage.md)

Defined in: [types/providers.ts:1689](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1689)

Token usage information

---

### finishReason

> **finishReason**: `"stop"` \| `"length"` \| `"tool-calls"` \| `"content-filter"` \| `"unknown"`

Defined in: [types/providers.ts:1691](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1691)

Finish reason for generation

---

### toolCalls?

> `optional` **toolCalls?**: [`SageMakerToolCall`](SageMakerToolCall.md)[]

Defined in: [types/providers.ts:1693](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1693)

Tool calls made during generation

---

### toolResults?

> `optional` **toolResults?**: [`SageMakerToolResult`](SageMakerToolResult.md)[]

Defined in: [types/providers.ts:1695](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1695)

Tool results if tools were executed

---

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [types/providers.ts:1697](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1697)

Additional metadata

---

### modelVersion?

> `optional` **modelVersion?**: `string`

Defined in: [types/providers.ts:1699](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L1699)

Model version or identifier
