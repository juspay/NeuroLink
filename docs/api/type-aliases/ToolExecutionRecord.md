[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ToolExecutionRecord

# Type Alias: ToolExecutionRecord

> **ToolExecutionRecord** = `object`

Defined in: [types/generate.ts:878](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L878)

One real tool invocation captured during an agentic turn.

Replaces the historical `{name, input, output}` stub on `GenerateResult`:
every record is produced at the actual execution site (AI-SDK loop and the
native Gemini/Anthropic loops alike), so `params`, timing, and error status
reflect what really ran — consumers no longer need proxy "recorder" tools
to observe their own tool traffic.

## Properties

### toolName

> **toolName**: `string`

Defined in: [types/generate.ts:880](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L880)

Tool name as the model called it.

---

### params

> **params**: `unknown`

Defined in: [types/generate.ts:882](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L882)

Parameters the tool was invoked with, as parsed by the loop.

---

### resultText

> **resultText**: `string`

Defined in: [types/generate.ts:888](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L888)

Serialized tool result (JSON when serializable, else String()), bounded
by `toolExecutionCapture.maxResultChars` (default ~8KB). Truncated text
ends with a `…[truncated N chars]` marker.

---

### isError

> **isError**: `boolean`

Defined in: [types/generate.ts:890](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L890)

True when the execution threw or returned an error-shaped result.

---

### startedAt

> **startedAt**: `number`

Defined in: [types/generate.ts:892](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L892)

Epoch milliseconds when the execution started.

---

### durationMs

> **durationMs**: `number`

Defined in: [types/generate.ts:894](https://github.com/juspay/neurolink/blob/release/src/lib/types/generate.ts#L894)

Wall-clock duration of the execution in milliseconds.
