[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ResponseInfoContext

# Type Alias: ResponseInfoContext

> **ResponseInfoContext** = `object`

Defined in: [types/proxy.ts:1820](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1820)

Response-side details parsed from the upstream reply (model, finish, tools).

## Properties

### responseModel?

> `optional` **responseModel?**: `string`

Defined in: [types/proxy.ts:1821](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1821)

---

### finishReason?

> `optional` **finishReason?**: `string`

Defined in: [types/proxy.ts:1822](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1822)

---

### stopSequence?

> `optional` **stopSequence?**: `string`

Defined in: [types/proxy.ts:1823](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1823)

---

### toolCalls?

> `optional` **toolCalls?**: `string`[]

Defined in: [types/proxy.ts:1825](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1825)

Names of the tools the model actually invoked (tool_use blocks).
