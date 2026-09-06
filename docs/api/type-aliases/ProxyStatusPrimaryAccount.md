[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyStatusPrimaryAccount

# Type Alias: ProxyStatusPrimaryAccount

> **ProxyStatusPrimaryAccount** = `object`

Defined in: [types/proxy.ts:3082](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3082)

Primary-account info exposed by the proxy `/status` endpoint.
`source` is "configured" when the operator's `routing.primaryAccount` is
authenticated and enabled, otherwise "fallback" — either no primary set
or the configured one is missing/disabled.

## Properties

### configured

> **configured**: `string` \| `null`

Defined in: [types/proxy.ts:3083](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3083)

---

### key

> **key**: `string` \| `null`

Defined in: [types/proxy.ts:3084](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3084)

---

### label

> **label**: `string` \| `null`

Defined in: [types/proxy.ts:3085](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3085)

---

### source

> **source**: `"configured"` \| `"fallback"`

Defined in: [types/proxy.ts:3086](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3086)
