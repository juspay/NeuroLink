[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareRefusalResponse

# Type Alias: ProxyShareRefusalResponse

> **ProxyShareRefusalResponse** = `object`

Defined in: [types/proxy.ts:3975](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3975)

A refusal rendered for the wire: status, headers and Anthropic-shaped body.

## Properties

### status

> **status**: `number`

Defined in: [types/proxy.ts:3976](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3976)

---

### headers

> **headers**: `Record`\<`string`, `string`\>

Defined in: [types/proxy.ts:3977](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3977)

---

### body

> **body**: `object`

Defined in: [types/proxy.ts:3978](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3978)

#### type

> **type**: `"error"`

#### error

> **error**: `object`

##### error.type

> **type**: `string`

##### error.message

> **message**: `string`
