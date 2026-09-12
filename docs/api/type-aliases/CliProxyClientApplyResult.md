[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / CliProxyClientApplyResult

# Type Alias: CliProxyClientApplyResult

> **CliProxyClientApplyResult** = `object`

Defined in: [types/proxyClient.ts:61](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L61)

Outcome of applying one configurator, for per-client CLI reporting.

## Properties

### id

> **id**: `string`

Defined in: [types/proxyClient.ts:62](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L62)

---

### displayName

> **displayName**: `string`

Defined in: [types/proxyClient.ts:63](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L63)

---

### applied

> **applied**: `boolean`

Defined in: [types/proxyClient.ts:65](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L65)

True only when the configurator actually wrote configuration.

---

### note?

> `optional` **note?**: `string`

Defined in: [types/proxyClient.ts:71](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L71)

Set when the write landed but is not yet in effect — see
CliProxyClientConfigurator.postApplyNote. Callers must render this; a
silent note is the failure it exists to prevent.

---

### error?

> `optional` **error?**: `Error`

Defined in: [types/proxyClient.ts:73](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L73)

Present when the configurator threw; the caller decides how loud to be.
