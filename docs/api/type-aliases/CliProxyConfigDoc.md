[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / CliProxyConfigDoc

# Type Alias: CliProxyConfigDoc

> **CliProxyConfigDoc** = `object`

Defined in: [types/proxy.ts:2994](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2994)

Snapshot of a parsed proxy config file used by CLI primary-account
read/edit/write helpers. Tracks the original format and whether comments
were present (so the CLI can warn that comments will not round-trip).

## Properties

### data

> **data**: `Record`\<`string`, `unknown`\>

Defined in: [types/proxy.ts:2995](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2995)

---

### format

> **format**: `"yaml"` \| `"json"`

Defined in: [types/proxy.ts:2996](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2996)

---

### hadComments

> **hadComments**: `boolean`

Defined in: [types/proxy.ts:2997](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2997)
