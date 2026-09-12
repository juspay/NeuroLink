[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / CliAccountUsageTotals

# Type Alias: CliAccountUsageTotals

> **CliAccountUsageTotals** = `object`

Defined in: [types/proxyClient.ts:157](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L157)

Per-account token and cost totals derived from the proxy's own request log.

`costUsd` is an **API-equivalent** figure: what the recorded tokens would
have cost at published per-token rates. Pooled OAuth accounts are billed by
subscription, so this is a value estimate, never an invoice. Consumers must
label it as such.

## Properties

### requests

> **requests**: `number`

Defined in: [types/proxyClient.ts:158](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L158)

---

### inputTokens

> **inputTokens**: `number`

Defined in: [types/proxyClient.ts:159](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L159)

---

### outputTokens

> **outputTokens**: `number`

Defined in: [types/proxyClient.ts:160](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L160)

---

### cacheReadTokens

> **cacheReadTokens**: `number`

Defined in: [types/proxyClient.ts:161](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L161)

---

### cacheCreationTokens

> **cacheCreationTokens**: `number`

Defined in: [types/proxyClient.ts:162](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L162)

---

### costUsd

> **costUsd**: `number`

Defined in: [types/proxyClient.ts:163](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L163)

---

### unpricedRequests

> **unpricedRequests**: `number`

Defined in: [types/proxyClient.ts:165](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L165)

Requests whose model carried no pricing row, so contributed no cost.

---

### unpricedModels

> **unpricedModels**: `string`[]

Defined in: [types/proxyClient.ts:167](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L167)

Distinct models with no pricing row, so an operator can chase them.

---

### byClient

> **byClient**: `Record`\<`string`, [`CliClientUsageTotals`](CliClientUsageTotals.md)\>

Defined in: [types/proxyClient.ts:174](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L174)

Same totals split by calling CLI, keyed by the derived client name.

Empty for traffic logged before attribution existed — those rows carry no
User-Agent, and guessing one retroactively would invent history.
