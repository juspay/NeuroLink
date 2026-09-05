[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / LifecycleChunkPayload

# Type Alias: LifecycleChunkPayload

> **LifecycleChunkPayload** = `object`

Defined in: [types/middleware.ts:330](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L330)

Payload delivered to onChunk callbacks for each streaming chunk.

## Properties

### type

> **type**: `string`

Defined in: [types/middleware.ts:332](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L332)

Chunk type from the AI SDK stream

---

### textDelta?

> `optional` **textDelta?**: `string`

Defined in: [types/middleware.ts:334](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L334)

Text content for text-delta chunks

---

### sequenceNumber

> **sequenceNumber**: `number`

Defined in: [types/middleware.ts:336](https://github.com/juspay/neurolink/blob/release/src/lib/types/middleware.ts#L336)

Zero-based chunk sequence number
