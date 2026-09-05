[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyStatusPrimaryAccount

# Type Alias: ProxyStatusPrimaryAccount

> **ProxyStatusPrimaryAccount** = `object`

Defined in: [types/proxy.ts:3004](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3004)

Primary-account info exposed by the proxy `/status` endpoint.
`source` is "configured" when the operator's `routing.primaryAccount` is
authenticated and enabled, otherwise "fallback" — either no primary set
or the configured one is missing/disabled.

## Properties

### configured

> **configured**: `string` \| `null`

Defined in: [types/proxy.ts:3005](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3005)

---

### key

> **key**: `string` \| `null`

Defined in: [types/proxy.ts:3006](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3006)

---

### label

> **label**: `string` \| `null`

Defined in: [types/proxy.ts:3007](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3007)

---

### source

> **source**: `"configured"` \| `"fallback"`

Defined in: [types/proxy.ts:3008](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3008)
