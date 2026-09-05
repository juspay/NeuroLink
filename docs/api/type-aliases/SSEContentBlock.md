[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / SSEContentBlock

# Type Alias: SSEContentBlock

> **SSEContentBlock** = `object`

Defined in: [types/proxy.ts:2485](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2485)

Individual content block observed during an SSE stream.

## Properties

### index

> **index**: `number`

Defined in: [types/proxy.ts:2486](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2486)

---

### type

> **type**: `"text"` \| `"thinking"` \| `"tool_use"` \| `"tool_result"`

Defined in: [types/proxy.ts:2487](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2487)

---

### text?

> `optional` **text?**: `string`

Defined in: [types/proxy.ts:2489](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2489)

Accumulated text for text blocks. Capped at MAX_BLOCK_CONTENT_BYTES.

---

### thinking?

> `optional` **thinking?**: `string`

Defined in: [types/proxy.ts:2491](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2491)

Accumulated thinking content. Capped at MAX_BLOCK_CONTENT_BYTES.

---

### toolName?

> `optional` **toolName?**: `string`

Defined in: [types/proxy.ts:2493](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2493)

Tool name for tool_use blocks.

---

### toolId?

> `optional` **toolId?**: `string`

Defined in: [types/proxy.ts:2495](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2495)

Tool call id for tool_use blocks.

---

### toolInput?

> `optional` **toolInput?**: `string`

Defined in: [types/proxy.ts:2497](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2497)

Accumulated partial JSON input for tool_use blocks. Capped at MAX_BLOCK_CONTENT_BYTES.
