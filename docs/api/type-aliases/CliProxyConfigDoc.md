[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / CliProxyConfigDoc

# Type Alias: CliProxyConfigDoc

> **CliProxyConfigDoc** = `object`

Defined in: [types/proxy.ts:3078](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3078)

Snapshot of a parsed proxy config file used by CLI primary-account
read/edit/write helpers. Tracks the original format and whether comments
were present (so the CLI can warn that comments will not round-trip).

## Properties

### data

> **data**: `Record`\<`string`, `unknown`\>

Defined in: [types/proxy.ts:3079](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3079)

---

### format

> **format**: `"yaml"` \| `"json"`

Defined in: [types/proxy.ts:3080](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3080)

---

### hadComments

> **hadComments**: `boolean`

Defined in: [types/proxy.ts:3081](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3081)
