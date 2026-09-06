[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AccountQuotaWindow

# Type Alias: AccountQuotaWindow

> **AccountQuotaWindow** = `object`

Defined in: [types/proxy.ts:1392](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1392)

One dynamic limit bucket from the usage API. Provider vocabulary (`kind`,
`group`, `severity`) is preserved verbatim so buckets Anthropic adds later
survive storage and display without a code change.

## Properties

### kind

> **kind**: `string`

Defined in: [types/proxy.ts:1394](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1394)

Provider kind, verbatim ("session", "weekly_all", "weekly_scoped", ...).

---

### group?

> `optional` **group?**: `string`

Defined in: [types/proxy.ts:1396](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1396)

Provider group, verbatim ("session" | "weekly" | future values).

---

### used

> **used**: `number`

Defined in: [types/proxy.ts:1398](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1398)

0.0-1.0 utilization (provider percent / 100).

---

### severity?

> `optional` **severity?**: `string`

Defined in: [types/proxy.ts:1400](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1400)

Provider severity, verbatim ("normal", ...).

---

### status

> **status**: `string`

Defined in: [types/proxy.ts:1402](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1402)

Derived "allowed" | "rejected" (see usageToQuota status mapping).

---

### resetsAt

> **resetsAt**: `number`

Defined in: [types/proxy.ts:1404](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1404)

Unix timestamp (seconds) when this window resets; 0 when unparseable.

---

### isActive?

> `optional` **isActive?**: `boolean`

Defined in: [types/proxy.ts:1405](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1405)

---

### scopeModel?

> `optional` **scopeModel?**: `string`

Defined in: [types/proxy.ts:1407](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1407)

Model display name for model-scoped windows (e.g. "Fable").

---

### scopeModelId?

> `optional` **scopeModelId?**: `string`

Defined in: [types/proxy.ts:1411](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1411)

Wire model id for the scope when the provider reports one
(`scope.model.id`), which matches a request's `model` exactly and so beats
display-name matching. Often null in practice.

---

### scopeSurface?

> `optional` **scopeSurface?**: `string`

Defined in: [types/proxy.ts:1413](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1413)

Surface scope when the provider reports one.

---

### updatedAt?

> `optional` **updatedAt?**: `number`

Defined in: [types/proxy.ts:1418](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1418)

Epoch ms this individual window was observed. Lets a header-derived window
and a usage-API window on the same account age independently — the flat
`lastUpdated` refreshes on every response and would otherwise make a
days-old scoped window look current.

---

### source?

> `optional` **source?**: [`AccountQuotaSource`](AccountQuotaSource.md)

Defined in: [types/proxy.ts:1420](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1420)

Provenance of this window, mirroring AccountQuotaSource.

---

### headerWindow?

> `optional` **headerWindow?**: `string`

Defined in: [types/proxy.ts:1422](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1422)

Raw unified header token for header-derived windows, e.g. "7d_oi".
