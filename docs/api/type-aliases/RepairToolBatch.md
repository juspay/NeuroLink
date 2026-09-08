[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / RepairToolBatch

# Type Alias: RepairToolBatch

> **RepairToolBatch** = `object`

Defined in: [types/context.ts:935](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L935)

One contiguous tool batch: the run of `tool_call` messages emitted by a
single agent step, plus the run of `tool_result` messages that follows it.
A step with parallel tool calls writes every call before any result, so the
batch — not adjacency — is the unit that pairing and truncation operate on.
`endIndex` is exclusive.

## Properties

### calls

> **calls**: [`ChatMessage`](ChatMessage.md)[]

Defined in: [types/context.ts:936](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L936)

---

### results

> **results**: [`ChatMessage`](ChatMessage.md)[]

Defined in: [types/context.ts:937](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L937)

---

### endIndex

> **endIndex**: `number`

Defined in: [types/context.ts:938](https://github.com/juspay/neurolink/blob/release/src/lib/types/context.ts#L938)
