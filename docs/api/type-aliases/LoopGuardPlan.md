[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / LoopGuardPlan

# Type Alias: LoopGuardPlan

> **LoopGuardPlan** = `object`

Defined in: [types/context.ts:863](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L863)

What the caller should do to reclaim budget. Indices refer to the input array.

## Properties

### fire

> **fire**: `boolean`

Defined in: [types/context.ts:865](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L865)

False when the loop is under threshold and nothing should change.

---

### truncate

> **truncate**: `number`[]

Defined in: [types/context.ts:867](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L867)

Entries whose payload should be replaced by a preview.

---

### drop

> **drop**: `number`[]

Defined in: [types/context.ts:869](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L869)

Entries to remove entirely — always whole batches, never a partial pair.

---

### projectedTokens

> **projectedTokens**: `number`

Defined in: [types/context.ts:871](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L871)

Estimated total after applying the plan, including fixed overhead.
