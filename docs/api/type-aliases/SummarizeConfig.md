[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / SummarizeConfig

# Type Alias: SummarizeConfig

> **SummarizeConfig** = `object`

Defined in: [types/context.ts:1002](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L1002)

Configuration for structured LLM summarization (Stage 3).

## Properties

### provider?

> `optional` **provider?**: `string`

Defined in: [types/context.ts:1003](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L1003)

---

### model?

> `optional` **model?**: `string`

Defined in: [types/context.ts:1004](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L1004)

---

### keepRecentRatio?

> `optional` **keepRecentRatio?**: `number`

Defined in: [types/context.ts:1005](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L1005)

---

### memoryConfig?

> `optional` **memoryConfig?**: `Partial`\<[`ConversationMemoryConfig`](ConversationMemoryConfig.md)\>

Defined in: [types/context.ts:1006](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L1006)

---

### targetTokens?

> `optional` **targetTokens?**: `number`

Defined in: [types/context.ts:1008](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L1008)

Target token budget — when set, split uses token counting instead of message count
