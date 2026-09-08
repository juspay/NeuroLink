[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / LoopGuardPolicy

# Type Alias: LoopGuardPolicy

> **LoopGuardPolicy** = `object`

Defined in: [types/context.ts:914](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L914)

Tuning for planLoopGuardReclaim.

## Properties

### availableInputTokens

> **availableInputTokens**: `number`

Defined in: [types/context.ts:915](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L915)

---

### fixedOverheadTokens

> **fixedOverheadTokens**: `number`

Defined in: [types/context.ts:917](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L917)

System prompt + tool definitions — rides outside the message array.

---

### thresholdRatio?

> `optional` **thresholdRatio?**: `number`

Defined in: [types/context.ts:919](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L919)

Fraction of the window at which the guard fires.

---

### lowWaterRatio?

> `optional` **lowWaterRatio?**: `number`

Defined in: [types/context.ts:921](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L921)

Fraction of the window the guard reclaims down to once it fires.

---

### protectedTailCount?

> `optional` **protectedTailCount?**: `number`

Defined in: [types/context.ts:923](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L923)

Newest entries the guard must never modify.

---

### calibration?

> `optional` **calibration?**: `number`

Defined in: [types/context.ts:925](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L925)

Observed/estimated token ratio, used to tighten both marks.
