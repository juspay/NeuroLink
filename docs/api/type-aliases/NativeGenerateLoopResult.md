[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / NativeGenerateLoopResult

# Type Alias: NativeGenerateLoopResult

> **NativeGenerateLoopResult** = `object`

Defined in: [types/generate.ts:1808](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1808)

## Properties

### text

> **text**: `string`

Defined in: [types/generate.ts:1809](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1809)

---

### reasoning?

> `optional` **reasoning?**: `string`

Defined in: [types/generate.ts:1811](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1811)

Joined reasoning content parts from the final step, when the vendor sent any.

---

### finishReason

> **finishReason**: `string`

Defined in: [types/generate.ts:1812](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1812)

---

### rawFinishReason?

> `optional` **rawFinishReason?**: `string`

Defined in: [types/generate.ts:1813](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1813)

---

### inputTokens

> **inputTokens**: `number`

Defined in: [types/generate.ts:1814](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1814)

---

### outputTokens

> **outputTokens**: `number`

Defined in: [types/generate.ts:1815](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1815)

---

### cacheReadTokens

> **cacheReadTokens**: `number`

Defined in: [types/generate.ts:1816](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1816)

---

### cacheWriteTokens

> **cacheWriteTokens**: `number`

Defined in: [types/generate.ts:1817](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1817)

---

### toolsUsed

> **toolsUsed**: `string`[]

Defined in: [types/generate.ts:1818](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1818)

---

### steps

> **steps**: `number`

Defined in: [types/generate.ts:1819](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1819)
