[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyStatusPrimaryAccount

# Type Alias: ProxyStatusPrimaryAccount

> **ProxyStatusPrimaryAccount** = `object`

Defined in: [types/proxy.ts:3088](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3088)

Primary-account info exposed by the proxy `/status` endpoint.
`source` is "configured" when the operator's `routing.primaryAccount` is
authenticated and enabled, otherwise "fallback" — either no primary set
or the configured one is missing/disabled.

## Properties

### configured

> **configured**: `string` \| `null`

Defined in: [types/proxy.ts:3089](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3089)

---

### key

> **key**: `string` \| `null`

Defined in: [types/proxy.ts:3090](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3090)

---

### label

> **label**: `string` \| `null`

Defined in: [types/proxy.ts:3091](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3091)

---

### source

> **source**: `"configured"` \| `"fallback"`

Defined in: [types/proxy.ts:3092](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3092)
