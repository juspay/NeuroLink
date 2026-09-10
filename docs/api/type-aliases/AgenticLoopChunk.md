[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AgenticLoopChunk

# Type Alias: AgenticLoopChunk

> **AgenticLoopChunk** = `object`

Defined in: [types/loopEngine.ts:24](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L24)

One chunk on the engine's stream.

`reasoning` is carried alongside `content` rather than instead of it: the
providers that emit extended thinking (direct Anthropic, Google AI Studio,
Vertex) push a chunk with empty `content` and the thinking delta in
`reasoning`, so a channel typed `{ content: string }` alone would drop
every thinking delta the moment those providers move onto the engine —
silently, since the text path would keep working.

## Properties

### content

> **content**: `string`

Defined in: [types/loopEngine.ts:25](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L25)

---

### reasoning?

> `optional` **reasoning?**: `string`

Defined in: [types/loopEngine.ts:26](https://github.com/juspay/neurolink/blob/release/src/lib/types/loopEngine.ts#L26)
