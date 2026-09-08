[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / NativeGenerateLoopResult

# Type Alias: NativeGenerateLoopResult

> **NativeGenerateLoopResult** = `object`

Defined in: [types/generate.ts:1795](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1795)

## Properties

### text

> **text**: `string`

Defined in: [types/generate.ts:1796](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1796)

---

### reasoning?

> `optional` **reasoning?**: `string`

Defined in: [types/generate.ts:1798](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1798)

Joined reasoning content parts from the final step, when the vendor sent any.

---

### finishReason

> **finishReason**: `string`

Defined in: [types/generate.ts:1799](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1799)

---

### rawFinishReason?

> `optional` **rawFinishReason?**: `string`

Defined in: [types/generate.ts:1800](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1800)

---

### inputTokens

> **inputTokens**: `number`

Defined in: [types/generate.ts:1801](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1801)

---

### outputTokens

> **outputTokens**: `number`

Defined in: [types/generate.ts:1802](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1802)

---

### cacheReadTokens

> **cacheReadTokens**: `number`

Defined in: [types/generate.ts:1803](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1803)

---

### cacheWriteTokens

> **cacheWriteTokens**: `number`

Defined in: [types/generate.ts:1804](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1804)

---

### toolsUsed

> **toolsUsed**: `string`[]

Defined in: [types/generate.ts:1805](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1805)

---

### steps

> **steps**: `number`

Defined in: [types/generate.ts:1806](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L1806)
