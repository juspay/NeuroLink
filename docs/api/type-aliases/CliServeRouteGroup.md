[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / CliServeRouteGroup

# Type Alias: CliServeRouteGroup

> **CliServeRouteGroup** = `object`

Defined in: [types/cli.ts:1956](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1956)

Minimal route-group shape reflected at runtime by `neurolink serve routes`.
Named with a `CliServe` prefix to disambiguate from the richer RouteGroup
in server.ts (§Rule 9).

## Properties

### prefix

> **prefix**: `string`

Defined in: [types/cli.ts:1957](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1957)

---

### routes

> **routes**: `object`[]

Defined in: [types/cli.ts:1958](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1958)

#### method

> **method**: `string`

#### path

> **path**: `string`

#### description?

> `optional` **description?**: `string`
