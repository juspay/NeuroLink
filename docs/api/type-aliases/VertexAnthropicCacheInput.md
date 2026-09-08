[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / VertexAnthropicCacheInput

# Type Alias: VertexAnthropicCacheInput

> **VertexAnthropicCacheInput** = `object`

Defined in: [types/providers.ts:2512](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2512)

Input to `applyVertexAnthropicCacheBreakpoints`.

## Properties

### system?

> `optional` **system?**: `string`

Defined in: [types/providers.ts:2513](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2513)

---

### tools?

> `optional` **tools?**: [`VertexAnthropicTool`](VertexAnthropicTool.md)[]

Defined in: [types/providers.ts:2514](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2514)

---

### messages

> **messages**: [`VertexAnthropicMessage`](VertexAnthropicMessage.md)[]

Defined in: [types/providers.ts:2515](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2515)

---

### maxHistoryBreakpoints?

> `optional` **maxHistoryBreakpoints?**: `number`

Defined in: [types/providers.ts:2522](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2522)

Cap on how many of the most-recent messages receive a rolling history
breakpoint. Defaults to "use the remaining budget". Two or more gives
cross-turn continuity and resilience against Anthropic's 20-block cache
lookback window on tool-heavy turns.
