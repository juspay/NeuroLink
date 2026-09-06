[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AnthropicUsageWindow

# Type Alias: AnthropicUsageWindow

> **AnthropicUsageWindow** = `object`

Defined in: [types/proxy.ts:1426](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1426)

One utilization window from the OAuth usage endpoint (wire shape, loose).

## Properties

### utilization?

> `optional` **utilization?**: `number` \| `null`

Defined in: [types/proxy.ts:1428](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1428)

0-100 percent (note: NOT the 0-1 fraction used by headers).

---

### resets_at?

> `optional` **resets_at?**: `string` \| `null`

Defined in: [types/proxy.ts:1430](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1430)

ISO-8601 timestamp.
