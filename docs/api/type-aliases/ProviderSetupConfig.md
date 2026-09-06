[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProviderSetupConfig

# Type Alias: ProviderSetupConfig

> **ProviderSetupConfig** = `object`

Defined in: [types/cli.ts:1479](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1479)

Superset provider-setup config. `endpoint` is Azure-only; other providers
leave it undefined. Pre-consolidation there were 4 near-duplicate types
(Anthropic/Azure/GoogleAI/OpenAI); they are now one.

## Properties

### apiKey?

> `optional` **apiKey?**: `string`

Defined in: [types/cli.ts:1480](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1480)

---

### model?

> `optional` **model?**: `string`

Defined in: [types/cli.ts:1481](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1481)

---

### endpoint?

> `optional` **endpoint?**: `string`

Defined in: [types/cli.ts:1482](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1482)

---

### isReconfiguring?

> `optional` **isReconfiguring?**: `boolean`

Defined in: [types/cli.ts:1483](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1483)
