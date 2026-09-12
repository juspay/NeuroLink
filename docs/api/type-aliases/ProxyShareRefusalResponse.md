[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyShareRefusalResponse

# Type Alias: ProxyShareRefusalResponse

> **ProxyShareRefusalResponse** = `object`

Defined in: [types/proxy.ts:4059](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4059)

A refusal rendered for the wire: status, headers and Anthropic-shaped body.

## Properties

### status

> **status**: `number`

Defined in: [types/proxy.ts:4060](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4060)

---

### headers

> **headers**: `Record`\<`string`, `string`\>

Defined in: [types/proxy.ts:4061](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4061)

---

### body

> **body**: `object`

Defined in: [types/proxy.ts:4062](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L4062)

#### type

> **type**: `"error"`

#### error

> **error**: `object`

##### error.type

> **type**: `string`

##### error.message

> **message**: `string`
