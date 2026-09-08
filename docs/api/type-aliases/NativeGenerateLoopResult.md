[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / NativeGenerateLoopResult

# Type Alias: NativeGenerateLoopResult

> **NativeGenerateLoopResult** = `object`

Defined in: [types/generate.ts:1806](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1806)

## Properties

### text

> **text**: `string`

Defined in: [types/generate.ts:1807](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1807)

---

### reasoning?

> `optional` **reasoning?**: `string`

Defined in: [types/generate.ts:1809](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1809)

Joined reasoning content parts from the final step, when the vendor sent any.

---

### finishReason

> **finishReason**: `string`

Defined in: [types/generate.ts:1810](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1810)

---

### rawFinishReason?

> `optional` **rawFinishReason?**: `string`

Defined in: [types/generate.ts:1811](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1811)

---

### inputTokens

> **inputTokens**: `number`

Defined in: [types/generate.ts:1812](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1812)

---

### outputTokens

> **outputTokens**: `number`

Defined in: [types/generate.ts:1813](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1813)

---

### cacheReadTokens

> **cacheReadTokens**: `number`

Defined in: [types/generate.ts:1814](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1814)

---

### cacheWriteTokens

> **cacheWriteTokens**: `number`

Defined in: [types/generate.ts:1815](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1815)

---

### toolsUsed

> **toolsUsed**: `string`[]

Defined in: [types/generate.ts:1816](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1816)

---

### steps

> **steps**: `number`

Defined in: [types/generate.ts:1817](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1817)
