[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ResponseInfoContext

# Type Alias: ResponseInfoContext

> **ResponseInfoContext** = `object`

Defined in: [types/proxy.ts:1797](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1797)

Response-side details parsed from the upstream reply (model, finish, tools).

## Properties

### responseModel?

> `optional` **responseModel?**: `string`

Defined in: [types/proxy.ts:1798](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1798)

---

### finishReason?

> `optional` **finishReason?**: `string`

Defined in: [types/proxy.ts:1799](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1799)

---

### stopSequence?

> `optional` **stopSequence?**: `string`

Defined in: [types/proxy.ts:1800](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1800)

---

### toolCalls?

> `optional` **toolCalls?**: `string`[]

Defined in: [types/proxy.ts:1802](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1802)

Names of the tools the model actually invoked (tool_use blocks).
