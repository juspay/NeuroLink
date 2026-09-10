[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AgenticLoopUsage

# Type Alias: AgenticLoopUsage

> **AgenticLoopUsage** = `object`

Defined in: [types/loopEngine.ts:35](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L35)

## Properties

### inputTokens

> **inputTokens**: `number`

Defined in: [types/loopEngine.ts:36](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L36)

---

### outputTokens

> **outputTokens**: `number`

Defined in: [types/loopEngine.ts:37](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L37)

---

### cacheReadTokens?

> `optional` **cacheReadTokens?**: `number`

Defined in: [types/loopEngine.ts:38](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L38)

---

### cacheWriteTokens?

> `optional` **cacheWriteTokens?**: `number`

Defined in: [types/loopEngine.ts:39](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L39)

---

### reasoningTokens?

> `optional` **reasoningTokens?**: `number`

Defined in: [types/loopEngine.ts:40](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L40)

---

### cacheWrite5mTokens?

> `optional` **cacheWrite5mTokens?**: `number`

Defined in: [types/loopEngine.ts:52](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L52)

Cache writes split by time-to-live, which Anthropic reports separately
from the total under `cache_creation.ephemeral_5m_input_tokens` and
`ephemeral_1h_input_tokens`.

Carried because the Claude-on-Vertex turn span reports both as
`input_cache_creation_5m` / `_1h`, and `cacheWriteTokens` alone cannot
reconstruct them — the two tiers are priced differently, so collapsing
them loses the only signal that says which one a turn actually bought.
Undefined for providers that never report the split.

---

### cacheWrite1hTokens?

> `optional` **cacheWrite1hTokens?**: `number`

Defined in: [types/loopEngine.ts:53](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L53)
