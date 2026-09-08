[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / SummarizationPromptOptions

# Type Alias: SummarizationPromptOptions

> **SummarizationPromptOptions** = `object`

Defined in: [types/context.ts:942](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L942)

Options for summarization prompt building.

## Properties

### isIncremental

> **isIncremental**: `boolean`

Defined in: [types/context.ts:946](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L946)

Whether this is an incremental update to an existing summary

---

### previousSummary?

> `optional` **previousSummary?**: `string`

Defined in: [types/context.ts:951](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L951)

The previous summary to merge with (required for incremental mode)

---

### filesRead?

> `optional` **filesRead?**: `string`[]

Defined in: [types/context.ts:956](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L956)

List of files that have been read during the conversation

---

### filesModified?

> `optional` **filesModified?**: `string`[]

Defined in: [types/context.ts:961](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L961)

List of files that have been modified during the conversation
